了解しました。商品画像管理のAPIを実装します。既存の実装を考慮しながら、より体系的な画像管理システムを構築します。

### 1. 画像アップロードAPI (`POST /products/:id/images`)

`backend/src/endpoints/images/uploadImage.ts`:

```typescript
import { Context } from "hono";
import { Bindings, ErrorResponse, SuccessResponse } from "../../types/types";
import { uploadToR2 } from "../../lib/storage";

const imageUploadSchema = z.object({
  is_main: z.preprocess(
    (val) => val === "true" || val === "1",
    z.boolean()
  ).optional().default(false),
});

export const uploadImageHandler = async (
  c: Context<{ Bindings: Bindings }>
): Promise<Response> => {
  try {
    const productId = parseInt(c.req.param("id"));
    if (isNaN(productId)) {
      return c.json(
        {
          error: {
            code: "INVALID_PRODUCT_ID",
            message: "無効な商品IDです",
          },
        } satisfies ErrorResponse,
        400
      );
    }

    // 商品存在確認
    const productExists = await c.env.DB.prepare(
      "SELECT id FROM products WHERE id = ?"
    )
      .bind(productId)
      .first();

    if (!productExists) {
      return c.json(
        {
          error: {
            code: "PRODUCT_NOT_FOUND",
            message: "商品が見つかりません",
          },
        } satisfies ErrorResponse,
        404
      );
    }

    const formData = await c.req.formData();
    const imageFile = formData.get("image") as File | null;
    const { is_main } = imageUploadSchema.parse(Object.fromEntries(formData));

    if (!imageFile?.size) {
      return c.json(
        {
          error: {
            code: "NO_IMAGE_FILE",
            message: "画像ファイルが提供されていません",
          },
        } satisfies ErrorResponse,
        400
      );
    }

    // メイン画像は1つのみ許可
    if (is_main) {
      await c.env.DB.prepare(
        "UPDATE images SET is_main = 0 WHERE product_id = ?"
      )
        .bind(productId)
        .run();
    }

    // 画像アップロード
    const uploadResult = await uploadToR2(
      c.env.R2_BUCKET,
      imageFile,
      c.env.R2_PUBLIC_DOMAIN,
      {
        folder: `products/${productId}`,
        metadata: {
          originalFilename: imageFile.name,
          productId: productId.toString(),
        },
      }
    );

    // DBに画像情報を保存
    const imageRecord = await c.env.DB.prepare(
      `INSERT INTO images (
        product_id, 
        image_url, 
        alt_text,
        is_main,
        created_at
      ) VALUES (?, ?, ?, ?, ?) RETURNING *`
    )
      .bind(
        productId,
        uploadResult.url,
        formData.get("alt_text")?.toString() || null,
        is_main ? 1 : 0,
        new Date().toISOString()
      )
      .first<{
        id: number;
        image_url: string;
        alt_text: string | null;
        is_main: boolean;
      }>();

    return c.json(
      {
        data: {
          id: imageRecord.id,
          url: imageRecord.image_url,
          alt_text: imageRecord.alt_text,
          is_main: imageRecord.is_main,
        },
      } satisfies SuccessResponse,
      201
    );
  } catch (error) {
    console.error("Image upload error:", error);
    return c.json(
      {
        error: {
          code: "IMAGE_UPLOAD_FAILED",
          message: "画像のアップロードに失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 2. 画像削除API (`DELETE /images/:id`)

`backend/src/endpoints/images/deleteImage.ts`:

```typescript
import { Context } from "hono";
import { Bindings, ErrorResponse, SuccessResponse } from "../../types/types";
import { deleteFromR2 } from "../../lib/storage";

