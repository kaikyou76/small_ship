了解しました。商品レビュー機能を以下のように実装します。1 ユーザー 1 商品につき 1 回までという制約を設け、安全なレビュー管理システムを構築します。

### 1. レビュー投稿 API (`POST /products/:id/reviews`)

`backend/src/endpoints/reviews/createReview.ts`:

```typescript
import { Context } from "hono";
import {
  Bindings,
  ErrorResponse,
  SuccessResponse,
  JwtPayload,
} from "../../types/types";
import { z } from "zod";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const createReviewHandler = async (
  c: Context<{ Bindings: Bindings; Variables: { jwtPayload?: JwtPayload } }>
): Promise<Response> => {
  const payload = c.get("jwtPayload");
  const user_id = payload?.user_id;
  const product_id = parseInt(c.req.param("id"));

  if (!user_id) {
    return c.json(
      {
        error: {
          code: "AUTH_REQUIRED",
          message: "レビュー投稿にはログインが必要です",
        },
      } satisfies ErrorResponse,
      401
    );
  }

  if (isNaN(product_id)) {
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

  try {
    const json = await c.req.json();
    const result = reviewSchema.safeParse(json);

    if (!result.success) {
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "入力内容に誤りがあります",
            details: result.error.errors,
          },
        } satisfies ErrorResponse,
        400
      );
    }

    const { rating, comment } = result.data;

    // 商品存在チェック
    const productExists = await c.env.DB.prepare(
      "SELECT id FROM products WHERE id = ?"
    )
      .bind(product_id)
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

    // 購入済みチェック（実際の購入履歴を確認）
    const hasPurchased = await c.env.DB.prepare(
      `SELECT 1 FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'`
    )
      .bind(user_id, product_id)
      .first();

    if (!hasPurchased) {
      return c.json(
        {
          error: {
            code: "PURCHASE_REQUIRED",
            message: "この商品を購入したユーザーのみレビュー可能です",
          },
        } satisfies ErrorResponse,
        403
      );
    }

    // 既にレビュー済みかチェック
    const existingReview = await c.env.DB.prepare(
      "SELECT id FROM reviews WHERE user_id = ? AND product_id = ?"
    )
      .bind(user_id, product_id)
      .first();

    if (existingReview) {
      return c.json(
        {
          error: {
            code: "REVIEW_EXISTS",
            message: "この商品には既にレビューを投稿しています",
          },
        } satisfies ErrorResponse,
        409
      );
    }

    // レビュー作成
    const review = await c.env.DB.prepare(
      `INSERT INTO reviews (
        user_id,
        product_id,
        rating,
        comment,
        created_at
      ) VALUES (?, ?, ?, ?, ?) RETURNING *`
    )
      .bind(
        user_id,
        product_id,
        rating,
        comment || null,
        new Date().toISOString()
      )
      .first<{
        id: number;
        user_id: number;
        product_id: number;
        rating: number;
        comment: string | null;
        created_at: string;
      }>();

    // 商品の平均評価を更新
    await updateProductRating(c.env.DB, product_id);

    return c.json(
      {
        data: review,
        message: "レビューを投稿しました",
      } satisfies SuccessResponse,
      201
    );
  } catch (error) {
    console.error("レビュー投稿エラー:", error);
    return c.json(
      {
        error: {
          code: "SERVER_ERROR",
          message: "レビューの投稿に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};

async function updateProductRating(db: D1Database, product_id: number) {
  await db.batch([
    // 平均評価計算
    db
      .prepare(
        `UPDATE products SET 
        average_rating = (
          SELECT AVG(rating) FROM reviews 
          WHERE product_id = ?
        ),
        review_count = (
          SELECT COUNT(*) FROM reviews 
          WHERE product_id = ?
        )
       WHERE id = ?`
      )
      .bind(product_id, product_id, product_id),
  ]);
}
```

### 2. レビュー一覧 API (`GET /products/:id/reviews`)

`backend/src/endpoints/reviews/listProductReviews.ts`:

```typescript
import { Context } from "hono";
import { Bindings, ErrorResponse, SuccessResponse } from "../../types/types";

export const listProductReviewsHandler = async (
  c: Context<{ Bindings: Bindings }>
): Promise<Response> => {
  const product_id = parseInt(c.req.param("id"));

  if (isNaN(product_id)) {
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

  try {
    const query = c.req.query();
    const page = Math.max(parseInt(query.page) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(query.per_page) || 10, 1), 50);
    const sort = query.sort || "newest";

    // ソート条件
    let orderBy = "r.created_at DESC";
    if (sort === "highest") orderBy = "r.rating DESC, r.created_at DESC";
    if (sort === "lowest") orderBy = "r.rating ASC, r.created_at DESC";

    // 商品存在チェック
    const productExists = await c.env.DB.prepare(
      "SELECT id, name FROM products WHERE id = ?"
    )
      .bind(product_id)
      .first<{ id: number; name: string }>();

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

    // レビュー一覧取得
    const { results } = await c.env.DB.prepare(
      `SELECT 
        r.id,
        r.user_id,
        u.username,
        r.rating,
        r.comment,
        r.created_at
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ?
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`
    )
      .bind(product_id, perPage, (page - 1) * perPage)
      .all<{
        id: number;
        user_id: number;
        username: string;
        rating: number;
        comment: string | null;
        created_at: string;
      }>();

    // 統計情報
    const stats = await c.env.DB.prepare(
      `SELECT 
        COUNT(*) as total,
        AVG(rating) as average
       FROM reviews 
       WHERE product_id = ?`
    )
      .bind(product_id)
      .first<{ total: number; average: number }>();

    return c.json({
      data: {
        product: {
          id: productExists.id,
          name: productExists.name,
        },
        reviews: results,
        stats: {
          total: stats?.total || 0,
          average: stats?.average ? parseFloat(stats.average.toFixed(1)) : 0,
        },
        meta: {
          page,
          per_page: perPage,
          sort,
        },
      },
    } satisfies SuccessResponse);
  } catch (error) {
    console.error("レビュー一覧取得エラー:", error);
    return c.json(
      {
        error: {
          code: "SERVER_ERROR",
          message: "レビューの取得に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 3. レビュー削除 API (`DELETE /reviews/:id`)

`backend/src/endpoints/reviews/deleteReview.ts`:

```typescript
import { Context } from "hono";
import {
  Bindings,
  ErrorResponse,
  SuccessResponse,
  JwtPayload,
} from "../../types/types";

export const deleteReviewHandler = async (
  c: Context<{ Bindings: Bindings; Variables: { jwtPayload?: JwtPayload } }>
): Promise<Response> => {
  const payload = c.get("jwtPayload");
  const user_id = payload?.user_id;
  const review_id = parseInt(c.req.param("id"));

  if (!user_id) {
    return c.json(
      {
        error: {
          code: "AUTH_REQUIRED",
          message: "ログインが必要です",
        },
      } satisfies ErrorResponse,
      401
    );
  }

  if (isNaN(review_id)) {
    return c.json(
      {
        error: {
          code: "INVALID_REVIEW_ID",
          message: "無効なレビューIDです",
        },
      } satisfies ErrorResponse,
      400
    );
  }

  try {
    // レビュー情報取得
    const review = await c.env.DB.prepare(
      "SELECT id, user_id, product_id FROM reviews WHERE id = ?"
    )
      .bind(review_id)
      .first<{ id: number; user_id: number; product_id: number }>();

    if (!review) {
      return c.json(
        {
          error: {
            code: "REVIEW_NOT_FOUND",
            message: "レビューが見つかりません",
          },
        } satisfies ErrorResponse,
        404
      );
    }

    // 本人または管理者のみ削除可能
    const isAdmin = payload?.role === "admin";
    if (review.user_id !== user_id && !isAdmin) {
      return c.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "このレビューを削除する権限がありません",
          },
        } satisfies ErrorResponse,
        403
      );
    }

    // レビュー削除
    await c.env.DB.batch([
      c.env.DB.prepare("DELETE FROM reviews WHERE id = ?").bind(review_id),
      c.env.DB.prepare(
        `UPDATE products SET 
          average_rating = (
            SELECT AVG(rating) FROM reviews 
            WHERE product_id = ?
          ),
          review_count = (
            SELECT COUNT(*) FROM reviews 
            WHERE product_id = ?
          )
         WHERE id = ?`
      ).bind(review.product_id, review.product_id, review.product_id),
    ]);

    return c.json({
      data: {
        deleted: true,
        review_id,
        product_id: review.product_id,
      },
    } satisfies SuccessResponse);
  } catch (error) {
    console.error("レビュー削除エラー:", error);
    return c.json(
      {
        error: {
          code: "SERVER_ERROR",
          message: "レビューの削除に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 4. ルート設定

`backend/src/routes/index.ts`:

```typescript
// ... 既存のインポート ...
import { createReviewHandler } from "endpoints/reviews/createReview";
import { listProductReviewsHandler } from "endpoints/reviews/listProductReviews";
import { deleteReviewHandler } from "endpoints/reviews/deleteReview";

// ... 既存のルート定義 ...

// =====================
// Review Routes
// =====================
app
  .post("/api/products/:id/reviews", jwtMiddleware, createReviewHandler)
  .get("/api/products/:id/reviews", listProductReviewsHandler)
  .delete("/api/reviews/:id", jwtMiddleware, deleteReviewHandler);
```

### 5. データベーススキーマ

`migrations/schema.sql` に以下を追加:

```sql
-- レビューテーブル
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE (user_id, product_id) -- 1ユーザー1商品1レビュー
);

-- 商品テーブルに評価関連フィールドを追加
ALTER TABLE products ADD COLUMN average_rating REAL DEFAULT 0;
ALTER TABLE products ADD COLUMN review_count INTEGER DEFAULT 0;

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
```

### 6. 主な機能と特徴

1. **レビュー投稿制限**:

   - 1 ユーザー 1 商品につき 1 回まで
   - 実際に購入したユーザーのみ投稿可能

2. **レビュー管理**:

   - ページネーション対応の一覧取得
   - 評価順/新着順でのソート機能
   - 平均評価の自動計算

3. **セキュリティ**:

   - 本人または管理者のみ削除可能
   - 適切な権限チェック

4. **データ整合性**:

   - レビュー削除時の評価再計算
   - 外部キー制約によるデータ整合性保持

5. **ユーザー体験**:
   - ユーザー名表示
   - 商品情報を含んだレスポンス

### 7. 動作確認スクリプト

#### レビュー投稿:

```bash
curl -X POST http://localhost:8787/api/products/123/reviews \
  -H "Authorization: Bearer [ユーザートークン]" \
  -H "Content-Type: application/json" \
  -d '{"rating":5,"comment":"素晴らしい商品でした"}'
```

#### レビュー一覧:

```bash
curl -X GET "http://localhost:8787/api/products/123/reviews?sort=highest&page=1"
```

#### レビュー削除:

```bash
curl -X DELETE http://localhost:8787/api/reviews/456 \
  -H "Authorization: Bearer [ユーザーまたは管理者トークン]"
```

この実装により、信頼性の高い商品レビューシステムを構築できます。ユーザーが安心してレビューを投稿でき、管理者が適切に管理できる設計となっています。
