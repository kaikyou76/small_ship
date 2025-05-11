以下に、商品管理 API の未実装部分を補完して実装します。既存の実装を参考に、より堅牢で機能的な API に拡張していきます。

### 1. 商品一覧取得 API (`GET /products`) - フィルタ機能強化版

`backend/src/endpoints/products/listProducts.ts`:

```typescript
import { Context } from "hono";
import { Bindings, ErrorResponse, SuccessResponse } from "../../types/types";
import { z } from "zod";

const querySchema = z.object({
  page: z.preprocess(Number, z.number().int().min(1).default(1)),
  per_page: z.preprocess(Number, z.number().int().min(1).max(100).default(20)),
  search: z.string().optional(),
  category_id: z.preprocess(Number, z.number().int().positive().optional()),
  tag_id: z.preprocess(Number, z.number().int().positive().optional()),
  min_price: z.preprocess(Number, z.number().int().min(0).optional()),
  max_price: z.preprocess(Number, z.number().int().min(0).optional()),
  sort: z.enum(["newest", "price_asc", "price_desc", "popular"]).optional(),
});

export const listProductsHandler = async (
  c: Context<{ Bindings: Bindings }>
): Promise<Response> => {
  try {
    // クエリパラメータのバリデーション
    const validationResult = querySchema.safeParse(c.req.query());
    if (!validationResult.success) {
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "無効なクエリパラメータです",
            issues: validationResult.error.errors,
          },
        } satisfies ErrorResponse,
        400
      );
    }

    const {
      page,
      per_page,
      search,
      category_id,
      tag_id,
      min_price,
      max_price,
      sort,
    } = validationResult.data;

    // ベースクエリ構築
    let baseQuery = `
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_tags pt ON p.id = pt.product_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE 1=1
    `;
    const params = [];

    // 検索条件追加
    if (search) {
      baseQuery += ` AND (
        p.name LIKE ? OR 
        p.description LIKE ? OR
        EXISTS (
          SELECT 1 FROM products_fts f
          WHERE f.rowid = p.id AND f.products_fts MATCH ?
        )
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, search);
    }

    if (category_id) {
      baseQuery += " AND p.category_id = ?";
      params.push(category_id);
    }

    if (tag_id) {
      baseQuery += " AND pt.tag_id = ?";
      params.push(tag_id);
    }

    if (min_price !== undefined) {
      baseQuery += " AND p.price >= ?";
      params.push(min_price);
    }

    if (max_price !== undefined) {
      baseQuery += " AND p.price <= ?";
      params.push(max_price);
    }

    // ソート条件
    let sortClause = "ORDER BY p.created_at DESC";
    if (sort === "price_asc") sortClause = "ORDER BY p.price ASC";
    if (sort === "price_desc") sortClause = "ORDER BY p.price DESC";
    if (sort === "popular")
      sortClause =
        "ORDER BY (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) DESC";

    // 総数取得
    const countQuery = `SELECT COUNT(DISTINCT p.id) as total ${baseQuery}`;
    const countResult = await c.env.DB.prepare(countQuery)
      .bind(...params)
      .first<{ total: number }>();

    // 商品一覧取得
    const productsQuery = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.stock,
        p.category_id,
        c.name as category_name,
        p.created_at,
        (
          SELECT i.image_url 
          FROM images i 
          WHERE i.product_id = p.id AND i.is_main = 1
          LIMIT 1
        ) as main_image,
        (
          SELECT AVG(rating) 
          FROM reviews 
          WHERE product_id = p.id
        ) as average_rating,
        (
          SELECT COUNT(*) 
          FROM reviews 
          WHERE product_id = p.id
        ) as review_count,
        (
          SELECT GROUP_CONCAT(t.name, ',') 
          FROM product_tags pt 
          JOIN tags t ON pt.tag_id = t.id 
          WHERE pt.product_id = p.id
        ) as tags
      ${baseQuery}
      GROUP BY p.id
      ${sortClause}
      LIMIT ? OFFSET ?
    `;

    const productsResult = await c.env.DB.prepare(productsQuery)
      .bind(...params, per_page, (page - 1) * per_page)
      .all<{
        id: number;
        name: string;
        description: string;
        price: number;
        stock: number;
        category_id: number | null;
        category_name: string | null;
        created_at: string;
        main_image: string | null;
        average_rating: number | null;
        review_count: number;
        tags: string | null;
      }>();

    // データ整形
    const products = productsResult.results.map((p) => ({
      ...p,
      tags: p.tags?.split(",").filter(Boolean) || [],
      average_rating: p.average_rating
        ? parseFloat(p.average_rating.toFixed(1))
        : null,
    }));

    return c.json(
      {
        data: products,
        meta: {
          page,
          per_page,
          total: countResult?.total || 0,
        },
      } satisfies SuccessResponse,
      200
    );
  } catch (error) {
    console.error("List products error:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "商品一覧の取得に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 2. 商品詳細取得 API (`GET /products/:id`) - 画像・レビュー含む

`backend/src/endpoints/products/getProductDetail.ts`:

```typescript
import { Context } from "hono";
import { Bindings, ErrorResponse, SuccessResponse } from "../../types/types";

