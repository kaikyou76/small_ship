# 1. 🔐 認証系 API 開発

Next.js と Cloudflare Workers/D1 を使用した認証 API の実装を以下に示します。まず、必要なエンドポイントを実装する前に、認証関連のユーティリティ関数を準備します。

### 1. 認証関連ユーティリティファイルの作成

`backend/src/lib/auth.ts` に認証関連の関数をまとめます：

```typescript
// backend/src/lib/auth.ts
import { SignJWT, jwtVerify } from "jose";
import { Env, JwtPayload } from "types/types";

// トークン生成関数
export async function generateAuthToken(
  env: Env,
  userId: number,
  email: string,
  expiresIn = "2h"
): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  return new SignJWT({ user_id: userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .sign(secret);
}

// パスワードハッシュ関数（PBKDF2を使用）
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16)); // ランダムなソルト
  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000, // イテレーション回数
      hash: "SHA-256", // ハッシュアルゴリズム
    },
    keyMaterial,
    256 // ハッシュのビット長
  );

  const hash = new Uint8Array(derivedBits);
  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...hash));

  // ソルト、ハッシュ、アルゴリズム情報を組み合わせて保存
  return `${saltB64}:${hashB64}:100000:SHA-256`;
}

// パスワード検証関数（PBKDF2を使用）
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  const [saltB64, hashB64, iterations, hashAlg] = hashedPassword.split(":");
  if (!saltB64 || !hashB64 || !iterations || !hashAlg) {
    throw new Error("Invalid password format");
  }

  const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
  const expectedHash = Uint8Array.from(atob(hashB64), (c) => c.charCodeAt(0));
  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: parseInt(iterations, 10),
      hash: hashAlg as string,
    },
    keyMaterial,
    expectedHash.length * 8
  );

  const actualHash = new Uint8Array(derivedBits);
  return crypto.subtle.timingSafeEqual(actualHash, expectedHash);
}
```

### 2. 型ファイルの設定

`backend/src/types/types.ts`:

```typescript
//backend/src/types/types.ts
import type { D1Database, R2Bucket } from "@cloudflare/workers-types";
import { z } from "zod";
import { productSchema } from "../schemas/product";

//エラーコードを定義
export const INVALID_SESSION = "INVALID_SESSION";

/**
 * Cloudflare Worker にバインドされる環境変数
 * （wrangler.toml の [vars] や D1データベースなど）
 */
export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;
  ENVIRONMENT: "development" | "production" | "staging";
  R2_BUCKET: R2Bucket;
  R2_PUBLIC_DOMAIN: string;
}

/**
 * 後方互換のために保持している型エイリアス
 * 現在は Env と同一内容
 */
export interface Bindings extends Env {}

/**
 * JWT トークンから復号されるペイロード情報
 */
export interface JwtPayload {
  user_id: number;
  email: string;
  exp: number;
  iat?: number;
  iss?: string;
  aud?: string | string[];
}

/**
 * Hono コンテキストで使用する一時変数（リクエストごとのスコープ）
 * jwtMiddleware などでセットされる
 */
export interface Variables {
  jwtPayload?: JwtPayload; // 検証済みJWTペイロード（未認証なら undefined）
}

/**
 * カート内の商品1件のデータ型
 * API レスポンス用に追加情報フィールドを含む
 */
export interface CartItem {
  id: number;
  product_id: number;
  user_id: number | null;
  session_id: string | null;
  quantity: number;
  created_at: string;

  // ===== 計算・表示用フィールド（レスポンス用） =====
  subtotal?: number; // = price × quantity
  name?: string; // 商品名
  price?: number; // 単価
  image_url?: string; // 商品画像URL
}

/**
 * エラーレスポンスの統一フォーマット
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: z.typeToFlattenedError<z.infer<typeof productSchema>>; // Zodエラー
    meta?: {
      // 独自の情報
      errorMessage?: string;
      required?: string[];
      received?: Record<string, boolean>;
    };
    issues?: Array<{
      path: (string | number)[];
      message: string;
    }>;
    solution?: string;
  };
}

/**
 * 成功レスポンスの統一フォーマット（汎用ジェネリック）
 */
export interface SuccessResponse<T = unknown> {
  data: T;
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
}

/**
 * Hono の Context に拡張変数を型として登録
 * ctx.get('jwtPayload') などの補完が効くようになる
 */
declare module "hono" {
  interface ContextVariableMap {
    jwtPayload?: JwtPayload; // 認証オプショナルに統一
  }
}

// ストレージ関連の型（必要に応じて拡張）
export interface StorageConfig {
  folder?: string;
  maxFileSize?: number;
}

export interface ProductCreateResponse {
  success: boolean;
  data: {
    id: number;
    name: string;
    price: number;
    stock: number;
    images: {
      main: string;
      additional: string[];
    };
    createdAt: string;
  };
}
```

