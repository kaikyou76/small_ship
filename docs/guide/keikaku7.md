# REST APIのバージョンアップ
- JWTの署名・検証用のjoseをインストールします。

```sh
PS D:\next-projects\kaikyou-shop\backend> npm install jose
```
- `backend\.env.development`の作成`
```
JWT_SECRET=super_secret_key
JWT_ISSUER=kaikyou-shop
JWT_AUDIENCE=kaikyou-shop-users
```
- wrangler.jsonc に以下を追記

- dotenv パッケージをインストール
```sh
PS D:\next-projects\kaikyou-shop\backend> npm install dotenv
```
- backend\src\index.tsの最初で`.env`を読み込む
```ts
// backend/src/index.ts
import 'dotenv/config'; // ←必ずファイルの最上部で
```
- wrangler.jsonc に以下を追記
```js
{
	"$schema": "node_modules/wrangler/config-schema.json",
	"name": "backend",
	"main": "src/index.ts",
	"compatibility_date": "2025-04-18",
	"observability": {
		"enabled": true
	},
	"d1_databases": [
		{
		  "binding": "DB",
		  "database_name": "shopping-db",
		  "database_id": "f48c6205-4a37-448-81*1e-1cb0***dc***0d"
		}
	  ],
	"vars": {
		"JWT_SECRET": "super_secret_key",
		"JWT_ISSUER": "kaikyou-shop",
		"JWT_AUDIENCE": "kaikyou-shop-users"
	}
}

```
- ✅backend\src\middleware\jwt.ts `MiddlewareHandler`を実装します。

```typescript
import { MiddlewareHandler } from 'hono';
import { jwtVerify } from 'jose';
import { JwtPayload } from 'types';

export const jwtMiddleware: MiddlewareHandler<{
  Bindings: {
    DB: D1Database;
    JWT_SECRET: string;
  };
  Variables: {
    jwtPayload?: JwtPayload;
  };
}> = async (c, next) => {
  // 1. Authorizationヘッダーからトークンを取得
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      { 
        error: { 
          message: '認証トークンが不足しています',
          code: 'AUTH_HEADER_MISSING' 
        } 
      },
      401
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. JWTの検証
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'your-issuer',
      audience: 'your-audience',
    });

    // 3. 型チェック付きでペイロードを検証
    if (!payload.user_id || !payload.email) {
      throw new Error('トークンペイロードが不正です');
    }

    // 4. コンテキストに認証情報を設定
    c.set('jwtPayload', {
      user_id: Number(payload.user_id),
      email: String(payload.email),
      exp: payload.exp ? Number(payload.exp) : undefined,
    });

    await next();
  } catch (error) {
    console.error('JWT検証エラー:', error);

    return c.json(
      { 
        error: { 
          message: '認証トークンが無効です',
          code: 'INVALID_TOKEN',
          details: process.env.NODE_ENV === 'development'
            ? { error: error instanceof Error ? error.message : String(error) }
            : undefined
        } 
      },
      401
    );
  }
};

```
- ✅backend\src\endpoints\productCreate.tsを更新します。
```typescript
import { z } from "zod";
import { Context } from "hono";

type Bindings = {
  DB: D1Database;
};
export const productPostHandler = async (c: Context<{ Bindings: Bindings }>) => {
  const bodySchema = z.object({
    name: z.string().min(1, "商品名は必須です"),
    description: z.string().optional(),
    price: z.number().positive("正の値を指定してください"),
    stock: z.number().int().nonnegative().default(0),
    category_id: z.number().int().optional(),
    image_url: z.string().url("有効なURLを指定してください").optional(),
  }).strict();

  try {
    const validated = bodySchema.safeParse(await c.req.json());
    if (!validated.success) {
      return c.json({ error: validated.error.flatten() }, 400);
    }

    const { name, description, price, image_url, stock, category_id } = validated.data;
    const result = await c.env.DB.prepare(`
      INSERT INTO products 
        (name, description, price, image_url, stock, category_id)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING id, name, price, stock;
    `).bind(name, description, price, image_url, stock, category_id).first();

    return c.json(result, 201);
  } catch (error) {
    console.error("商品登録失敗:", error);
    return c.json({ error: "商品登録に失敗しました" }, 500);
  }
};
```
- ✅backend\src\endpoints\productGet.tsをindex.tsから分離します。
```typescript
import { Context } from "hono";

