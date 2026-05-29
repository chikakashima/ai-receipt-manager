export function getSupabaseErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") {
    return { message: String(error) };
  }

  const record = error as Record<string, unknown>;
  return {
    name: typeof record.name === "string" ? record.name : undefined,
    message: typeof record.message === "string" ? record.message : undefined,
    details: typeof record.details === "string" ? record.details : undefined,
    hint: typeof record.hint === "string" ? record.hint : undefined,
    code: typeof record.code === "string" ? record.code : undefined,
    status: typeof record.status === "number" || typeof record.status === "string" ? record.status : undefined,
    statusCode:
      typeof record.statusCode === "number" || typeof record.statusCode === "string"
        ? record.statusCode
        : undefined,
    error: typeof record.error === "string" ? record.error : undefined
  };
}

export function getDatabaseErrorMessage(details: ReturnType<typeof getSupabaseErrorDetails>) {
  if (details.code === "PGRST205") {
    return "receiptsテーブルがSupabaseのpublicスキーマに見つかりません。Supabase SQL Editorでsupabase/schema.sqlを実行し、テーブル作成後に少し待ってから再試行してください。";
  }

  return "領収書データのDB保存に失敗しました。receiptsテーブルのカラム名、型、制約を確認してください。";
}
