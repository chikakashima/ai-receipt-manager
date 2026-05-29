import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, ReceiptText, UploadCloud } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI領収書管理",
  description: "領収書画像をAIで読み取り、経費データとして管理するMVP"
};

const navItems = [
  { href: "/", label: "集計", icon: BarChart3 },
  { href: "/upload", label: "登録", icon: UploadCloud },
  { href: "/receipts", label: "一覧", icon: ReceiptText }
];

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="text-ink antialiased">
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-24 pt-5 sm:px-6 lg:px-8">
          <header className="mb-6 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold tracking-normal">
              <span className="grid size-9 place-items-center rounded-lg bg-mint text-white shadow-soft">
                <ReceiptText size={20} aria-hidden="true" />
              </span>
              <span>AI領収書管理</span>
            </Link>
            <Link
              href="/upload"
              className="hidden items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white shadow-soft sm:flex"
            >
              <UploadCloud size={18} aria-hidden="true" />
              登録
            </Link>
          </header>
          <main className="flex-1">{children}</main>
        </div>
        <nav className="fixed inset-x-0 bottom-0 border-t border-line bg-paper/95 px-4 py-2 shadow-soft backdrop-blur sm:hidden">
          <div className="mx-auto grid max-w-sm grid-cols-3 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-xs font-semibold text-ink"
                >
                  <Icon size={20} aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </body>
    </html>
  );
}
