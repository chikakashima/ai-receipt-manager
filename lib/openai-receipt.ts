import OpenAI from "openai";
import type { ReceiptInput } from "@/lib/types";

const fallback: ReceiptInput = {
  receipt_date: new Date().toISOString().slice(0, 10),
  store_name: "",
  total_amount: 0,
  tax_amount: 0,
  category: "消耗品費",
  memo: ""
};

function cleanJson(raw: string) {
  return raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
}

function normalizeReceipt(value: Partial<ReceiptInput>): ReceiptInput {
  return {
    receipt_date: value.receipt_date || fallback.receipt_date,
    store_name: value.store_name || "",
    total_amount: Number.isFinite(Number(value.total_amount)) ? Math.round(Number(value.total_amount)) : 0,
    tax_amount: Number.isFinite(Number(value.tax_amount)) ? Math.round(Number(value.tax_amount)) : 0,
    category: value.category || "消耗品費",
    memo: value.memo || ""
  };
}

export async function analyzeReceiptImage(image: Blob) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const arrayBuffer = await image.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const dataUrl = `data:${image.type || "image/jpeg"};base64,${base64}`;

  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You extract Japanese receipt data. Return only valid JSON. Amounts must be integer JPY. If uncertain, use empty text or 0 and explain uncertainty briefly in memo."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              '領収書画像から次のJSONだけを返してください: {"receipt_date":"YYYY-MM-DD","store_name":"店舗名","total_amount":0,"tax_amount":0,"category":"勘定科目候補","memo":"補足"}。勘定科目は日本の小規模事業者向けに、消耗品費・旅費交通費・通信費・会議費・接待交際費・新聞図書費・雑費などから自然な候補を選んでください。'
          },
          {
            type: "image_url",
            image_url: {
              url: dataUrl,
              detail: "high"
            }
          }
        ]
      }
    ]
  });

  const content = completion.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(cleanJson(content)) as Partial<ReceiptInput>;

  return normalizeReceipt(parsed);
}
