import { NextResponse } from "next/server";
import { receiptsToCsv } from "@/lib/csv";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const lineUserId = url.searchParams.get("line_user_id")?.trim();
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("receipts")
      .select("*")
      .order("receipt_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (lineUserId) {
      query = query.eq("line_user_id", lineUserId);
    }

    const { data, error } = await query;

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
