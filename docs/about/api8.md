了解しました。注文管理システムを以下のように実装します。カートからの注文確定、注文履歴の閲覧、注文ステータス管理など、EC サイトのコア機能を包括的に実装します。

### 1. 注文確定 API (`POST /orders`)

`backend/src/endpoints/orders/createOrder.ts`:

```typescript
import { Context } from "hono";
import {
  Bindings,
  ErrorResponse,
  SuccessResponse,
  JwtPayload,
} from "../../types/types";
import { z } from "zod";

export const createOrderHandler = async (
  c: Context<{ Bindings: Bindings; Variables: { jwtPayload?: JwtPayload } }>
): Promise<Response> => {
  const payload = c.get("jwtPayload");
  const user_id = payload?.user_id;
  const sessionId = c.req.header("x-session-id");

  if (!user_id) {
    return c.json(
      {
        error: {
          code: "AUTH_REQUIRED",
          message: "注文にはログインが必要です",
        },
      } satisfies ErrorResponse,
      401
    );
  }

  try {
    // 1. カートアイテムを取得
    const cartItems = await c.env.DB.prepare(
      `SELECT 
        ci.id as cart_item_id,
        ci.product_id,
        p.name as product_name,
        p.price,
        ci.quantity,
        p.stock,
        (p.price * ci.quantity) as subtotal
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = ? OR ci.session_id = ?`
    )
      .bind(user_id, sessionId)
      .all<{
        cart_item_id: number;
        product_id: number;
        product_name: string;
        price: number;
        quantity: number;
        stock: number;
        subtotal: number;
      }>();

    if (!cartItems.results.length) {
      return c.json(
        {
          error: {
            code: "EMPTY_CART",
            message: "カートが空です",
          },
        } satisfies ErrorResponse,
        400
      );
    }

    // 2. 在庫チェック
    const outOfStockItems = cartItems.results.filter(
      (item) => item.quantity > item.stock
    );

    if (outOfStockItems.length) {
      return c.json(
        {
          error: {
            code: "INSUFFICIENT_STOCK",
            message: "在庫が不足している商品があります",
            items: outOfStockItems.map((item) => ({
              product_id: item.product_id,
              product_name: item.product_name,
              requested: item.quantity,
              available: item.stock,
            })),
          },
        } satisfies ErrorResponse,
        400
      );
    }

    // 3. トランザクション開始
    const orderId = await c.env.DB.batch([
      // 注文作成
      c.env.DB.prepare(
        `INSERT INTO orders (
          user_id, 
          status, 
          total_amount, 
          created_at
        ) VALUES (?, ?, ?, ?) RETURNING id`
      ).bind(
        user_id,
        "processing", // 初期ステータス
        cartItems.results.reduce((sum, item) => sum + item.subtotal, 0),
        new Date().toISOString()
      ),

      // 注文明細作成
      ...cartItems.results.flatMap((item) => [
        c.env.DB.prepare(
          `INSERT INTO order_items (
            order_id,
            product_id,
            product_name,
            price,
            quantity,
            subtotal
          ) VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
          "last_insert_rowid()",
          item.product_id,
          item.product_name,
          item.price,
          item.quantity,
          item.subtotal
        ),

        // 在庫減算
        c.env.DB.prepare(
          `UPDATE products SET stock = stock - ? WHERE id = ?`
        ).bind(item.quantity, item.product_id),
      ]),

      // カートクリア
      c.env.DB.prepare(
        `DELETE FROM cart_items WHERE user_id = ? OR session_id = ?`
      ).bind(user_id, sessionId),
    ]).then((results) => results[0].results?.[0]?.id);

    if (!orderId) {
      throw new Error("注文作成に失敗しました");
    }

    // 4. 注文詳細を取得
    const order = await getOrderDetails(c.env.DB, orderId, user_id);

    return c.json(
      {
        data: order,
        message: "注文が確定しました",
      } satisfies SuccessResponse,
      201
    );
  } catch (error) {
    console.error("注文エラー:", error);
    return c.json(
      {
        error: {
          code: "ORDER_FAILED",
          message: "注文処理中にエラーが発生しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};

async function getOrderDetails(
  db: D1Database,
  orderId: number,
  userId: number
) {
  const order = await db
    .prepare(
      `SELECT 
        id,
        user_id,
        status,
        total_amount,
        created_at,
        updated_at
       FROM orders 
       WHERE id = ? AND user_id = ?`
    )
    .bind(orderId, userId)
    .first<{
      id: number;
      user_id: number;
      status: string;
      total_amount: number;
      created_at: string;
      updated_at: string;
    }>();

  if (!order) {
    throw new Error("注文が見つかりません");
  }

  const items = await db
    .prepare(
      `SELECT 
        product_id,
        product_name,
        price,
        quantity,
        subtotal
       FROM order_items 
       WHERE order_id = ?`
    )
    .bind(orderId)
    .all<{
      product_id: number;
      product_name: string;
      price: number;
      quantity: number;
      subtotal: number;
    }>();

  return {
    ...order,
    items: items.results,
  };
}
```

### 2. 注文一覧 API (`GET /orders`)

`backend/src/endpoints/orders/listOrders.ts`:

```typescript
import { Context } from "hono";
import {
  Bindings,
  ErrorResponse,
  SuccessResponse,
  JwtPayload,
} from "../../types/types";

export const listOrdersHandler = async (
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
    const perPage = Math.min(Math.max(parseInt(query.per_page) || 10, 1), 50);

    // 注文一覧取得
    const { results } = await c.env.DB.prepare(
      `SELECT 
        id,
        status,
        total_amount,
        created_at
       FROM orders 
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(user_id, perPage, (page - 1) * perPage)
      .all<{
        id: number;
        status: string;
        total_amount: number;
        created_at: string;
      }>();

    // 総数取得
    const { total } = await c.env.DB.prepare(
      "SELECT COUNT(*) as total FROM orders WHERE user_id = ?"
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
    console.error("注文一覧取得エラー:", error);
    return c.json(
      {
        error: {
          code: "SERVER_ERROR",
          message: "注文一覧の取得に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 3. 注文詳細 API (`GET /orders/:id`)

`backend/src/endpoints/orders/getOrderDetails.ts`:

```typescript
import { Context } from "hono";
import {
  Bindings,
  ErrorResponse,
  SuccessResponse,
  JwtPayload,
} from "../../types/types";

export const getOrderDetailsHandler = async (
  c: Context<{ Bindings: Bindings; Variables: { jwtPayload?: JwtPayload } }>
): Promise<Response> => {
  const payload = c.get("jwtPayload");
  const user_id = payload?.user_id;
  const orderId = parseInt(c.req.param("id"));

  if (isNaN(orderId)) {
    return c.json(
      {
        error: {
          code: "INVALID_ORDER_ID",
          message: "無効な注文IDです",
        },
      } satisfies ErrorResponse,
      400
    );
  }

  try {
    // 注文の存在確認と権限チェック
    const order = await c.env.DB.prepare(
      `SELECT user_id, status FROM orders WHERE id = ?`
    )
      .bind(orderId)
      .first<{ user_id: number; status: string }>();

    if (!order) {
      return c.json(
        {
          error: {
            code: "ORDER_NOT_FOUND",
            message: "注文が見つかりません",
          },
        } satisfies ErrorResponse,
        404
      );
    }

    // 本人または管理者のみアクセス可
    const isAdmin = payload?.role === "admin";
    if (order.user_id !== user_id && !isAdmin) {
      return c.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "この注文へのアクセス権限がありません",
          },
        } satisfies ErrorResponse,
        403
      );
    }

    // 注文詳細取得
    const orderDetails = await getOrderDetails(
      c.env.DB,
      orderId,
      order.user_id
    );

    return c.json({
      data: orderDetails,
    } satisfies SuccessResponse);
  } catch (error) {
    console.error("注文詳細取得エラー:", error);
    return c.json(
      {
        error: {
          code: "SERVER_ERROR",
          message: "注文詳細の取得に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};

async function getOrderDetails(
  db: D1Database,
  orderId: number,
  userId: number
) {
  const order = await db
    .prepare(
      `SELECT 
        id,
        user_id,
        status,
        total_amount,
        created_at,
        updated_at
       FROM orders 
       WHERE id = ? AND user_id = ?`
    )
    .bind(orderId, userId)
    .first<{
      id: number;
      user_id: number;
      status: string;
      total_amount: number;
      created_at: string;
      updated_at: string;
    }>();

  if (!order) {
    throw new Error("注文が見つかりません");
  }

  const items = await db
    .prepare(
      `SELECT 
        product_id,
        product_name,
        price,
        quantity,
        subtotal
       FROM order_items 
       WHERE order_id = ?`
    )
    .bind(orderId)
    .all<{
      product_id: number;
      product_name: string;
      price: number;
      quantity: number;
      subtotal: number;
    }>();

  return {
    ...order,
    items: items.results,
  };
}
```

### 4. 注文ステータス更新 API (`PUT /orders/:id/status`)

`backend/src/endpoints/orders/updateOrderStatus.ts`:

```typescript
import { Context } from "hono";
import {
  Bindings,
  ErrorResponse,
  SuccessResponse,
  JwtPayload,
} from "../../types/types";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum([
    "processing",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
  ]),
});

export const updateOrderStatusHandler = async (
  c: Context<{ Bindings: Bindings; Variables: { jwtPayload?: JwtPayload } }>
): Promise<Response> => {
  const payload = c.get("jwtPayload");
  const orderId = parseInt(c.req.param("id"));

  if (!payload || payload.role !== "admin") {
    return c.json(
      {
        error: {
          code: "ADMIN_REQUIRED",
          message: "管理者権限が必要です",
        },
      } satisfies ErrorResponse,
      403
    );
  }

  if (isNaN(orderId)) {
    return c.json(
      {
        error: {
          code: "INVALID_ORDER_ID",
          message: "無効な注文IDです",
        },
      } satisfies ErrorResponse,
      400
    );
  }

  try {
    const json = await c.req.json();
    const result = statusSchema.safeParse(json);

    if (!result.success) {
      return c.json(
        {
          error: {
            code: "INVALID_STATUS",
            message: "無効なステータスです",
          },
        } satisfies ErrorResponse,
        400
      );
    }

    const { status } = result.data;

    // 注文存在確認
    const order = await c.env.DB.prepare("SELECT id FROM orders WHERE id = ?")
      .bind(orderId)
      .first();

    if (!order) {
      return c.json(
        {
          error: {
            code: "ORDER_NOT_FOUND",
            message: "注文が見つかりません",
          },
        } satisfies ErrorResponse,
        404
      );
    }

    // ステータス更新
    await c.env.DB.prepare(
      "UPDATE orders SET status = ?, updated_at = ? WHERE id = ?"
    )
      .bind(status, new Date().toISOString(), orderId)
      .run();

    return c.json({
      data: {
        order_id: orderId,
        new_status: status,
        updated_at: new Date().toISOString(),
      },
    } satisfies SuccessResponse);
  } catch (error) {
    console.error("ステータス更新エラー:", error);
    return c.json(
      {
        error: {
          code: "SERVER_ERROR",
          message: "ステータスの更新に失敗しました",
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
import { createOrderHandler } from "endpoints/orders/createOrder";
import { listOrdersHandler } from "endpoints/orders/listOrders";
import { getOrderDetailsHandler } from "endpoints/orders/getOrderDetails";
import { updateOrderStatusHandler } from "endpoints/orders/updateOrderStatus";

// ... 既存のルート定義 ...

// =====================
// Order Routes
// =====================
app
  .post("/api/orders", jwtMiddleware, createOrderHandler)
  .get("/api/orders", jwtMiddleware, listOrdersHandler)
  .get("/api/orders/:id", jwtMiddleware, getOrderDetailsHandler)
  .put(
    "/api/orders/:id/status",
    jwtMiddleware,
    adminMiddleware,
    updateOrderStatusHandler
  );
```

### 6. データベーススキーマ

`migrations/schema.sql` に以下を追加:

```sql
-- 注文テーブル
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  total_amount INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 注文明細テーブル
CREATE TABLE IF NOT EXISTS order_items (
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ステータス履歴テーブル（オプション）
CREATE TABLE IF NOT EXISTS order_status_history (
  order_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
```

### 7. 主な機能と特徴

1. **注文確定プロセス**:

   - カート内容から注文を生成
   - 在庫チェックと自動減算
   - トランザクションによる安全な処理

2. **注文管理**:

   - 注文一覧と詳細閲覧
   - ページネーション対応
   - 注文ステータス管理

3. **セキュリティ**:

   - 本人確認（注文詳細アクセス）
   - 管理者権限チェック（ステータス更新）

4. **エラーハンドリング**:

   - 在庫不足時の詳細なエラーレスポンス
   - バリデーションエラー対応

5. **拡張性**:
   - ステータス履歴テーブル（オプション）
   - 複数配送先対応可能な設計

### 8. 動作確認スクリプト

#### 注文確定:

```bash
curl -X POST http://localhost:8787/api/orders \
  -H "Authorization: Bearer [ユーザートークン]" \
  -H "Content-Type: application/json"
```

#### 注文一覧:

```bash
curl -X GET http://localhost:8787/api/orders \
  -H "Authorization: Bearer [ユーザートークン]"
```

#### 注文詳細:

```bash
curl -X GET http://localhost:8787/api/orders/123 \
  -H "Authorization: Bearer [ユーザートークン]"
```

#### ステータス更新（管理者）:

```bash
curl -X PUT http://localhost:8787/api/orders/123/status \
  -H "Authorization: Bearer [管理者トークン]" \
  -H "Content-Type: application/json" \
  -d '{"status":"shipped"}'
```

この実装により、EC サイトのコア機能である注文システムを安全かつ効率的に構築できます。ユーザー体験と管理者機能の両方を考慮した設計となっています。