### 3. ミドルウエアの設定

`backend/src/middleware/jwt.ts`:

```typescript
// backend/src/middleware/jwt.ts
import { SignJWT, jwtVerify } from "jose";
import { MiddlewareHandler } from "hono";
import { Env, JwtPayload } from "../types/types";

// パスワードハッシュ設定型
type Pbkdf2Config = {
  iterations: number;
  hash: "SHA-256" | "SHA-512";
  saltLen: number;
  keyLen: number;
};

// 環境別PBKDF2設定
const PBKDF2_CONFIG: Record<string, Pbkdf2Config> = {
  development: {
    iterations: 100_000,
    hash: "SHA-256",
    saltLen: 16,
    keyLen: 32,
  },
  production: {
    iterations: 600_000,
    hash: "SHA-512",
    saltLen: 32,
    keyLen: 64,
  },
};

// 認証トークン生成
export async function generateAuthToken(
  env: Env,
  userId: number,
  email: string,
  expiresIn = "2h"
): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  return new SignJWT({ user_id: userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .sign(secret);
}

// パスワードハッシュ生成
export async function hashPassword(
  password: string,
  env: Env
): Promise<string> {
  const config = PBKDF2_CONFIG[env.ENVIRONMENT] || PBKDF2_CONFIG.production;
  const salt = crypto.getRandomValues(new Uint8Array(config.saltLen));
  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: config.iterations,
      hash: config.hash,
    },
    keyMaterial,
    config.keyLen * 8
  );

  const hash = new Uint8Array(derivedBits);
  const saltB64 = Buffer.from(salt).toString("base64");
  const hashB64 = Buffer.from(hash).toString("base64");

  return `${saltB64}:${hashB64}:${config.iterations}:${config.hash}`;
}

// タイミングセーフ比較（Node.jsやCloudflare対応）
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

// パスワード検証
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    const [saltB64, hashB64, iterationsStr, hashAlgStr] =
      hashedPassword.split(":");
    if (!saltB64 || !hashB64 || !iterationsStr || !hashAlgStr) {
      throw new Error("Invalid password format");
    }

    const salt = new Uint8Array(Buffer.from(saltB64, "base64"));
    const expectedHash = new Uint8Array(Buffer.from(hashB64, "base64"));
    const iterations = parseInt(iterationsStr, 10);
    const encoder = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations,
        hash: hashAlgStr as "SHA-256" | "SHA-512",
      },
      keyMaterial,
      expectedHash.length * 8
    );

    const actualHash = new Uint8Array(derivedBits);
    return timingSafeEqual(actualHash, expectedHash);
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

// JWT 検証ミドルウェア
export const jwtMiddleware: MiddlewareHandler<{
  Bindings: Env;
  Variables: {
    jwtPayload?: JwtPayload;
  };
}> = async (c, next) => {
  // 1. Authorization ヘッダーの検証
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    c.status(401);
    c.header("WWW-Authenticate", "Bearer");
    c.header("X-Content-Type-Options", "nosniff");
    return c.json({
      success: false,
      error: {
        code: "INVALID_AUTH_HEADER",
        message: "Authorization: Bearer <token> 形式が必要です",
        ...(c.env.ENVIRONMENT === "development" && {
          details: "Missing or malformed Authorization header",
        }),
      },
    });
  }

  // 2. トークンの抽出と検証
  const token = authHeader.split(" ")[1];

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(c.env.JWT_SECRET),
      {
        issuer: c.env.JWT_ISSUER,
        audience: c.env.JWT_AUDIENCE,
        clockTolerance: 15,
        algorithms: ["HS256"],
        maxTokenAge: "2h",
      }
    );

    // 3. ペイロードの必須項目確認
    if (
      typeof payload.user_id !== "number" ||
      typeof payload.email !== "string"
    ) {
      throw new Error("JWT payload missing required claims");
    }

    // 4. Context にユーザー情報を保存
    c.set("jwtPayload", {
      user_id: payload.user_id,
      email: payload.email,
      exp: payload.exp ?? Math.floor(Date.now() / 1000) + 7200,
    });

    await next();
  } catch (error) {
    //  5. 認証エラー時のレスポンス
    c.status(401);
    c.header("Cache-Control", "no-store");
    c.header("X-Content-Type-Options", "nosniff");

    return c.json({
      success: false,
      error: {
        code: "AUTH_FAILURE",
        message: "認証に失敗しました",
        ...(c.env.ENVIRONMENT === "development" && {
          details: error instanceof Error ? error.message : "Unknown error",
        }),
      },
    });
  }
};
```

