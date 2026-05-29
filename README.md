# AI領収書管理アプリ MVP

小規模事業者向けの、AI領収書管理アプリのMVPです。スマホで領収書画像をアップロードすると、OpenAI APIが内容を読み取り、経費データとしてSupabaseに保存します。保存した領収書はカード型UIで一覧表示でき、Excelで開きやすいUTF-8 BOM付きCSVとして出力できます。

ログインなしのデモ版として、まずは「画像アップロード、AI読み取り、確認・修正、保存、一覧、CSV出力」までの一連の動作を確認できる構成にしています。

## 使用技術

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Database
- Supabase Storage
- OpenAI API
- LINE Messaging API
- lucide-react

## 主な機能

- 領収書画像アップロード
- OpenAI APIによる画像解析
- 日付、店舗名、合計金額、税額、勘定科目候補、メモの抽出
- AI読み取り結果の登録前修正
- Supabase Storageへの画像保存
- Supabase Databaseへの経費データ保存
- ダッシュボードで今月の件数と合計金額を表示
- 領収書一覧をカード型UIで表示
- UTF-8 BOM付きCSVダウンロード
- LINE公式アカウントに送られた領収書画像の自動解析・保存

## 画面構成

- `/` ダッシュボード
- `/upload` 領収書アップロード
- `/receipts` 領収書一覧

## 環境変数の設定方法

`.env.local.example`を参考に、プロジェクトルートに`.env.local`を作成します。

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=receipts

APP_BASE_URL=https://your-app.vercel.app

LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=
```

各値の意味は以下です。

- `OPENAI_API_KEY`: OpenAI APIキー
- `OPENAI_MODEL`: 領収書画像解析に使うOpenAIモデル
- `NEXT_PUBLIC_SUPABASE_URL`: SupabaseプロジェクトURL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabaseのservice role key。`sb_publishable_...`ではなく、管理画面のAPI Keysにあるservice role用の秘密鍵を設定します。
- `SUPABASE_STORAGE_BUCKET`: 領収書画像を保存するStorage bucket名
- `APP_BASE_URL`: LINE返信メッセージに含める管理画面URLのベースURL
- `LINE_CHANNEL_ACCESS_TOKEN`: LINE Messaging APIのチャネルアクセストークン
- `LINE_CHANNEL_SECRET`: LINE Messaging APIのチャネルシークレット

`OPENAI_API_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、`LINE_CHANNEL_ACCESS_TOKEN`、`LINE_CHANNEL_SECRET`はサーバー側API Routeだけで使います。フロントエンドには公開しません。

このMVPのStorage bucket名は`receipts`です。`.env.local`の`SUPABASE_STORAGE_BUCKET`、`supabase/schema.sql`で作成するbucket名、保存処理で参照するbucket名はすべて`receipts`に揃えています。

## Supabase SQLの実行方法

Supabaseの管理画面で対象プロジェクトを開き、SQL Editorから`supabase/schema.sql`の内容を実行してください。

このSQLで作成するものは以下です。

- `receipts`テーブル
- `receipt_date`と`created_at`のindex
- 領収書画像保存用の`receipts` Storage bucket

テーブル定義は以下のMVP要件に対応しています。

- `id uuid primary key`
- `receipt_date date`
- `store_name text`
- `total_amount integer`
- `tax_amount integer`
- `category text`
- `memo text`
- `image_url text`
- `line_user_id text`
- `created_at timestamp default now()`

既存テーブルがある場合も、`schema.sql`には`alter table ... add column if not exists line_user_id text;`が含まれているため、そのまま再実行できます。

## ローカル起動方法

依存関係をインストールします。

```bash
npm install
```

開発サーバーを起動します。

```bash
npm run dev
```

Windows PowerShellで`npm`が実行ポリシーにより止まる場合は、次のように`npm.cmd`を使ってください。

```bash
npm.cmd install
npm.cmd run dev
```

起動後、ブラウザで以下を開きます。

```text
http://localhost:3000
```

## 動作確認手順

