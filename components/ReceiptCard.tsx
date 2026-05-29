import Image from "next/image";
import { CalendarDays, FileText, Store } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Receipt } from "@/lib/types";

export function ReceiptCard({ receipt }: { receipt: Receipt }) {
  return (
    <article className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
      {receipt.image_url ? (
        <div className="relative h-44 w-full bg-line">
          <Image
            src={receipt.image_url}
            alt={`${receipt.store_name}の領収書`}
            fill
            sizes="(min-width: 768px) 360px, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm text-ink/65">
              <Store size={16} aria-hidden="true" />
              <span className="truncate">{receipt.store_name}</span>
            </p>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(receipt.total_amount)}</p>
          </div>
          <span className="shrink-0 rounded-full bg-mint/10 px-3 py-1 text-xs font-semibold text-mint">
            {receipt.category}
          </span>
        </div>
        <div className="grid gap-2 text-sm text-ink/70">
          <p className="flex items-center gap-2">
            <CalendarDays size={16} aria-hidden="true" />
            {formatDate(receipt.receipt_date)}
          </p>
          <p>税額 {formatCurrency(receipt.tax_amount)}</p>
          {receipt.memo ? (
            <p className="flex items-start gap-2 rounded-lg bg-paper px-3 py-2">
              <FileText className="mt-0.5 shrink-0" size={16} aria-hidden="true" />
              <span>{receipt.memo}</span>
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
