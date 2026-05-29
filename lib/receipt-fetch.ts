import { getCurrentMonthRange } from "@/lib/format";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { DashboardSummary, Receipt } from "@/lib/types";

export type ReceiptFilters = {
  lineUserId?: string;
};

function applyReceiptFilters<T extends { eq: (column: string, value: string) => T }>(
  query: T,
  filters: ReceiptFilters = {}
) {
  if (filters.lineUserId) {
    return query.eq("line_user_id", filters.lineUserId);
  }

  return query;
}

export async function getReceipts(filters: ReceiptFilters = {}): Promise<Receipt[]> {
  const supabase = getSupabaseAdmin();
  const query = supabase
    .from("receipts")
    .select("*")
    .order("receipt_date", { ascending: false })
    .order("created_at", { ascending: false });

  const { data, error } = await applyReceiptFilters(query, filters);

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getDashboardSummary(filters: ReceiptFilters = {}): Promise<DashboardSummary> {
  const supabase = getSupabaseAdmin();
  const { start, end } = getCurrentMonthRange();

  const monthQuery = supabase
    .from("receipts")
    .select("*")
    .gte("receipt_date", start)
    .lt("receipt_date", end);

  const recentQuery = supabase
    .from("receipts")
    .select("*")
    .order("receipt_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(4);

  const [{ data: monthReceipts, error: monthError }, { data: recentReceipts, error: recentError }] =
    await Promise.all([applyReceiptFilters(monthQuery, filters), applyReceiptFilters(recentQuery, filters)]);

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
