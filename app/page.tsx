import Link from "next/link";
import { ArrowRight, Download, UploadCloud } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ReceiptCard } from "@/components/ReceiptCard";
import { formatCurrency } from "@/lib/format";
import { getDashboardSummary } from "@/lib/receipt-fetch";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const summary = await getDashboardSummary().catch(() => null);

  if (!summary) {
    return (
      <div className="rounded-lg border border-line bg-white p-6 shadow-soft">
        <h1 className="text-xl font-bold">環境変数を設定してください</h1>
        <p className="mt-2 text-sm text-ink/65">
          `.env.local`にOpenAIとSupabaseの値を設定し、Supabaseで`supabase/schema.sql`を実行すると使えます。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <p className="text-sm font-semibold text-ink/65">今月の件数</p>
          <p className="mt-3 text-4xl font-bold">{summary.monthCount}</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <p className="text-sm font-semibold text-ink/65">今月の合計金額</p>
          <p className="mt-3 text-4xl font-bold">{formatCurrency(summary.monthTotal)}</p>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <Link
          href="/upload"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-mint px-4 py-3 text-sm font-bold text-white sm:flex-none"
        >
          <UploadCloud size={18} aria-hidden="true" />
          領収書を登録
        </Link>
        <a
          href="/api/receipts/csv"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 py-3 text-sm font-bold text-ink sm:flex-none"
        >
          <Download size={18} aria-hidden="true" />
          CSV
        </a>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold">最近の領収書</h1>
          <Link href="/receipts" className="inline-flex items-center gap-1 text-sm font-bold text-mint">
            一覧
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        {summary.recentReceipts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {summary.recentReceipts.map((receipt) => (
              <ReceiptCard key={receipt.id} receipt={receipt} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>
    </div>
  );
}