type Bindings = {
  DB: D1Database;
};

export const productGetHandler = async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM products').all();
    return c.json(results);
  } catch (error) {
    console.error('Error fetching products:', error);
    return c.json({ error: 'サーバーエラーが発生しました' }, 500);
  }
};

```
- ✅backend\src\endpoints\getCart.tsを実装します。
```typescript
// backend/src/endpoints/getCart.ts
import { Context } from 'hono';
import { Bindings, CartItem, ErrorResponse, JwtPayload } from 'types';

// レスポンス型の厳密な定義
type CartResponse = CartItem[] | ErrorResponse;

export const getCartHandler = async (
  c: Context<{ 
    Bindings: Bindings,
    Variables: { jwtPayload?: JwtPayload } 
  }>
): Promise<Response> => {
  // 認証情報の型安全な取得
  const payload = c.get('jwtPayload');
  const user_id = payload?.user_id;
  const sessionId = c.req.header('x-session-id');

  // バリデーション（ErrorResponse型に準拠）
  if (!user_id && !sessionId) {
    return c.json(
      { 
        error: { 
          message: 'セッションIDまたは認証が必要です',
          details: { 
            required: ['x-session-id', 'jwt'],
            received: { hasSessionId: !!sessionId, hasJWT: !!user_id }
          } 
        } 
      } satisfies ErrorResponse,
      400
    );
  }

  try {
    // 型安全なクエリ構築
    const whereClause = user_id ? 'ci.user_id = ?' : 'ci.session_id = ?';
    const mergeClause = user_id && sessionId ? 'OR ci.session_id = ?' : '';
    const query = `
      SELECT 
        p.id, p.name, p.price, p.image_url,
        ci.quantity,
        (p.price * ci.quantity) as subtotal
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ${whereClause} ${mergeClause}
    `;

    // 動的バインディング
    const binds = user_id ? [user_id] : [sessionId as string | number];
    if (user_id && sessionId) binds.push(sessionId);

    // 型付きクエリ実行
    const { results } = await c.env.DB.prepare(query)
      .bind(...binds)
      .all<CartItem>();

    // カート統合ロジック
    if (user_id && sessionId) {
      await mergeCarts(c.env.DB, user_id, sessionId);
    }

    return c.json(results satisfies CartItem[]);
  } catch (error) {
    console.error('カート取得エラー:', error);
    return c.json(
      { 
        error: { 
          message: 'サーバー内部エラー',
          details: process.env.NODE_ENV === 'development' 
            ? { error: error instanceof Error ? error.message : String(error) } 
            : undefined 
        } 
      } satisfies ErrorResponse,
      500
    );
  }
};

// カート統合関数（型安全に分離）
const mergeCarts = async (
  db: D1Database,
  user_id: number,
  session_id: string
): Promise<void> => {
  try {
    await db.batch([
      db.prepare(`
        UPDATE cart_items 
        SET user_id = ?, session_id = NULL 
        WHERE session_id = ?
      `).bind(user_id, session_id),
      
      db.prepare(`
        DELETE FROM cart_items 
        WHERE rowid NOT IN (
          SELECT MIN(rowid)
          FROM cart_items
          GROUP BY COALESCE(user_id, -1), product_id
        )
      `)
    ]);
  } catch (error) {
    console.error('カート統合エラー:', error);
    throw new Error('カートの統合に失敗しました');
  }
};

```
- ✅backend\src\index.tsを更新します。
```typescript
// backend/src/index.ts
import 'dotenv/config';
import { Hono } from "hono";
import { productPostHandler } from "endpoints/productCreate";
import { productGetHandler } from "endpoints/productGet";
import { getCartHandler } from "endpoints/getCart";
import { jwtMiddleware } from "./middleware/jwt";

type Bindings = {
  DB: D1Database;
};