export const getProductDetailHandler = async (
  c: Context<{ Bindings: Bindings }>
): Promise<Response> => {
  try {
    const productId = parseInt(c.req.param("id"));
    if (isNaN(productId)) {
      return c.json(
        {
          error: {
            code: "INVALID_ID",
            message: "無効な商品IDです",
          },
        } satisfies ErrorResponse,
        400
      );
    }

    // 商品基本情報取得
    const product = await c.env.DB.prepare(
      `SELECT 
         p.*,
         c.name as category_name,
         (SELECT AVG(rating) FROM reviews WHERE product_id = p.id) as average_rating,
         (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) as review_count
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`
    )
      .bind(productId)
      .first<{
        id: number;
        name: string;
        description: string;
        price: number;
        stock: number;
        category_id: number | null;
        category_name: string | null;
        created_at: string;
        average_rating: number | null;
        review_count: number;
      }>();

    if (!product) {
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

    // 関連データ取得（画像、タグ、レビュー）
    const [images, tags, reviews] = await Promise.all([
      c.env.DB.prepare(
        "SELECT id, image_url, alt_text, is_main FROM images WHERE product_id = ? ORDER BY is_main DESC, created_at"
      )
        .bind(productId)
        .all<{
          id: number;
          image_url: string;
          alt_text: string | null;
          is_main: boolean;
        }>(),
      c.env.DB.prepare(
        "SELECT t.id, t.name FROM product_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.product_id = ?"
      )
        .bind(productId)
        .all<{ id: number; name: string }>(),
      c.env.DB.prepare(
        `SELECT 
           r.id, r.rating, r.comment, r.created_at, 
           u.id as user_id, u.name as user_name
         FROM reviews r
         JOIN users u ON r.user_id = u.id
         WHERE r.product_id = ?
         ORDER BY r.created_at DESC
         LIMIT 10`
      )
        .bind(productId)
        .all<{
          id: number;
          rating: number;
          comment: string | null;
          created_at: string;
          user_id: number;
          user_name: string;
        }>(),
    ]);

    // レスポンス整形
    return c.json(
      {
        data: {
          ...product,
          average_rating: product.average_rating
            ? parseFloat(product.average_rating.toFixed(1))
            : null,
          images: images.results,
          tags: tags.results,
          reviews: reviews.results,
        },
      } satisfies SuccessResponse,
      200
    );
  } catch (error) {
    console.error("Get product detail error:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "商品詳細の取得に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 3. 商品更新 API (`PUT /products/:id`) - 管理者用

`backend/src/endpoints/products/updateProduct.ts`:

```typescript
import { Context } from "hono";
import { Bindings, ErrorResponse, SuccessResponse } from "../../types/types";
import { productSchema } from "../../schemas/product";
import { uploadToR2 } from "../../lib/storage";
import { deleteFromR2 } from "../../lib/storage";

export const updateProductHandler = async (
  c: Context<{ Bindings: Bindings }>
): Promise<Response> => {
  try {
    const productId = parseInt(c.req.param("id"));
    if (isNaN(productId)) {
      return c.json(
        {
          error: {
            code: "INVALID_ID",
            message: "無効な商品IDです",
          },
        } satisfies ErrorResponse,
        400
      );
    }

    const formData = await c.req.formData();
    const rawFormData = {
      name: formData.get("name"),
      description: formData.get("description"),
      price: formData.get("price"),
      stock: formData.get("stock") || 0,
      category_id: formData.get("category_id"),
    };

    // バリデーション
    const validationResult = productSchema.safeParse(rawFormData);
    if (!validationResult.success) {
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "入力内容に誤りがあります",
            details: validationResult.error.flatten(),
          },
        } satisfies ErrorResponse,
        400
      );
    }

    // 商品存在確認
    const existingProduct = await c.env.DB.prepare(
      "SELECT id FROM products WHERE id = ?"
    )
      .bind(productId)
      .first();

    if (!existingProduct) {
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

    // 画像処理
    const mainImageFile = formData.get("mainImage") as File | null;
    const additionalImageFiles = formData.getAll("additionalImages") as File[];
    const deleteImageIds = formData.getAll("deleteImageIds") as string[];

    let mainImageUrl: string | undefined;
    if (mainImageFile?.size) {
      const mainImage = await uploadToR2(
        c.env.R2_BUCKET,
        mainImageFile,
        c.env.R2_PUBLIC_DOMAIN,
        { folder: "products/main" }
      );
      mainImageUrl = mainImage.url;
    }

    // 追加画像アップロード
    const additionalImages = await Promise.all(
      additionalImageFiles
        .filter((file) => file.size > 0)
        .map((file) =>
          uploadToR2(c.env.R2_BUCKET, file, c.env.R2_PUBLIC_DOMAIN, {
            folder: "products/additional",
          })
        )
    );

    // 削除対象の画像処理
    if (deleteImageIds.length > 0) {
      // R2から削除
      const imagesToDelete = await c.env.DB.prepare(
        "SELECT image_url FROM images WHERE id IN (?) AND product_id = ?"
      )
        .bind(deleteImageIds.join(","), productId)
        .all<{ image_url: string }>();

      await Promise.all(
        imagesToDelete.results.map((img) =>
          deleteFromR2(c.env.R2_BUCKET, img.image_url)
        )
      );

      // DBから削除
      await c.env.DB.prepare(
        "DELETE FROM images WHERE id IN (?) AND product_id = ?"
      )
        .bind(deleteImageIds.join(","), productId)
        .run();
    }

    // 商品情報更新
    await c.env.DB.prepare(
      `UPDATE products SET
         name = ?,
         description = ?,
         price = ?,
         stock = ?,
         category_id = ?,
         main_image_url = COALESCE(?, main_image_url)
       WHERE id = ?`
    )
      .bind(
        validationResult.data.name,
        validationResult.data.description || null,
        validationResult.data.price,
        validationResult.data.stock,
        validationResult.data.category_id,
        mainImageUrl,
        productId
      )
      .run();

    // 追加画像をDBに保存
    if (additionalImages.length > 0) {
      await c.env.DB.batch(
        additionalImages.map((img) =>
          c.env.DB.prepare(
            `INSERT INTO images (product_id, image_url, created_at, is_main)
             VALUES (?, ?, ?, 0)`
          ).bind(productId, img.url, new Date().toISOString())
        )
      );
    }

    // 更新後の商品情報を取得して返す
    const updatedProduct = await c.env.DB.prepare(
      "SELECT * FROM products WHERE id = ?"
    )
      .bind(productId)
      .first();

    return c.json(
      {
        data: updatedProduct,
      } satisfies SuccessResponse,
      200
    );
  } catch (error) {
    console.error("Update product error:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "商品の更新に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 4. 商品削除 API (`DELETE /products/:id`) - 管理者用

`backend/src/endpoints/products/deleteProduct.ts`:

```typescript
import { Context } from "hono";
import { Bindings, ErrorResponse, SuccessResponse } from "../../types/types";
import { deleteFromR2 } from "../../lib/storage";

export const deleteProductHandler = async (
  c: Context<{ Bindings: Bindings }>
): Promise<Response> => {
  try {
    const productId = parseInt(c.req.param("id"));
    if (isNaN(productId)) {
      return c.json(
        {
          error: {
            code: "INVALID_ID",
            message: "無効な商品IDです",
          },
        } satisfies ErrorResponse,
        400
      );
    }

    // トランザクション開始
    const result = await c.env.DB.batch([
      // 画像URL取得
      c.env.DB.prepare(
        "SELECT image_url FROM images WHERE product_id = ?"
      ).bind(productId),
      // 関連データ削除
      c.env.DB.prepare("DELETE FROM cart_items WHERE product_id = ?").bind(
        productId
      ),
      c.env.DB.prepare("DELETE FROM product_tags WHERE product_id = ?").bind(
        productId
      ),
      c.env.DB.prepare("DELETE FROM reviews WHERE product_id = ?").bind(
        productId
      ),
      c.env.DB.prepare("DELETE FROM wishlists WHERE product_id = ?").bind(
        productId
      ),
      c.env.DB.prepare("DELETE FROM images WHERE product_id = ?").bind(
        productId
      ),
      c.env.DB.prepare("DELETE FROM products_fts WHERE rowid = ?").bind(
        productId
      ),
      // メインデータ削除
      c.env.DB.prepare("DELETE FROM products WHERE id = ?").bind(productId),
    ]);

    // R2から画像削除
    const imagesResult = result[0];
    if (imagesResult.success) {
      const images = imagesResult.results as { image_url: string }[];
      await Promise.all(
        images.map((img) => deleteFromR2(c.env.R2_BUCKET, img.image_url))
      );
    }

    return c.json(
      {
        data: {
          success: true,
          deleted: true,
        },
      } satisfies SuccessResponse,
      200
    );
  } catch (error) {
    console.error("Delete product error:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "商品の削除に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 5. ルートに商品管理 API を追加

`backend/src/routes/index.ts`:

```typescript
// ... 既存のインポート ...
import { listProductsHandler } from "endpoints/products/listProducts";
import { getProductDetailHandler } from "endpoints/products/getProductDetail";
import { updateProductHandler } from "endpoints/products/updateProduct";
import { deleteProductHandler } from "endpoints/products/deleteProduct";

// ... 既存のルート定義 ...

// =====================
// Product Routes
// =====================
app
  .get("/api/products", listProductsHandler)
  .get("/api/products/:id", getProductDetailHandler)
  .post("/api/products", jwtMiddleware, adminMiddleware, productPostHandler)
  .put(
    "/api/products/:id",
    jwtMiddleware,
    adminMiddleware,
    updateProductHandler
  )
  .delete(
    "/api/products/:id",
    jwtMiddleware,
    adminMiddleware,
    deleteProductHandler
  );
```

### 6. ストレージユーティリティの追加

`backend/src/lib/storage.ts`に画像削除関数を追加:

```typescript
export async function deleteFromR2(
  bucket: R2Bucket,
  fileUrl: string
): Promise<void> {
  try {
    const key = new URL(fileUrl).pathname.substring(1); // Remove leading slash
    await bucket.delete(key);
  } catch (error) {
    console.error("Failed to delete file from R2:", fileUrl, error);
    throw error;
  }
}
```

これで、以下の商品管理 API が実装されました：

1. **商品一覧取得** - 検索、フィルタ、ソート機能付き
2. **商品詳細取得** - 画像、レビュー、タグ情報を含む
3. **商品作成** - 既存実装を拡張（管理者用）
4. **商品更新** - 画像のアップロード/削除に対応（管理者用）
5. **商品削除** - 関連データも一括削除（管理者用）

各 API には適切なエラーハンドリングとバリデーションを実装しています。また、R2 ストレージとの連携やトランザクション処理も考慮されています。
