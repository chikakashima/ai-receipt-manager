import Link from "next/link";
import { UploadCloud } from "lucide-react";

export function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-line bg-white p-8 text-center shadow-soft">
      <UploadCloud className="mx-auto mb-3 text-mint" size={34} aria-hidden="true" />
      <p className="text-lg font-bold">領収書がまだありません</p>
      <p className="mt-2 text-sm text-ink/65">最初の画像をアップロードして、AI読み取りを試せます。</p>
      <Link
        href="/upload"
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white"
      >
        <UploadCloud size={18} aria-hidden="true" />
        領収書を登録
      </Link>
    </div>
  );
}