type Variables = {
  jwtPayload?: {
    user_id: number;
    email: string;
  };
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// =====================
// Global Middlewares
// =====================
app.use('*', async (c, next) => {
  // CORS Preflight
  if (c.req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-ID',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  
  await next();
  
  // CORS Headers for actual requests
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Vary', 'Origin');
});

// JWT Middleware (適用が必要なルートのみ)
app.use('/api/cart', jwtMiddleware);

// =====================
// API Routes
// =====================
// Product API
app.post('/api/products', productPostHandler)
   .get('/api/products', productGetHandler);

// Cart API
app.get('/api/cart', getCartHandler)
   .post('/api/cart', /* cartPostHandler */)
   .delete('/api/cart/:productId', /* cartDeleteHandler */);

// =====================
// Health Check
// =====================
app.get('/health', (c) => c.json({ status: 'healthy' }));

// =====================
// Error Handling
// =====================
app.onError((err, c) => {
  console.error('Global Error:', err);
  return c.json(
    {
      error: {
        message: 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' 
          ? { error: err.message } 
          : undefined
      }
    },
    500
  );
});

export default app;

```

以下は、**現在の `kaikyou-shop` プロジェクト構造の最新の進捗状況**を反映したディレクトリツリーです。進捗に基づいて説明付きで整理しています。

---

```
kaikyou-shop/
├── frontend/                          # Next.js フロントエンド（App Router 構成）
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                   # 商品一覧ページ（/）
│   │   ├── product/
│   │   │   └── [id]/page.tsx          # 商品詳細ページ（/product/:id）
│   │   ├── cart/
│   │   │   └── page.tsx               # カートページ（/cart）
│   │   ├── checkout/
│   │   │   └── page.tsx               # チェックアウトページ（/checkout）
│   ├── components/                    # ボタンやカードなど再利用 UI コンポーネント群
│   ├── public/
│   │   └── images/                    # 商品画像などの静的ファイル
│   ├── styles/
│   │   └── global.css
│   ├── utils/
│   │   └── api.ts                     # API 呼び出し用ユーティリティ
│   ├── .env.local                     # フロントエンド用環境変数（BASE_URL など）
│   ├── next.config.js
│   └── tsconfig.json

├── backend/                           # Cloudflare Workers バックエンド
│   ├── src/
│   │   ├── index.ts                   # Hono アプリのエントリーポイント（ルーティング）
│   │   ├── endpoints/                 # 各 API エンドポイント（分割管理）
│   │   │   ├── productCreate.ts       # POST /api/products（商品登録）
│   │   │   ├── productGet.ts          # GET /api/products（商品一覧）
│   │   │   ├── getCart.ts             # GET /api/cart（カート取得）
│   │   │   ├── productUpdate.ts       # PUT /api/products/:id（未実装・予定）
│   │   │   ├── productDelete.ts       # DELETE /api/products/:id（未実装・予定）
│   │   ├── middleware/
│   │   │   └── jwt.ts                 # JWT ミドルウェア（認証用）
│   │   └── types.ts                   # 共通の型定義（Bindings, CartItem, ErrorResponse 等）
│   ├── db/
│   │   └── schema.sql                 # Cloudflare D1 スキーマ定義（products, cart_items 他）
│   ├── wrangler.jsonc                 # Cloudflare Workers 設定（bindings, routes 等）
│   ├── .env                           # バックエンド用環境変数

├── README.md
└── package.json                       # Monorepo 管理（ルートパッケージマネージャ）
```

---

### ✅ 進捗状況まとめ

| 項目                     | ステータス | メモ |
|--------------------------|------------|------|
| 商品一覧取得（GET）     | ✅ 完了     | `/api/products` |
| 商品登録（POST）        | ✅ 完了     | `/api/products` |
| 商品詳細取得（GET）     | 🔲 未実装   | `/api/products/:id` |
| 商品更新（PUT）         | 🔲 未実装   | `/api/products/:id` |
| 商品削除（DELETE）      | 🔲 未実装   | `/api/products/:id` |
| カート取得              | ✅ 完了     | `/api/cart`（JWT or Session対応） |
| カート追加・削除        | 🔲 未実装   | `/api/cart`（POST/DELETE予定） |
| JWT 認証ミドルウェア     | ✅ 実装済   | `/api/cart` に適用 |
| CORS 対応               | ✅ 実装済   | OPTIONS対応と共に |
| データベーススキーマ設計 | ✅ 完了     | `products`, `cart_items` 等 |

---

次のステップとしては以下が挙げられます：

- `GET /api/products/:id` の実装（商品詳細）
- `POST /api/cart` の実装（カートに追加）
- `DELETE /api/cart/:productId` の実装（カートから削除）
- `PUT /api/products/:id`, `DELETE /api/products/:id`（商品更新・削除）
- 管理者向け認証ルート（将来的に）

ご希望があれば「次に実装すべきエンドポイントの雛形」も用意できます！どこから着手したいか教えてください。