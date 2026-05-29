import { NextResponse } from "next/server";
import { saveReceiptWithOptionalImage } from "@/lib/receipt-save";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSupabaseErrorDetails } from "@/lib/supabase-error";
import type { ReceiptInput } from "@/lib/types";

export const dynamic = "force-dynamic";

function readNumber(value: FormDataEntryValue | null) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

function readText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .order("receipt_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ receipts: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message, details: getSupabaseErrorDetails(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    const receipt: ReceiptInput = {
      receipt_date: readText(formData.get("receipt_date")),
      store_name: readText(formData.get("store_name")),
      total_amount: readNumber(formData.get("total_amount")),
      tax_amount: readNumber(formData.get("tax_amount")),
      category: readText(formData.get("category")),
      memo: readText(formData.get("memo"))
    };

    if (!receipt.receipt_date || !receipt.store_name || receipt.total_amount < 0) {
      return NextResponse.json(
        { error: "日付、店舗名、合計金額を確認してください。" },
        { status: 400 }
      );
    }

    const result = await saveReceiptWithOptionalImage({
      receipt,
      image: image instanceof File ? image : null,
      imageName: image instanceof File ? image.name : undefined
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const record = error && typeof error === "object" ? (error as Record<string, unknown>) : {};
    return NextResponse.json(
      {
        error: message,
        details: getSupabaseErrorDetails(error),
        database: record.database,
        storageWarning: record.storageWarning
      },
      { status: 500 }
    );
  }
}
