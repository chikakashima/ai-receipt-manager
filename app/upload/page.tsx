import { UploadForm } from "@/components/UploadForm";

export default function UploadPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">領収書登録</h1>
        <p className="mt-1 text-sm text-ink/65">画像を読み取り、内容を確認してから保存します。</p>
      </div>
      <UploadForm />
    </div>
  );
}
