import { NextResponse } from "next/server";
import { receiptsToCsv } from "@/lib/csv";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

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

    return new NextResponse(receiptsToCsv(data || []), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="receipts.csv"'
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