### 4. ユーザー登録 API (`/api/register`)

`backend/src/endpoints/auth/register.ts`:

```typescript
//backend/src/endpoints/auth/register.ts
import { Context } from "hono";
import { Bindings, ErrorResponse, SuccessResponse } from "../../types/types";
import { hashPassword } from "../../lib/auth";
import { z } from "zod";

const registerSchema = z.object({
  name: z
    .string()
    .min(2, { message: "名前は2文字以上で入力してください" })
    .max(50, { message: "名前は50文字以内で入力してください" }),
  email: z
    .string()
    .email({ message: "正しいメールアドレスを入力してください" }),
  password: z
    .string()
    .min(8, { message: "パスワードは8文字以上で入力してください" }),
});

export const registerHandler = async (
  c: Context<{ Bindings: Bindings }>
): Promise<Response> => {
  try {
    const rawJson = await c.req.json();
    const validationResult = registerSchema.safeParse(rawJson);

    if (!validationResult.success) {
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "入力内容に誤りがあります",
            issues: validationResult.error.errors,
          },
        } satisfies ErrorResponse,
        400
      );
    }

    const { name, email, password } = validationResult.data;
    const passwordHash = await hashPassword(password);

    // メールアドレスの重複チェック
    const existingUser = await c.env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    )
      .bind(email)
      .first();

    if (existingUser) {
      return c.json(
        {
          error: {
            code: "EMAIL_EXISTS",
            message: "このメールアドレスは既に使用されています",
          },
        } satisfies ErrorResponse,
        409
      );
    }

    // ユーザー作成
    const result = await c.env.DB.prepare(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'user') RETURNING id"
    )
      .bind(name, email, passwordHash)
      .first<{ id: number }>();

    if (!result?.id) {
      throw new Error("Failed to create user");
    }

    return c.json(
      {
        data: {
          id: result.id,
          name,
          email,
          role: "user",
        },
      } satisfies SuccessResponse,
      201
    );
  } catch (error) {
    console.error("Registration error:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "ユーザー登録に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 5. ログイン API (`/api/login`)

`backend/src/endpoints/auth/login.ts`:

```typescript
// backend/src/endpoints/auth/login.ts
import { Context } from "hono";
import { Bindings, ErrorResponse, SuccessResponse } from "../../types/types";
import { generateAuthToken, verifyPassword } from "../../lib/auth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const loginHandler = async (
  c: Context<{ Bindings: Bindings }>
): Promise<Response> => {
  try {
    const rawJson = await c.req.json();
    const validationResult = loginSchema.safeParse(rawJson);

    if (!validationResult.success) {
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "メールアドレスとパスワードを正しく入力してください",
          },
        } satisfies ErrorResponse,
        400
      );
    }

    const { email, password } = validationResult.data;

    // ユーザー取得
    const user = await c.env.DB.prepare(
      "SELECT id, email, password_hash, name, role FROM users WHERE email = ?"
    )
      .bind(email)
      .first<{
        id: number;
        email: string;
        password_hash: string;
        name: string;
        role: string;
      }>();

    if (!user) {
      return c.json(
        {
          error: {
            code: "INVALID_CREDENTIALS",
            message: "メールアドレスまたはパスワードが正しくありません",
          },
        } satisfies ErrorResponse,
        401
      );
    }

    // パスワード検証
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return c.json(
        {
          error: {
            code: "INVALID_CREDENTIALS",
            message: "メールアドレスまたはパスワードが正しくありません",
          },
        } satisfies ErrorResponse,
        401
      );
    }

    // トークン生成（JWTのみ）
    const token = await generateAuthToken(c.env, user.id, user.email);

    // レスポンスでJWTとユーザー情報を返す
    return c.json(
      {
        data: {
          token, // JWT
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      } satisfies SuccessResponse,
      200
    );
  } catch (error) {
    console.error("Login error:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "ログイン処理に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 6. ログアウト API (`/api/logout`)

`backend/src/endpoints/auth/logout.ts`:

```typescript
//backend/src/endpoints/auth/logout.ts
import { Context } from "hono";
import { Bindings, ErrorResponse, SuccessResponse } from "../../types/types";

export const logoutHandler = async (
  c: Context<{ Bindings: Bindings }>
): Promise<Response> => {
  try {
    const authHeader = c.req.header("Authorization");
    const sessionToken = authHeader?.split(" ")[1];

    if (sessionToken) {
      // セッション削除
      await c.env.DB.prepare("DELETE FROM sessions WHERE session_token = ?")
        .bind(sessionToken)
        .run();
    }

    return c.json({ data: { success: true } } satisfies SuccessResponse, 200);
  } catch (error) {
    console.error("Logout error:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "ログアウト処理に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 7. ユーザー情報取得 API (`/api/users/me`)

`backend/src/endpoints/auth/getUser.ts`:

```typescript
//backend/src/endpoints/auth/getUser.ts
import { Context } from "hono";
import {
  Bindings,
  ErrorResponse,
  JwtPayload,
  SuccessResponse,
} from "../../types/types";

export const getUserHandler = async (
  c: Context<{ Bindings: Bindings; Variables: { jwtPayload?: JwtPayload } }>
): Promise<Response> => {
  try {
    const payload = c.get("jwtPayload");
    if (!payload) {
      return c.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "認証が必要です",
          },
        } satisfies ErrorResponse,
        401
      );
    }

    const user = await c.env.DB.prepare(
      "SELECT id, email, name, role, created_at FROM users WHERE id = ?"
    )
      .bind(payload.user_id)
      .first<{
        id: number;
        email: string;
        name: string;
        role: string;
        created_at: string;
      }>();

    if (!user) {
      return c.json(
        {
          error: {
            code: "USER_NOT_FOUND",
            message: "ユーザーが見つかりません",
          },
        } satisfies ErrorResponse,
        404
      );
    }

    return c.json(
      {
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.created_at,
        },
      } satisfies SuccessResponse,
      200
    );
  } catch (error) {
    console.error("Get user error:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "ユーザー情報の取得に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 8. ルートに認証 API を追加

`backend/src/routes/index.ts` を更新して、認証関連のルートを追加します：
![alt text](image-25.png)
完全版

```typescript
//backend/src/routes/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Bindings, Variables } from "../types/types";
import { productPostHandler } from "../endpoints/productCreate";
import { productGetHandler } from "../endpoints/productGet";
import { getCartHandler } from "../endpoints/getCart";
import { jwtMiddleware } from "../middleware/jwt";
import { productGetByIdHandler } from "../endpoints/productGetById";
import { registerHandler } from "../endpoints/auth/register";
import { loginHandler } from "../endpoints/auth/login";
import { logoutHandler } from "../endpoints/auth/logout";
import { getUserHandler } from "../endpoints/auth/getUser";

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// =====================
// Global Middlewares
// =====================
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Session-ID"],
    exposeHeaders: ["Content-Length"],
    maxAge: 86400,
  })
);

// =====================
// Authentication Middleware
// =====================
app.use("/api/cart/*", jwtMiddleware);
app.use("/api/products/*", async (c, next) => {
  if (["POST", "PUT", "DELETE"].includes(c.req.method)) {
    return jwtMiddleware(c, next);
  }
  await next();
});

// =====================
// API Routes
// =====================

// User API
app
  .post("/api/register", registerHandler)
  .post("/api/login", loginHandler)
  .post("/api/logout", logoutHandler)
  .get("/api/users/me", jwtMiddleware, getUserHandler);

// Product API
app
  .post("/api/products", productPostHandler)
  .get("/api/products", productGetHandler)
  .get("/api/products/:id", productGetByIdHandler)
  .options("/api/products", (c) => {
    return c.body(null, 204); // 204 No Contentを返す
  });

// Cart API
app
  .get("/api/cart", getCartHandler)
  .post("/api/cart" /* cartPostHandler */)
  .delete("/api/cart/:productId" /* cartDeleteHandler */);

// =====================
// System Routes
// =====================
app.get("/health", (c) =>
  c.json({
    status: "healthy",
    environment: c.env.ENVIRONMENT,
  })
);

// =====================
// Error Handling
// =====================
app.notFound((c) => {
  return c.json({ message: "Route Not Found" }, 404);
});

app.onError((err, c) => {
  console.error(`[${new Date().toISOString()}] Error:`, err);
  return c.json(
    {
      error: {
        message: "Internal Server Error",
        details:
          c.env.ENVIRONMENT === "development"
            ? {
                error: err.message,
                stack: err.stack,
              }
            : undefined,
      },
    },
    500
  );
});

export default app;
```

### 9. 環境変数の設定

`wrangler.jsonc` に以下の環境変数を追加してください：

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "backend",
  "main": "src/worker.ts",
  "compatibility_date": "2025-04-18",

  // ====================
  // ✅ Cloudflare D1 データベース設定
  // ====================
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "shopping-db",
      "database_id": "d53ad56f-f646-44dc-8dbf-3d2d15d76973",
      "preview_database_id": "d53ad56f-f646-44dc-8dbf-3d2d15d76973" // 追加
    }
  ],

  // ====================
  // ✅ Cloudflare R2 バケット設定 （開発用）
  // ====================
  "r2_buckets": [
    {
      "binding": "R2_BUCKET",
      "bucket_name": "dev-bucket",
      "preview_bucket_name": "preview-bucket"
    }
  ],

  // ====================
  // ✅ 環境変数（開発用）
  // ====================
  "vars": {
    "JWT_SECRET": "local_dev_secret_do_not_use_in_prod",
    "JWT_ISSUER": "kaikyou-shop-dev",
    "JWT_AUDIENCE": "kaikyou-shop-users-dev",
    "ENVIRONMENT": "development",
    "R2_PUBLIC_DOMAIN": "localhost:8787/assets"
  },

  // ====================
  // ✅ 本番環境設定
  // ====================
  "env": {
    "production": {
      "vars": {
        "JWT_SECRET": "{{ JWT_SECRET_PRODUCTION }}",
        "JWT_ISSUER": "kaikyou-shop",
        "JWT_AUDIENCE": "kaikyou-shop-users",
        "ENVIRONMENT": "production",
        "R2_PUBLIC_DOMAIN": "assets.example.com"
      },
      "r2_buckets": [
        {
          "binding": "R2_BUCKET",
          "bucket_name": "production-bucket"
        }
      ],
      // 本番用D1設定（必要に応じて追加）
      "d1_databases": [
        {
          "binding": "DB",
          "database_name": "shopping-db",
          "database_id": "d53ad56f-f646-44dc-8dbf-3d2d15d76973"
        }
      ]
    }
  }
}
```

# ✅ ストケース

テストケースを作成します。各エンドポイントに対して、正常系と異常系のテストケースをカバーします。

---

### 1. ユーザー登録 API (`/api/register`)

#### 正常系

- **ケース 1**: 正しい入力でユーザー登録が成功する

  - 入力: `{ "name": "John Doe", "email": "john@example.com", "password": "password123" }`
  - 期待結果: ステータスコード `201`、レスポンスにユーザー ID、名前、メールアドレスを含む

- **ケース 2**: 最小長のパスワードで登録が成功する
  - 入力: `{ "name": "Jane Doe", "email": "jane@example.com", "password": "12345678" }`
  - 期待結果: ステータスコード `201`、レスポンスにユーザー ID、名前、メールアドレスを含む

#### 異常系

- **ケース 3**: メールアドレスが既に登録されている

  - 入力: `{ "name": "John Doe", "email": "john@example.com", "password": "password123" }`
  - 期待結果: ステータスコード `409`、エラーメッセージ `"このメールアドレスは既に使用されています"`

- **ケース 4**: パスワードが最小長未満

  - 入力: `{ "name": "John Doe", "email": "john@example.com", "password": "123" }`
  - 期待結果: ステータスコード `400`、エラーメッセージ `"入力内容に誤りがあります"`

- **ケース 5**: メールアドレスが無効な形式
  - 入力: `{ "name": "John Doe", "email": "invalid-email", "password": "password123" }`
  - 期待結果: ステータスコード `400`、エラーメッセージ `"入力内容に誤りがあります"`

---

### 2. ログイン API (`/api/login`)

#### 正常系

- **ケース 1**: 正しいメールアドレスとパスワードでログインが成功する
  - 入力: `{ "email": "john@example.com", "password": "password123" }`
  - 期待結果: ステータスコード `200`、レスポンスに JWT トークンとユーザー情報を含む

#### 異常系

- **ケース 2**: メールアドレスが存在しない

  - 入力: `{ "email": "unknown@example.com", "password": "password123" }`
  - 期待結果: ステータスコード `401`、エラーメッセージ `"メールアドレスまたはパスワードが正しくありません"`

- **ケース 3**: パスワードが間違っている

  - 入力: `{ "email": "john@example.com", "password": "wrongpassword" }`
  - 期待結果: ステータスコード `401`、エラーメッセージ `"メールアドレスまたはパスワードが正しくありません"`

- **ケース 4**: メールアドレスが空
  - 入力: `{ "email": "", "password": "password123" }`
  - 期待結果: ステータスコード `400`、エラーメッセージ `"メールアドレスとパスワードを正しく入力してください"`

---

### 3. ログアウト API (`/api/logout`)

#### 正常系

- **ケース 1**: 正しいトークンでログアウトが成功する
  - ヘッダー: `Authorization: Bearer <valid-token>`
  - 期待結果: ステータスコード `200`、レスポンスに `{ "success": true }`

#### 異常系

- **ケース 2**: トークンが無効

  - ヘッダー: `Authorization: Bearer <invalid-token>`
  - 期待結果: ステータスコード `401`、エラーメッセージ `"認証に失敗しました"`

- **ケース 3**: トークンが未提供
  - ヘッダー: なし
  - 期待結果: ステータスコード `401`、エラーメッセージ `"認証に失敗しました"`

---

### 4. ユーザー情報取得 API (`/api/users/me`)

#### 正常系

- **ケース 1**: 正しいトークンでユーザー情報を取得する
  - ヘッダー: `Authorization: Bearer <valid-token>`
  - 期待結果: ステータスコード `200`、レスポンスにユーザー ID、名前、メールアドレスを含む

#### 異常系

- **ケース 2**: トークンが無効

  - ヘッダー: `Authorization: Bearer <invalid-token>`
  - 期待結果: ステータスコード `401`、エラーメッセージ `"認証が必要です"`

- **ケース 3**: トークンが未提供
  - ヘッダー: なし
  - 期待結果: ステータスコード `401`、エラーメッセージ `"認証が必要です"`

---

### 5. JWT ミドルウェアのテスト

#### 正常系

- **ケース 1**: 正しいトークンでリクエストが成功する
  - ヘッダー: `Authorization: Bearer <valid-token>`
  - 期待結果: リクエストが成功し、ユーザー情報が取得できる

#### 異常系

- **ケース 2**: トークンが無効

  - ヘッダー: `Authorization: Bearer <invalid-token>`
  - 期待結果: ステータスコード `401`、エラーメッセージ `"認証に失敗しました"`

- **ケース 3**: トークンが未提供

  - ヘッダー: なし
  - 期待結果: ステータスコード `401`、エラーメッセージ `"認証に失敗しました"`

- **ケース 4**: トークンの有効期限が切れている
  - ヘッダー: `Authorization: Bearer <expired-token>`
  - 期待結果: ステータスコード `401`、エラーメッセージ `"認証に失敗しました"`

---

### 6. パスワードハッシュ関数のテスト

#### 正常系

- **ケース 1**: 正しいパスワードで検証が成功する
  - 入力: パスワード `"password123"`
  - 期待結果: `verifyPassword` が `true` を返す

#### 異常系

- **ケース 2**: 間違ったパスワードで検証が失敗する

  - 入力: パスワード `"wrongpassword"`
  - 期待結果: `verifyPassword` が `false` を返す

- **ケース 3**: 無効なハッシュ形式で検証が失敗する
  - 入力: ハッシュ `"invalid-hash"`
  - 期待結果: `verifyPassword` がエラーをスローする

---

これらのテストケースを使用して、API の動作を確認し、異常系のケースも適切にハンドリングされていることを確認してください。

# ✅ 動作確認-**cURL** でのテスト

以下は、提供された認証系 API のすべてのエンドポイントを **cURL** でテストするためのコマンド例です。各エンドポイントに対して、正常系と異常系のテストケースをカバーします。

---

### 1. **ユーザー登録 API (`/api/register`)**

#### 正常系

```bash
curl -X POST http://localhost:8787/api/register \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "password": "password123"}'
```

- **期待結果**: ステータスコード `201`、レスポンスにユーザー ID、名前、メールアドレスを含む。

#### 異常系（メールアドレス重複）

```bash
curl -X POST http://localhost:8787/api/register \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "password": "password123"}'
```

- **期待結果**: ステータスコード `409`、エラーメッセージ `"このメールアドレスは既に使用されています"`。

#### 異常系（パスワードが短い）

```bash
curl -X POST http://localhost:8787/api/register \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "password": "123"}'
```

- **期待結果**: ステータスコード `400`、エラーメッセージ `"入力内容に誤りがあります"`。

---

### 2. **ログイン API (`/api/login`)**

#### 正常系

```bash
curl -X POST http://localhost:8787/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "password123"}'
```

- **期待結果**: ステータスコード `200`、レスポンスに JWT トークンとユーザー情報を含む。

#### 異常系（メールアドレスが存在しない）

```bash
curl -X POST http://localhost:8787/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "unknown@example.com", "password": "password123"}'
```

- **期待結果**: ステータスコード `401`、エラーメッセージ `"メールアドレスまたはパスワードが正しくありません"`。

#### 異常系（パスワードが間違っている）

```bash
curl -X POST http://localhost:8787/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "wrongpassword"}'
```

- **期待結果**: ステータスコード `401`、エラーメッセージ `"メールアドレスまたはパスワードが正しくありません"`。

---

### 3. **ログアウト API (`/api/logout`)**

#### 正常系

```bash
curl -X POST http://localhost:8787/api/logout \
  -H "Authorization: Bearer <valid-token>"
