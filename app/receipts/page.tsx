import { Download } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ReceiptCard } from "@/components/ReceiptCard";
import { getReceipts } from "@/lib/receipt-fetch";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    line_user_id?: string;
  }>;
};

export default async function ReceiptsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const lineUserId = params?.line_user_id?.trim();
  const csvHref = lineUserId
    ? `/api/receipts/csv?line_user_id=${encodeURIComponent(lineUserId)}`
    : "/api/receipts/csv";
  const receipts = await getReceipts({ lineUserId }).catch(() => null);

  if (!receipts) {
    return (
      <div className="rounded-lg border border-line bg-white p-6 shadow-soft">
        <h1 className="text-xl font-bold">領収書を取得できません</h1>
        <p className="mt-2 text-sm text-ink/65">
          `.env.local`とSupabaseの`receipts`テーブル、Storageバケット設定を確認してください。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">領収書一覧</h1>
          <p className="mt-1 text-sm text-ink/65">
            {receipts.length}件の経費データ{lineUserId ? " / LINEユーザー別" : ""}
          </p>
        </div>
        <a
          href={csvHref}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-bold text-white"
        >
          <Download size={18} aria-hidden="true" />
          CSV
        </a>
      </div>
      {receipts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {receipts.map((receipt) => (
            <ReceiptCard key={receipt.id} receipt={receipt} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
