import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { analyzeReceiptImage } from "@/lib/openai-receipt";
import { saveReceiptWithOptionalImage } from "@/lib/receipt-save";

type LineWebhookBody = {
  events?: LineWebhookEvent[];
};

type LineWebhookEvent = {
  type: string;
  replyToken?: string;
  source?: {
    userId?: string;
  };
  message?: {
    id?: string;
    type?: string;
  };
};

const LINE_API_BASE = "https://api.line.me";
const LINE_DATA_API_BASE = "https://api-data.line.me";

function getLineEnv() {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
  const channelSecret = process.env.LINE_CHANNEL_SECRET?.trim();

  if (!channelAccessToken || !channelSecret) {
    throw new Error("LINE_CHANNEL_ACCESS_TOKEN and LINE_CHANNEL_SECRET are required.");
  }

  return { channelAccessToken, channelSecret };
}

function verifyLineSignature(body: string, signature: string | null, channelSecret: string) {
  if (!signature) {
    return false;
  }

  const expected = crypto.createHmac("sha256", channelSecret).update(body).digest("base64");
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  return (
    expectedBuffer.length === signatureBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}

async function replyLineMessage(replyToken: string | undefined, text: string, channelAccessToken: string) {
  if (!replyToken) {
    return;
  }

  const response = await fetch(`${LINE_API_BASE}/v2/bot/message/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${channelAccessToken}`
    },
    body: JSON.stringify({
      replyToken,
      messages: [
        {
          type: "text",
          text
        }
      ]
    })
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("[line webhook] Reply failed", {
      status: response.status,
      body
    });
  }
}

async function fetchLineImage(messageId: string, channelAccessToken: string) {
  const response = await fetch(`${LINE_DATA_API_BASE}/v2/bot/message/${messageId}/content`, {
    headers: {
      Authorization: `Bearer ${channelAccessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`LINE画像取得に失敗しました。status=${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await response.arrayBuffer();

  return new Blob([arrayBuffer], { type: contentType });
}

async function handleLineEvent(event: LineWebhookEvent, channelAccessToken: string) {
  if (event.type !== "message" || event.message?.type !== "image" || !event.message.id) {
    await replyLineMessage(
      event.replyToken,
      "領収書画像を送信してください。画像を受け取るとAIで読み取って保存します。",
      channelAccessToken
    );
    return;
  }

  try {
    const image = await fetchLineImage(event.message.id, channelAccessToken);
    const receipt = await analyzeReceiptImage(image);

    if (!receipt.store_name || receipt.total_amount <= 0) {
      receipt.memo = [receipt.memo, "LINE登録: AI読み取り結果に未確定項目があります。"].filter(Boolean).join(" ");
    }

    const result = await saveReceiptWithOptionalImage({
      receipt,
      image,
      imageName: `${event.message.id}.jpg`,
      lineUserId: event.source?.userId || null
    });

    const warning = result.storageWarning ? "\n画像URLは保存されていない可能性があります。" : "";
    await replyLineMessage(
      event.replyToken,
      `保存しました。\n店舗名: ${receipt.store_name || "未取得"}\n合計金額: ${receipt.total_amount}円${warning}`,
      channelAccessToken
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[line webhook] Receipt processing failed", { message });
    await replyLineMessage(
      event.replyToken,
      `解析または保存に失敗しました。\n${message}`,
      channelAccessToken
    );
  }
}

export async function POST(request: Request) {
  try {
    const { channelAccessToken, channelSecret } = getLineEnv();
    const body = await request.text();
    const signature = request.headers.get("x-line-signature");

    if (!verifyLineSignature(body, signature, channelSecret)) {
      return NextResponse.json({ error: "Invalid LINE signature." }, { status: 401 });
    }

    const payload = JSON.parse(body) as LineWebhookBody;
    const events = payload.events || [];

    await Promise.all(events.map((event) => handleLineEvent(event, channelAccessToken)));

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[line webhook] Request failed", { message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
