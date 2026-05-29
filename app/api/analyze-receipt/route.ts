import { NextResponse } from "next/server";
import { analyzeReceiptImage } from "@/lib/openai-receipt";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File) || image.size === 0) {
      return NextResponse.json({ error: "画像ファイルを選択してください。" }, { status: 400 });
    }

    return NextResponse.json({ receipt: await analyzeReceiptImage(image) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
