import OpenAI from "openai";
import type { ReceiptInput } from "@/lib/types";

const fallback: ReceiptInput = {
  receipt_date: new Date().toISOString().slice(0, 10),
  store_name: "未取得",
  total_amount: 0,
  tax_amount: 0,
  category: "消耗品費",
  memo: ""
};

function cleanJson(raw: string) {
  return raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
}

function normalizeReceipt(value: Partial<ReceiptInput>): ReceiptInput {
  const storeName = value.store_name === null ? "未取得" : value.store_name || fallback.store_name;

  return {
    receipt_date: value.receipt_date || fallback.receipt_date,
    store_name: storeName,
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
          "You extract Japanese receipt data. Return only valid JSON. Amounts must be integer JPY. For store_name, prioritize the actual shop, company, merchant, facility, or service provider name. Do not use station names, addresses, phone numbers, invoice registration numbers, or generic location labels as store_name. For credit card slips, prefer merchant name, used shop name, or company name. If only an address or station name is visible, set store_name to null. If uncertain, use null or 0 and explain uncertainty briefly in memo."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              '領収書画像から次のJSONだけを返してください: {"receipt_date":"YYYY-MM-DD","store_name":"店舗名またはnull","total_amount":0,"tax_amount":0,"category":"勘定科目候補","memo":"補足"}。店舗名抽出ルール: レシートや領収書では店名・会社名・施設名を優先してください。「駅名」「住所」「電話番号」「登録番号」は店舗名として扱わないでください。クレジットカード利用票の場合、加盟店名・利用店名・会社名があればそれを優先してください。店舗名が不明確な場合は、無理に駅名を入れずnullにしてください。住所や駅名しか読み取れない場合もstore_nameはnullにしてください。勘定科目は日本の小規模事業者向けに、消耗品費・旅費交通費・通信費・会議費・接待交際費・新聞図書費・雑費などから自然な候補を選んでください。'
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
