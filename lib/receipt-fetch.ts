import { getCurrentMonthRange } from "@/lib/format";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { DashboardSummary, Receipt } from "@/lib/types";

export async function getReceipts(): Promise<Receipt[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("receipts")
    .select("*")
    .order("receipt_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const supabase = getSupabaseAdmin();
  const { start, end } = getCurrentMonthRange();

  const [{ data: monthReceipts, error: monthError }, { data: recentReceipts, error: recentError }] =
    await Promise.all([
      supabase
        .from("receipts")
        .select("*")
        .gte("receipt_date", start)
        .lt("receipt_date", end),
      supabase
        .from("receipts")
        .select("*")
        .order("receipt_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(4)
    ]);

  if (monthError) {
    throw monthError;
  }

  if (recentError) {
    throw recentError;
  }

  return {
    monthCount: monthReceipts?.length || 0,
    monthTotal: (monthReceipts || []).reduce((sum, receipt) => sum + receipt.total_amount, 0),
    recentReceipts: recentReceipts || []
  };
}
