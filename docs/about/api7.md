了解しました。カートシステムの API を以下のように実装します。既存の getCart.ts を基に、追加・更新・削除機能を実装し、一貫性のあるカート管理システムを構築します。

### 1. カート取得 API (既存実装の改良版 `GET /cart`)

`backend/src/endpoints/cart/getCart.ts`:

```typescript
import { Context } from "hono";
import {
  Bindings,
  CartItem,
  ErrorResponse,
  SuccessResponse,
  JwtPayload,
} from "../../types/types";
import { z } from "zod";

// 既存のgetCartHandlerを改良
export const getCartHandler = async (
  c: Context<{ Bindings: Bindings; Variables: { jwtPayload?: JwtPayload } }>
): Promise<Response> => {
  const payload = c.get("jwtPayload");
  const user_id = payload?.user_id;
  const sessionId = c.req.header("x-session-id");

  if (!user_id && !sessionId) {
    return c.json(
      {
        error: {
          code: "AUTH_REQUIRED",
          message: "認証またはセッションIDが必要です",
        },
      } satisfies ErrorResponse,
      400
    );
  }

  try {
    const conditions = [];
    const binds = [];

    if (user_id) {
      conditions.push("ci.user_id = ?");
      binds.push(user_id);
    }

    if (sessionId) {
      conditions.push("ci.session_id = ?");
      binds.push(sessionId);
    }

    const query = `
      SELECT 
        ci.id,
        p.id as product_id,
        p.name,
        p.price,
        p.stock,
        ci.quantity,
        (p.price * ci.quantity) as subtotal,
        p.image_url,
        MIN(p.price * ci.quantity <= p.stock) as is_available
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ${conditions.join(" OR ")}
      GROUP BY ci.id
    `;

    const { results } = await c.env.DB.prepare(query)
      .bind(...binds)
      .all<CartItem & { is_available: number }>();

    // カート統合ロジック
    if (user_id && sessionId) {
      await mergeCarts(c.env.DB, user_id, sessionId);
    }

    // 在庫チェック付きのレスポンス
    const cartItems = results.map((item) => ({
      ...item,
      is_available: Boolean(item.is_available),
    }));

    // 合計金額計算
    const total = cartItems.reduce(
      (sum, item) => sum + (item.is_available ? item.subtotal : 0),
      0
    );

    return c.json({
      data: {
        items: cartItems,
        total,
      },
    } satisfies SuccessResponse);
  } catch (error) {
    console.error("カート取得エラー:", error);
    return c.json(
      {
        error: {
          code: "SERVER_ERROR",
          message: "カートの取得に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 2. カート追加 API (`POST /cart`)

`backend/src/endpoints/cart/addToCart.ts`:

```typescript
import { Context } from "hono";
import {
  Bindings,
  ErrorResponse,
  SuccessResponse,
  JwtPayload,
} from "../../types/types";
import { z } from "zod";

const addToCartSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().int().min(1).max(100),
});

