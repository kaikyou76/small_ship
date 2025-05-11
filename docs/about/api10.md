了解しました。お気に入り（ウィッシュリスト）機能を以下のように実装します。ユーザーが商品をお気に入り登録・削除し、自分のお気に入り一覧を取得できるシンプルで効率的なシステムです。

### 1. お気に入り一覧取得 API (`GET /wishlists`)

`backend/src/endpoints/wishlists/getWishlist.ts`:

```typescript
import { Context } from "hono";
import {
  Bindings,
  ErrorResponse,
  SuccessResponse,
  JwtPayload,
} from "../../types/types";

export const getWishlistHandler = async (
  c: Context<{ Bindings: Bindings; Variables: { jwtPayload?: JwtPayload } }>
): Promise<Response> => {
  const payload = c.get("jwtPayload");
  const user_id = payload?.user_id;

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

  try {
    const query = c.req.query();
    const page = Math.max(parseInt(query.page) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(query.per_page) || 20, 1), 50);

    // お気に入り商品一覧取得
    const { results } = await c.env.DB.prepare(
      `SELECT 
        p.id,
        p.name,
        p.price,
        p.image_url,
        p.stock,
        p.average_rating,
        p.review_count,
        w.created_at as favorited_at
       FROM wishlists w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(user_id, perPage, (page - 1) * perPage)
      .all<{
        id: number;
        name: string;
        price: number;
        image_url: string;
        stock: number;
        average_rating: number;
        review_count: number;
        favorited_at: string;
      }>();

    // 総数取得
    const { total } = await c.env.DB.prepare(
      "SELECT COUNT(*) as total FROM wishlists WHERE user_id = ?"
    )
      .bind(user_id)
      .first<{ total: number }>();

    return c.json({
      data: results,
      meta: {
        page,
        per_page: perPage,
        total,
      },
    } satisfies SuccessResponse);
  } catch (error) {
    console.error("お気に入り一覧取得エラー:", error);
    return c.json(
      {
        error: {
          code: "SERVER_ERROR",
          message: "お気に入り一覧の取得に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 2. お気に入り追加 API (`POST /wishlists/:product_id`)

`backend/src/endpoints/wishlists/addToWishlist.ts`:

```typescript
import { Context } from "hono";
import {
  Bindings,
  ErrorResponse,
  SuccessResponse,
  JwtPayload,
} from "../../types/types";

export const addToWishlistHandler = async (
  c: Context<{ Bindings: Bindings; Variables: { jwtPayload?: JwtPayload } }>
): Promise<Response> => {
  const payload = c.get("jwtPayload");
  const user_id = payload?.user_id;
  const product_id = parseInt(c.req.param("product_id"));

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

    // 既にお気に入り登録済みかチェック
    const alreadyFavorited = await c.env.DB.prepare(
      "SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?"
    )
      .bind(user_id, product_id)
      .first();

    if (alreadyFavorited) {
      return c.json(
        {
          error: {
            code: "ALREADY_FAVORITED",
            message: "既にお気に入りに登録済みです",
          },
        } satisfies ErrorResponse,
        409
      );
    }

    // お気に入り登録
    const wishlistItem = await c.env.DB.prepare(
      `INSERT INTO wishlists (
        user_id,
        product_id,
        created_at
      ) VALUES (?, ?, ?) RETURNING *`
    )
      .bind(user_id, product_id, new Date().toISOString())
      .first<{
        id: number;
        user_id: number;
        product_id: number;
        created_at: string;
      }>();

    return c.json(
      {
        data: {
          id: wishlistItem.id,
          product_id: wishlistItem.product_id,
          favorited_at: wishlistItem.created_at,
        },
        message: "お気に入りに追加しました",
      } satisfies SuccessResponse,
      201
    );
  } catch (error) {
    console.error("お気に入り追加エラー:", error);
    return c.json(
      {
        error: {
          code: "SERVER_ERROR",
          message: "お気に入り追加に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 3. お気に入り削除 API (`DELETE /wishlists/:product_id`)

`backend/src/endpoints/wishlists/removeFromWishlist.ts`:

```typescript
import { Context } from "hono";
import {
  Bindings,
  ErrorResponse,
  SuccessResponse,
  JwtPayload,
} from "../../types/types";

export const removeFromWishlistHandler = async (
  c: Context<{ Bindings: Bindings; Variables: { jwtPayload?: JwtPayload } }>
): Promise<Response> => {
  const payload = c.get("jwtPayload");
  const user_id = payload?.user_id;
  const product_id = parseInt(c.req.param("product_id"));

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
    // お気に入りアイテム存在チェック
    const wishlistItem = await c.env.DB.prepare(
      "SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?"
    )
      .bind(user_id, product_id)
      .first<{ id: number }>();

    if (!wishlistItem) {
      return c.json(
        {
          error: {
            code: "NOT_IN_WISHLIST",
            message: "お気に入りに登録されていません",
          },
        } satisfies ErrorResponse,
        404
      );
    }

    // お気に入り削除
    await c.env.DB.prepare(
      "DELETE FROM wishlists WHERE user_id = ? AND product_id = ?"
    )
      .bind(user_id, product_id)
      .run();

    return c.json({
      data: {
        removed: true,
        product_id,
      },
    } satisfies SuccessResponse);
  } catch (error) {
    console.error("お気に入り削除エラー:", error);
    return c.json(
      {
        error: {
          code: "SERVER_ERROR",
          message: "お気に入りの削除に失敗しました",
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
import { getWishlistHandler } from "endpoints/wishlists/getWishlist";
import { addToWishlistHandler } from "endpoints/wishlists/addToWishlist";
import { removeFromWishlistHandler } from "endpoints/wishlists/removeFromWishlist";

// ... 既存のルート定義 ...

// =====================
// Wishlist Routes
// =====================
app
  .get("/api/wishlists", jwtMiddleware, getWishlistHandler)
  .post("/api/wishlists/:product_id", jwtMiddleware, addToWishlistHandler)
  .delete(
    "/api/wishlists/:product_id",
    jwtMiddleware,
    removeFromWishlistHandler
  );
```

### 5. データベーススキーマ

`migrations/schema.sql` に以下を追加:

```sql
-- お気に入りテーブル
CREATE TABLE IF NOT EXISTS wishlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE (user_id, product_id) -- 1ユーザー1商品1登録
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);
```

### 6. 主な機能と特徴

1. **ユーザー認証**:

   - ログインユーザーのみ利用可能
   - JWT トークンによる認証

2. **重複防止**:

   - 1 ユーザーが同じ商品を重複登録できない
   - UNIQUE 制約によるデータ整合性保持

3. **効率的な取得**:

   - ページネーション対応
   - 商品情報を JOIN で一度に取得

4. **エラーハンドリング**:

   - 適切なエラーレスポンス
   - 商品存在チェック

5. **RESTful 設計**:
   - リソース指向の API エンドポイント
   - 適切な HTTP メソッドとステータスコード

### 7. 動作確認スクリプト

#### お気に入り一覧取得:

```bash
curl -X GET http://localhost:8787/api/wishlists \
  -H "Authorization: Bearer [ユーザートークン]"
```

#### お気に入り追加:

```bash
curl -X POST http://localhost:8787/api/wishlists/123 \
  -H "Authorization: Bearer [ユーザートークン]"
```

#### お気に入り削除:

```bash
curl -X DELETE http://localhost:8787/api/wishlists/123 \
  -H "Authorization: Bearer [ユーザートークン]"
```

### 8. 追加実装オプション

1. **お気に入り状態チェック API**:

   ```typescript
   app.get("/api/wishlists/:product_id/status", ...);
   ```

   - 特定商品がお気に入り登録済みかどうかをチェック

2. **お気に入り一括操作**:

   ```typescript
   app.post("/api/wishlists/batch", ...);
   ```

   - 複数商品を一度にお気に入り登録/削除

3. **お気に入りカウント**:
   - 商品ごとのお気に入り登録数を表示

この実装により、ユーザーが簡単にお気に入り商品を管理できるシンプルで堅牢なシステムを構築できます。必要に応じてさらに機能を拡張することも可能です。
