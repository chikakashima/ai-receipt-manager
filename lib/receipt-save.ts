import { getStorageBucket, getSupabaseAdmin, getSupabaseUrl } from "@/lib/supabase";
import { getDatabaseErrorMessage, getSupabaseErrorDetails } from "@/lib/supabase-error";
import type { Receipt, ReceiptInput } from "@/lib/types";

type SaveReceiptOptions = {
  receipt: ReceiptInput;
  image?: Blob | null;
  imageName?: string;
  lineUserId?: string | null;
};

type StorageWarning = Record<string, unknown> | null;

function getSupabaseProjectRef(supabaseUrl: string | undefined) {
  if (!supabaseUrl) {
    return "unknown";
  }

  try {
    return new URL(supabaseUrl).hostname.split(".")[0] || "unknown";
  } catch {
    return "invalid-url";
  }
}

function getImageExtension(imageName: string | undefined, imageType: string | undefined) {
  const nameExt = imageName?.split(".").pop();
  if (nameExt && nameExt !== imageName) {
    return nameExt;
  }

  if (imageType?.includes("png")) {
    return "png";
  }

  if (imageType?.includes("webp")) {
    return "webp";
  }

  return "jpg";
}

export async function saveReceiptWithOptionalImage({
  receipt,
  image,
  imageName,
  lineUserId = null
}: SaveReceiptOptions): Promise<{ receipt: Receipt; storageWarning: StorageWarning }> {
  const supabase = getSupabaseAdmin();
  const bucket = getStorageBucket();
  const supabaseUrl = getSupabaseUrl();
  let imageUrl: string | null = null;
  let storageWarning: StorageWarning = null;

  if (image && image.size > 0) {
    const ext = getImageExtension(imageName, image.type);
    const path = `${crypto.randomUUID()}.${ext}`;

    console.log("[receipts upload] Supabase storage upload target", {
      bucket,
      supabaseUrl,
      projectRef: getSupabaseProjectRef(supabaseUrl),
      fileName: imageName || "line-image",
      fileType: image.type,
      fileSize: image.size
    });

    const { data: bucketInfo, error: bucketError } = await supabase.storage.getBucket(bucket);

    if (bucketError) {
      const details = getSupabaseErrorDetails(bucketError);
      console.error("[receipts upload] Supabase storage bucket lookup failed", {
        bucket,
        supabaseUrl,
        projectRef: getSupabaseProjectRef(supabaseUrl),
        details
      });

      storageWarning = {
        message: "Supabase Storage bucketを確認できなかったため、画像なしでDB保存を続行しました。",
        bucket,
        supabaseUrl,
        projectRef: getSupabaseProjectRef(supabaseUrl),
        operation: "getBucket",
        details
      };
    } else {
      console.log("[receipts upload] Supabase storage bucket found", {
        bucket: bucketInfo.name,
        public: bucketInfo.public
      });

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, image, {
          cacheControl: "31536000",
          contentType: image.type || "image/jpeg",
          upsert: false
        });

      if (uploadError) {
        const details = getSupabaseErrorDetails(uploadError);
        console.error("[receipts upload] Supabase storage upload failed", {
          bucket,
          supabaseUrl,
          projectRef: getSupabaseProjectRef(supabaseUrl),
          path,
          details
        });

        storageWarning = {
          message: "領収書画像のアップロードに失敗したため、画像なしでDB保存を続行しました。",
          bucket,
          supabaseUrl,
          projectRef: getSupabaseProjectRef(supabaseUrl),
          operation: "upload",
          path,
          details
        };
      } else if (bucketInfo.public) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        imageUrl = data.publicUrl;
      } else {
        console.warn("[receipts upload] Bucket is private; public image URL was not stored", {
          bucket,
          path
        });

        storageWarning = {
          message:
            "画像アップロードは成功しましたが、bucketがprivateのため公開URLは保存しませんでした。画像表示にはpublic bucketまたはsigned URL対応が必要です。",
          bucket,
          supabaseUrl,
          projectRef: getSupabaseProjectRef(supabaseUrl),
          operation: "getPublicUrl",
          path,
          bucketPublic: bucketInfo.public
        };
      }
    }
  }

  const insertPayload = {
    ...receipt,
    image_url: imageUrl,
    line_user_id: lineUserId
  };

  console.log("[receipts insert] Supabase insert payload", {
    columns: Object.keys(insertPayload),
    hasImageUrl: Boolean(imageUrl),
    hasLineUserId: Boolean(lineUserId),
    storageWarning: Boolean(storageWarning)
  });

  const { data, error } = await supabase
    .from("receipts")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    const details = getSupabaseErrorDetails(error);
    console.error("[receipts insert] Supabase insert failed", {
      table: "receipts",
      details
    });

    const dbError = new Error(getDatabaseErrorMessage(details));
    Object.assign(dbError, {
      database: {
        table: "receipts",
        payloadColumns: Object.keys(insertPayload),
        details
      },
      storageWarning
    });
    throw dbError;
  }

  return { receipt: data, storageWarning };
}
