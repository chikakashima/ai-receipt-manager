"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Save, ScanLine, UploadCloud } from "lucide-react";
import type { ReceiptInput } from "@/lib/types";

const initialReceipt: ReceiptInput = {
  receipt_date: new Date().toISOString().slice(0, 10),
  store_name: "",
  total_amount: 0,
  tax_amount: 0,
  category: "消耗品費",
  memo: ""
};

const categories = [
  "消耗品費",
  "旅費交通費",
  "通信費",
  "会議費",
  "接待交際費",
  "新聞図書費",
  "雑費"
];

export function UploadForm() {
  const router = useRouter();
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [receipt, setReceipt] = useState<ReceiptInput>(initialReceipt);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const canAnalyze = useMemo(() => Boolean(image && !isAnalyzing), [image, isAnalyzing]);

  function updateReceipt<K extends keyof ReceiptInput>(key: K, value: ReceiptInput[K]) {
    setReceipt((current) => ({ ...current, [key]: value }));
  }

  function onImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    setImage(file);
    setHasAnalyzed(false);
    setError("");

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(file ? URL.createObjectURL(file) : "");
  }

  async function analyze() {
    if (!image) {
      return;
    }

    setIsAnalyzing(true);
    setError("");

    const formData = new FormData();
    formData.append("image", image);

    try {
      const response = await fetch("/api/analyze-receipt", {
        method: "POST",
        body: formData
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "AI解析に失敗しました。");
      }

      setReceipt(result.receipt);
      setHasAnalyzed(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "AI解析に失敗しました。");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!image) {
      setError("領収書画像を選択してください。");
      return;
    }

    setIsSaving(true);
    setError("");

    const formData = new FormData();
    formData.append("image", image);
    formData.append("receipt_date", receipt.receipt_date);
    formData.append("store_name", receipt.store_name);
    formData.append("total_amount", String(receipt.total_amount));
    formData.append("tax_amount", String(receipt.tax_amount));
    formData.append("category", receipt.category);
    formData.append("memo", receipt.memo);

    try {
      const response = await fetch("/api/receipts", {
        method: "POST",
        body: formData
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "保存に失敗しました。");
      }

      router.push("/receipts");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
        <label
          htmlFor="receipt-image"
          className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-line bg-paper px-4 py-6 text-center"
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="選択した領収書"
              className="max-h-72 w-full rounded-lg object-contain"
            />
          ) : (
            <>
              <UploadCloud className="mb-3 text-mint" size={36} aria-hidden="true" />
              <span className="text-base font-bold">画像を選択</span>
              <span className="mt-1 text-sm text-ink/60">スマホの写真またはスクリーンショット</span>
            </>
          )}
        </label>
        <input
          id="receipt-image"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onImageChange}
          className="sr-only"
        />
        <button
          type="button"
          onClick={analyze}
          disabled={!canAnalyze}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-mint px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-ink/30"
        >
          {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <ScanLine size={18} />}
          AIで読み取る
        </button>
      </section>

      <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <Check className={hasAnalyzed ? "text-mint" : "text-ink/30"} size={20} aria-hidden="true" />
          <h2 className="font-bold">読み取り結果</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            日付
            <input
              type="date"
              value={receipt.receipt_date}
              onChange={(event) => updateReceipt("receipt_date", event.target.value)}
              className="min-h-12 rounded-lg border border-line bg-white px-3 text-base"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            店舗名
            <input
              value={receipt.store_name}
              onChange={(event) => updateReceipt("store_name", event.target.value)}
              className="min-h-12 rounded-lg border border-line bg-white px-3 text-base"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            合計金額
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={receipt.total_amount}
              onChange={(event) => updateReceipt("total_amount", Number(event.target.value))}
              className="min-h-12 rounded-lg border border-line bg-white px-3 text-base"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            税額
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={receipt.tax_amount}
              onChange={(event) => updateReceipt("tax_amount", Number(event.target.value))}
              className="min-h-12 rounded-lg border border-line bg-white px-3 text-base"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            勘定科目
            <select
              value={receipt.category}
              onChange={(event) => updateReceipt("category", event.target.value)}
              className="min-h-12 rounded-lg border border-line bg-white px-3 text-base"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold sm:col-span-2">
            メモ
            <textarea
              value={receipt.memo}
              onChange={(event) => updateReceipt("memo", event.target.value)}
              rows={4}
              className="rounded-lg border border-line bg-white px-3 py-3 text-base"
            />
          </label>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg bg-coral/10 px-3 py-2 text-sm font-semibold text-coral">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSaving}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-ink/40"
        >
          {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          保存する
        </button>
      </section>
    </form>
  );
}