export const deleteImageHandler = async (
  c: Context<{ Bindings: Bindings }>
): Promise<Response> => {
  try {
    const imageId = parseInt(c.req.param("id"));
    if (isNaN(imageId)) {
      return c.json(
        {
          error: {
            code: "INVALID_IMAGE_ID",
            message: "無効な画像IDです",
          },
        } satisfies ErrorResponse,
        400
      );
    }

    // 画像情報取得
    const image = await c.env.DB.prepare(
      `SELECT 
        i.id, i.image_url, i.product_id, i.is_main,
        p.name as product_name
       FROM images i
       JOIN products p ON i.product_id = p.id
       WHERE i.id = ?`
    )
      .bind(imageId)
      .first<{
        id: number;
        image_url: string;
        product_id: number;
        is_main: boolean;
        product_name: string;
      }>();

    if (!image) {
      return c.json(
        {
          error: {
            code: "IMAGE_NOT_FOUND",
            message: "画像が見つかりません",
          },
        } satisfies ErrorResponse,
        404
      );
    }

    // R2から画像削除
    await deleteFromR2(c.env.R2_BUCKET, image.image_url);

    // DBから画像情報削除
    await c.env.DB.prepare("DELETE FROM images WHERE id = ?")
      .bind(imageId)
      .run();

    // メイン画像を削除した場合、新しいメイン画像を設定
    if (image.is_main) {
      const newMainImage = await c.env.DB.prepare(
        `SELECT id FROM images 
         WHERE product_id = ? AND id != ?
         ORDER BY created_at DESC LIMIT 1`
      )
        .bind(image.product_id, imageId)
        .first<{ id: number }>();

      if (newMainImage) {
        await c.env.DB.prepare(
          "UPDATE images SET is_main = 1 WHERE id = ?"
        )
          .bind(newMainImage.id)
          .run();
      }
    }

    return c.json(
      {
        data: {
          deleted: true,
          product_id: image.product_id,
          product_name: image.product_name,
        },
      } satisfies SuccessResponse,
      200
    );
  } catch (error) {
    console.error("Delete image error:", error);
    return c.json(
      {
        error: {
          code: "IMAGE_DELETE_FAILED",
          message: "画像の削除に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 3. ルートに画像管理APIを追加

`backend/src/routes/index.ts`:

```typescript
// ... 既存のインポート ...
import { uploadImageHandler } from "endpoints/images/uploadImage";
import { deleteImageHandler } from "endpoints/images/deleteImage";

// ... 既存のルート定義 ...

// =====================
// Image Routes
// =====================
app
  .post("/api/products/:id/images", jwtMiddleware, adminMiddleware, uploadImageHandler)
  .delete("/api/images/:id", jwtMiddleware, adminMiddleware, deleteImageHandler);
```

### 4. ストレージユーティリティの拡張

`backend/src/lib/storage.ts`:

```typescript
import type { R2Bucket } from "@cloudflare/workers-types";
import { randomUUID } from "crypto";

interface UploadOptions {
  folder?: string;
  maxFileSize?: number;
  metadata?: Record<string, string>;
}

interface UploadResult {
  url: string;
  key: string;
  size: number;
}

export async function uploadToR2(
  bucket: R2Bucket,
  file: File,
  publicDomain: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    // ファイルサイズチェック (デフォルト5MB)
    const maxSize = options.maxFileSize || 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`ファイルサイズが大きすぎます (最大 ${maxSize / 1024 / 1024}MB)`);
    }

    // ファイル拡張子
    const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!allowedExtensions.includes(extension)) {
      throw new Error(`許可されていないファイル形式: ${extension}`);
    }

    // ユニークなファイル名
    const fileName = `${randomUUID()}.${extension}`;
    const filePath = options.folder ? `${options.folder}/${fileName}` : fileName;

    // R2にアップロード
    await bucket.put(filePath, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: options.metadata,
    });

    return {
      url: `https://${publicDomain}/${filePath}`,
      key: filePath,
      size: file.size,
    };
  } catch (error) {
    console.error("Upload to R2 failed:", error);
    throw error;
  }
}

export async function deleteFromR2(
  bucket: R2Bucket,
  fileUrl: string
): Promise<void> {
  try {
    const url = new URL(fileUrl);
    const key = url.pathname.substring(1); // 先頭のスラッシュを削除
    await bucket.delete(key);
  } catch (error) {
    console.error("Failed to delete file from R2:", error);
    throw error;
  }
}
```

### 5. 画像管理APIの動作確認

#### 画像アップロード:

```bash
curl -X POST http://localhost:8787/api/products/123/images \
  -H "Authorization: Bearer [管理者トークン]" \
  -F "image=@/path/to/image.jpg" \
  -F "is_main=true" \
  -F "alt_text=商品のメイン画像"
```

#### 画像削除:

```bash
curl -X DELETE http://localhost:8787/api/images/456 \
  -H "Authorization: Bearer [管理者トークン]"
```

### 6. データベーススキーマ (imagesテーブル)

`migrations/schema.sql` に以下を追加:

```sql
CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  is_main BOOLEAN NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_images_product_id ON images(product_id);
CREATE INDEX IF NOT EXISTS idx_images_is_main ON images(is_main);
```

これで商品画像管理APIが完成しました。以下の機能を実装しています：

1. **画像アップロード**:
   - 商品ごとの画像アップロード
   - メイン画像の指定
   - 代替テキストの設定
   - 画像形式・サイズのバリデーション
   - R2ストレージへの保存

2. **画像削除**:
   - 画像の物理削除 (R2からも削除)
   - メイン画像削除時の自動更新
   - 関連商品情報の保持

3. **セキュリティ対策**:
   - 管理者権限必須
   - 適切なエラーハンドリング
   - ファイル形式の制限

画像管理APIは商品管理システムと連携して動作し、商品のビジュアル表現を効果的にサポートします。