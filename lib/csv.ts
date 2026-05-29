import type { Receipt } from "@/lib/types";

const headers = [
  "日付",
  "店舗名",
  "合計金額",
  "税額",
  "勘定科目",
  "メモ",
  "画像URL",
  "登録日時"
];

function escapeCsvCell(value: string | number | null) {
  const text = value === null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatCsvDate(value: string) {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) {
    return value;
  }

  return `${year}/${month}/${day}`;
}

function formatCsvDateTime(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return [
    `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  ].join(" ");
}

export function receiptsToCsv(receipts: Receipt[]) {
  const rows = receipts.map((receipt) => [
    formatCsvDate(receipt.receipt_date),
    receipt.store_name,
    receipt.total_amount,
    receipt.tax_amount,
    receipt.category,
    receipt.memo,
    receipt.image_url,
    formatCsvDateTime(receipt.created_at)
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");

  return `\uFEFF${csv}`;
}