1. `/`を開き、ダッシュボードが表示されることを確認します。
2. `/upload`を開き、領収書画像を選択します。
3. `AIで読み取る`を押し、日付、店舗名、合計金額、税額、勘定科目候補、メモがフォームに反映されることを確認します。
4. 必要に応じて読み取り結果を修正します。
5. `保存する`を押し、`/receipts`へ遷移することを確認します。
6. 領収書一覧に保存したデータがカード表示されることを確認します。
7. `/`に戻り、今月の件数と合計金額に保存データが反映されることを確認します。
8. `/receipts`または`/`のCSVボタンからCSVをダウンロードします。
9. ExcelでCSVを開き、日本語が文字化けしないことを確認します。

## LINE連携の設定方法

LINE DevelopersでMessaging APIチャネルを作成し、LINE公式アカウントと接続します。

1. [LINE Developers](https://developers.line.biz/)でプロバイダーとMessaging APIチャネルを作成します。
2. チャネルの`Messaging API設定`からチャネルアクセストークンを発行します。
3. `チャネル基本設定`のチャネルシークレットを確認します。
4. `.env.local`に`LINE_CHANNEL_ACCESS_TOKEN`と`LINE_CHANNEL_SECRET`を設定します。
5. LINE DevelopersのWebhook URLに次のURLを設定します。

ローカル確認ではngrokのURLを使います。

```text
https://xxxxx.ngrok-free.app/api/line/webhook
```

Vercelにデプロイした後は、Vercelの本番URLを使います。

```text
https://your-app.vercel.app/api/line/webhook
```

Vercelの環境変数には`APP_BASE_URL=https://your-app.vercel.app`も設定してください。これにより、LINE返信内の管理画面URLが本番URLになります。

Webhookの利用をオンにし、LINE Developersコンソールの`検証`ボタンで疎通確認してください。画像メッセージを送ると、Webhookが画像を取得し、AI解析後にSupabaseへ保存します。

LINEから登録した場合、返信メッセージには送信者本人の`line_user_id`付き管理画面URLが含まれます。

```text
領収書を保存しました。
店舗名：〇〇
合計金額：〇〇円
管理画面：
https://your-app.vercel.app/receipts?line_user_id=Uxxxxxxxx
```

このURLを開くと、その`line_user_id`に紐づく領収書だけを一覧表示します。CSV出力も同じ`line_user_id`で絞り込まれます。

## ngrokを使ったローカルテスト方法

ローカル開発サーバーを起動します。

```bash
npm run dev
```

別のターミナルでngrokを起動します。

```bash
ngrok http 3000
```

表示されたHTTPS URLに`/api/line/webhook`を付けて、LINE DevelopersのWebhook URLに設定します。

```text
https://xxxxx.ngrok-free.app/api/line/webhook
```

環境変数を変更した場合は、Next.jsの開発サーバーを再起動してください。

## 注意事項

- `OPENAI_API_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、`LINE_CHANNEL_ACCESS_TOKEN`、`LINE_CHANNEL_SECRET`は公開しないでください。
- `.env.local`はGit管理しないでください。
- このMVPはログインなしのデモ版です。公開運用する場合は認証、RLS、ユーザー別データ分離を追加してください。
- Supabase Storage bucketはSQLでpublicにしています。実運用では認証付きのprivate bucketも検討してください。
- `Bucket not found`が出る場合は、Supabase SQL Editorで`supabase/schema.sql`を実行済みか、`.env.local`の`SUPABASE_STORAGE_BUCKET=receipts`が保存されているかを確認してください。あわせて、`SUPABASE_SERVICE_ROLE_KEY`にpublishable keyではなくservice role keyを設定しているか確認してください。環境変数を変更した後は開発サーバーを再起動してください。
- AIの読み取り結果は誤る可能性があるため、保存前に必ず確認・修正する前提です。
- `line_user_id`をURLクエリに含める方式はMVP向けの簡易実装です。本格運用ではログイン認証、または推測困難なトークン付きURLでアクセス制御してください。

## 今後の改善案

- ログイン機能
- ユーザー別データ管理
- トークン付き管理画面URL
- 会計ソフト向けCSV対応
- 領収書の検索・絞り込み
- 月別・勘定科目別の集計
- 画像の再解析機能
- 登録データの編集・削除

## 補足

現在の実装では、OpenAI APIキーはサーバー側の解析処理でのみ使用し、Supabase service role keyはサーバー側のSupabaseクライアントでのみ使用します。LINEのチャネルアクセストークンとチャネルシークレットも`/api/line/webhook`だけで使用します。ブラウザ側のアップロード画面はサーバーAPI Routeを呼び出すだけなので、秘密情報を直接扱いません。