```

- **期待結果**: ステータスコード `200`、レスポンスに `{ "success": true }`。

#### 異常系（トークンが無効）

```bash
curl -X POST http://localhost:8787/api/logout \
  -H "Authorization: Bearer <invalid-token>"
```

- **期待結果**: ステータスコード `401`、エラーメッセージ `"認証に失敗しました"`。

---

### 4. **ユーザー情報取得 API (`/api/users/me`)**

#### 正常系

```bash
curl -X GET http://localhost:8787/api/users/me \
  -H "Authorization: Bearer <valid-token>"
```

- **期待結果**: ステータスコード `200`、レスポンスにユーザー ID、名前、メールアドレスを含む。

#### 異常系（トークンが無効）

```bash
curl -X GET http://localhost:8787/api/users/me \
  -H "Authorization: Bearer <invalid-token>"
```

- **期待結果**: ステータスコード `401`、エラーメッセージ `"認証が必要です"`。

#### 異常系（トークンが未提供）

```bash
curl -X GET http://localhost:8787/api/users/me
```

- **期待結果**: ステータスコード `401`、エラーメッセージ `"認証が必要です"`。

---

### 5. **JWT ミドルウェアのテスト**

#### 正常系

```bash
curl -X GET http://localhost:8787/api/users/me \
  -H "Authorization: Bearer <valid-token>"