export const addToCartHandler = async (
  c: Context<{ Bindings: Bindings; Variables: { jwtPayload?: JwtPayload } }>
): Promise<Response> => {
  const payload = c.get("jwtPayload");
  const user_id = payload?.user_id;
  const sessionId = c.req.header("x-session-id");

  if (!user_id && !sessionId) {
    return c.json(
      {
        error: {
          code: "AUTH_REQUIRED",
          message: "認証またはセッションIDが必要です",
        },
      } satisfies ErrorResponse,
      400
    );
  }

  try {
    const json = await c.req.json();
    const result = addToCartSchema.safeParse(json);

    if (!result.success) {
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "無効な入力です",
            details: result.error.errors,
          },
        } satisfies ErrorResponse,
        400
      );
    }

    const { product_id, quantity } = result.data;

    // 商品存在チェックと在庫確認
    const product = await c.env.DB.prepare(
      "SELECT id, price, stock FROM products WHERE id = ?"
    )
      .bind(product_id)
      .first<{ id: number; price: number; stock: number }>();

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

    if (product.stock < quantity) {
      return c.json(
        {
          error: {
            code: "INSUFFICIENT_STOCK",
            message: "在庫が不足しています",
            available: product.stock,
          },
        } satisfies ErrorResponse,
        400
      );
    }

    // 既にカートにあるか確認
    const conditions = ["product_id = ?"];
    const binds = [product_id];

    if (user_id) {
      conditions.push("user_id = ?");
      binds.push(user_id);
    } else {
      conditions.push("session_id = ?");
      binds.push(sessionId);
    }

    const existingItem = await c.env.DB.prepare(
      `SELECT id, quantity FROM cart_items WHERE ${conditions.join(" AND ")}`
    )
      .bind(...binds)
      .first<{ id: number; quantity: number }>();

    let cartItem;
    if (existingItem) {
      // 既存アイテムの数量更新
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        return c.json(
          {
            error: {
              code: "INSUFFICIENT_STOCK",
              message: `追加すると在庫を超えます (最大 ${product.stock})`,
            },
          } satisfies ErrorResponse,
          400
        );
      }

      cartItem = await c.env.DB.prepare(
        "UPDATE cart_items SET quantity = ? WHERE id = ? RETURNING *"
      )
        .bind(newQuantity, existingItem.id)
        .first();
    } else {
      // 新規アイテム追加
      cartItem = await c.env.DB.prepare(
        `INSERT INTO cart_items (
          product_id, 
          user_id, 
          session_id, 
          quantity, 
          created_at
        ) VALUES (?, ?, ?, ?, ?) RETURNING *`
      )
        .bind(
          product_id,
          user_id || null,
          !user_id ? sessionId : null,
          quantity,
          new Date().toISOString()
        )
        .first();
    }

    return c.json(
      {
        data: {
          id: cartItem.id,
          product_id,
          quantity: cartItem.quantity,
          price: product.price,
          subtotal: product.price * cartItem.quantity,
        },
      } satisfies SuccessResponse,
      201
    );
  } catch (error) {
    console.error("カート追加エラー:", error);
    return c.json(
      {
        error: {
          code: "SERVER_ERROR",
          message: "カートへの追加に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 3. カート更新 API (`PUT /cart/:item_id`)

`backend/src/endpoints/cart/updateCartItem.ts`:

```typescript
import { Context } from "hono";
import {
  Bindings,
  ErrorResponse,
  SuccessResponse,
  JwtPayload,
} from "../../types/types";
import { z } from "zod";

const updateCartSchema = z.object({
  quantity: z.number().int().min(1).max(100),
});

export const updateCartItemHandler = async (
  c: Context<{ Bindings: Bindings; Variables: { jwtPayload?: JwtPayload } }>
): Promise<Response> => {
  const payload = c.get("jwtPayload");
  const user_id = payload?.user_id;
  const sessionId = c.req.header("x-session-id");
  const itemId = parseInt(c.req.param("item_id"));

  if (!user_id && !sessionId) {
    return c.json(
      {
        error: {
          code: "AUTH_REQUIRED",
          message: "認証またはセッションIDが必要です",
        },
      } satisfies ErrorResponse,
      400
    );
  }

  if (isNaN(itemId)) {
    return c.json(
      {
        error: {
          code: "INVALID_ITEM_ID",
          message: "無効なカートアイテムIDです",
        },
      } satisfies ErrorResponse,
      400
    );
  }

  try {
    const json = await c.req.json();
    const result = updateCartSchema.safeParse(json);

    if (!result.success) {
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "無効な数量です (1-100)",
          },
        } satisfies ErrorResponse,
        400
      );
    }

    const { quantity } = result.data;

    // カートアイテムと商品情報を取得
    const conditions = ["ci.id = ?"];
    const binds = [itemId];

    if (user_id) {
      conditions.push("ci.user_id = ?");
      binds.push(user_id);
    } else {
      conditions.push("ci.session_id = ?");
      binds.push(sessionId);
    }

    const cartItem = await c.env.DB.prepare(
      `SELECT ci.id, ci.product_id, p.price, p.stock 
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ${conditions.join(" AND ")}`
    )
      .bind(...binds)
      .first<{
        id: number;
        product_id: number;
        price: number;
        stock: number;
      }>();

    if (!cartItem) {
      return c.json(
        {
          error: {
            code: "ITEM_NOT_FOUND",
            message: "カートアイテムが見つかりません",
          },
        } satisfies ErrorResponse,
        404
      );
    }

    // 在庫チェック
    if (quantity > cartItem.stock) {
      return c.json(
        {
          error: {
            code: "INSUFFICIENT_STOCK",
            message: `在庫が不足しています (最大 ${cartItem.stock})`,
          },
        } satisfies ErrorResponse,
        400
      );
    }

    // 数量更新
    const updatedItem = await c.env.DB.prepare(
      "UPDATE cart_items SET quantity = ? WHERE id = ? RETURNING *"
    )
      .bind(quantity, itemId)
      .first();

    return c.json({
      data: {
        id: updatedItem.id,
        product_id: cartItem.product_id,
        quantity: updatedItem.quantity,
        price: cartItem.price,
        subtotal: cartItem.price * updatedItem.quantity,
      },
    } satisfies SuccessResponse);
  } catch (error) {
    console.error("カート更新エラー:", error);
    return c.json(
      {
        error: {
          code: "SERVER_ERROR",
          message: "カートの更新に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 4. カート削除 API (`DELETE /cart/:item_id`)

`backend/src/endpoints/cart/deleteCartItem.ts`:

```typescript
import { Context } from "hono";
import {
  Bindings,
  ErrorResponse,
  SuccessResponse,
  JwtPayload,
} from "../../types/types";

export const deleteCartItemHandler = async (
  c: Context<{ Bindings: Bindings; Variables: { jwtPayload?: JwtPayload } }>
): Promise<Response> => {
  const payload = c.get("jwtPayload");
  const user_id = payload?.user_id;
  const sessionId = c.req.header("x-session-id");
  const itemId = parseInt(c.req.param("item_id"));

  if (!user_id && !sessionId) {
    return c.json(
      {
        error: {
          code: "AUTH_REQUIRED",
          message: "認証またはセッションIDが必要です",
        },
      } satisfies ErrorResponse,
      400
    );
  }

  if (isNaN(itemId)) {
    return c.json(
      {
        error: {
          code: "INVALID_ITEM_ID",
          message: "無効なカートアイテムIDです",
        },
      } satisfies ErrorResponse,
      400
    );
  }

  try {
    const conditions = ["id = ?"];
    const binds = [itemId];

    if (user_id) {
      conditions.push("user_id = ?");
      binds.push(user_id);
    } else {
      conditions.push("session_id = ?");
      binds.push(sessionId);
    }

    // 削除前にアイテム情報を取得
    const item = await c.env.DB.prepare(
      `SELECT id, product_id FROM cart_items WHERE ${conditions.join(" AND ")}`
    )
      .bind(...binds)
      .first<{ id: number; product_id: number }>();

    if (!item) {
      return c.json(
        {
          error: {
            code: "ITEM_NOT_FOUND",
            message: "カートアイテムが見つかりません",
          },
        } satisfies ErrorResponse,
        404
      );
    }

    // 削除実行
    await c.env.DB.prepare(`DELETE FROM cart_items WHERE id = ?`)
      .bind(itemId)
      .run();

    return c.json({
      data: {
        deleted: true,
        item_id: itemId,
      },
    } satisfies SuccessResponse);
  } catch (error) {
    console.error("カート削除エラー:", error);
    return c.json(
      {
        error: {
          code: "SERVER_ERROR",
          message: "カートアイテムの削除に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 5. ルート設定

`backend/src/routes/index.ts`:

```typescript
// ... 既存のインポート ...
import { getCartHandler } from "endpoints/cart/getCart";
import { addToCartHandler } from "endpoints/cart/addToCart";
import { updateCartItemHandler } from "endpoints/cart/updateCartItem";
import { deleteCartItemHandler } from "endpoints/cart/deleteCartItem";

// ... 既存のルート定義 ...

// =====================
// Cart Routes
// =====================
app
  .get("/api/cart", jwtMiddlewareOptional, getCartHandler)
  .post("/api/cart", jwtMiddlewareOptional, addToCartHandler)
  .put("/api/cart/:item_id", jwtMiddlewareOptional, updateCartItemHandler)
  .delete("/api/cart/:item_id", jwtMiddlewareOptional, deleteCartItemHandler);
```

### 6. データベーススキーマ

`migrations/schema.sql` に以下を追加:

```sql
-- カートアイテムテーブル
CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  user_id INTEGER,
  session_id TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_session_id ON cart_items(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
```

### 7. 主な改良点

1. **型安全性の向上**:

   - Zod スキーマによる入力バリデーション
   - 型定義の明確化

2. **在庫管理の統合**:

   - 商品在庫とカート数量の連携
   - 在庫不足時の適切なエラーレスポンス

3. **セッションとユーザー統合**:

   - ゲストとログインユーザーのカート統合ロジック
   - オプショナルな JWT 認証ミドルウェア

4. **エラーハンドリング**:

   - 詳細なエラーコードとメッセージ
   - 開発者向け情報を含むエラーレスポンス

5. **パフォーマンス最適化**:
   - 効率的な SQL クエリ
   - 必要なフィールドのみ取得

### 8. 動作確認

#### カート取得

```bash
curl -X GET http://localhost:8787/api/cart \
  -H "x-session-id: [セッションID]"
```

#### 商品追加

```bash
curl -X POST http://localhost:8787/api/cart \
  -H "Content-Type: application/json" \
  -H "x-session-id: [セッションID]" \
  -d '{"product_id": 123, "quantity": 2}'
```

#### 数量更新

```bash
curl -X PUT http://localhost:8787/api/cart/456 \
  -H "Content-Type: application/json" \
  -H "x-session-id: [セッションID]" \
  -d '{"quantity": 3}'
```

#### 商品削除

```bash
curl -X DELETE http://localhost:8787/api/cart/456 \
  -H "x-session-id: [セッションID]"
```

この実装により、ユーザーフレンドリーで堅牢なカートシステムを構築できます。ゲストユーザーとログインユーザーの両方に対応し、在庫管理と密接に連携することで、実際の EC サイトのような操作性を実現しています。