```

- **期待結果**: ステータスコード `200`、レスポンスにユーザー情報を含む。

#### 異常系（トークンが無効）

```bash
curl -X GET http://localhost:8787/api/users/me \
  -H "Authorization: Bearer <invalid-token>"
```

- **期待結果**: ステータスコード `401`、エラーメッセージ `"認証に失敗しました"`。

#### 異常系（トークンの有効期限が切れている）

```bash
curl -X GET http://localhost:8787/api/users/me \
  -H "Authorization: Bearer <expired-token>"
```

- **期待結果**: ステータスコード `401`、エラーメッセージ `"認証に失敗しました"`。

---

### 6. **パスワードハッシュ関数のテスト**

#### 正常系

```bash
curl -X POST http://localhost:8787/api/register \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "password": "password123"}'
```

- **期待結果**: ステータスコード `201`、レスポンスにユーザー ID、名前、メールアドレスを含む。

#### 異常系（無効なハッシュ形式）

```bash
curl -X POST http://localhost:8787/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "wrongpassword"}'
```

- **期待結果**: ステータスコード `401`、エラーメッセージ `"メールアドレスまたはパスワードが正しくありません"`。

---

### 7. **ヘルスチェック API (`/health`)**

#### 正常系

```bash
curl -X GET http://localhost:8787/health
```

- **期待結果**: ステータスコード `200`、レスポンスに `{ "status": "healthy", "environment": "development" }`。

---

### 8. **CORS 設定のテスト**

#### 正常系（OPTIONS リクエスト）

```bash
curl -X OPTIONS http://localhost:8787/api/register \
  -H "Origin: http://example.com"
```

- **期待結果**: ステータスコード `204`、適切な CORS ヘッダーが含まれる。

---

### 9. **エラーハンドリングのテスト**

#### 異常系（不正な JSON 形式）

```bash
curl -X POST http://localhost:8787/api/register \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "password": "password123"'
```

- **期待結果**: ステータスコード `400`、エラーメッセージ `"Internal Server Error"`。

---

### 10. **セキュリティテスト**

#### 異常系（SQL インジェクション）

```bash
curl -X POST http://localhost:8787/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "\' OR 1=1 --"}'
```

- **期待結果**: ステータスコード `401`、エラーメッセージ `"メールアドレスまたはパスワードが正しくありません"`。

---

これらの cURL コマンドを使用して、API の動作を確認し、期待通りに動作していることを確認してください。

これで、認証機能のバックエンド API が完成しました。フロントエンドのページと連携して、ユーザー登録、ログイン、ログアウト、ユーザー情報取得の機能が動作するようになります。
