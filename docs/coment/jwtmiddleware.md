# ミドルウエア

以下は、ミドルウェア (`jwtMiddleware`) の実装流れについての詳細な説明です。このミドルウェアは、JWT トークンを検証し、認証済みユーザーのリクエストを処理するために使用されます。

---

### **ミドルウェアの実装流れ**

```ts
// backend/src/middleware/jwt.ts
import { SignJWT, jwtVerify } from "jose";
import { MiddlewareHandler } from "hono";
import { Env, JwtPayload } from "../types/types";
import { Buffer } from "buffer";

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

#### 1. **Authorization ヘッダーの検証**

- リクエストの `Authorization` ヘッダーが `Bearer <token>` 形式であるか確認します。
- 形式が正しくない場合、`401 Unauthorized` を返します。

  ```typescript
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
  ```

#### 2. **トークンの抽出と検証**

- `Authorization` ヘッダーからトークンを抽出し、`jwtVerify` を使用してトークンを検証します。
- トークンが無効な場合、`401 Unauthorized` を返します。

  ```typescript
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
  } catch (error) {
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
  ```

#### 3. **ペイロードの必須項目確認**

- トークンのペイロードに `user_id` と `email` が含まれているか確認します。
- 必須項目が欠けている場合、エラーをスローします。

  ```typescript
  if (
    typeof payload.user_id !== "number" ||
    typeof payload.email !== "string"
  ) {
    throw new Error("JWT payload missing required claims");
  }
  ```

#### 4. **Context にユーザー情報を保存**

- トークンのペイロードを `c.set("jwtPayload", payload)` で Context に保存します。
- これにより、後続のハンドラでユーザー情報を利用できます。

  ```typescript
  c.set("jwtPayload", {
    user_id: payload.user_id,
    email: payload.email,
    exp: payload.exp ?? Math.floor(Date.now() / 1000) + 7200,
  });
  ```

#### 5. **後続の処理を実行**

- `await next()` を呼び出し、後続のミドルウェアやハンドラを実行します。

  ```typescript
  await next();
  ```

---

### **動作の流れ**

1. **リクエストの受信**:

   - クライアントが認証が必要なエンドポイントにリクエストを送信します。

2. **Authorization ヘッダーの検証**:

   - `Authorization` ヘッダーが `Bearer <token>` 形式であるか確認します。
   - 形式が正しくない場合、`401 Unauthorized` を返します。

3. **トークンの抽出と検証**:

   - トークンを抽出し、`jwtVerify` を使用してトークンを検証します。
   - トークンが無効な場合、`401 Unauthorized` を返します。

4. **ペイロードの必須項目確認**:

   - トークンのペイロードに `user_id` と `email` が含まれているか確認します。
   - 必須項目が欠けている場合、エラーをスローします。

5. **Context にユーザー情報を保存**:

   - トークンのペイロードを Context に保存します。

6. **後続の処理を実行**:
   - 後続のミドルウェアやハンドラを実行します。

---

### **レスポンス例**

#### 成功時

- トークンが有効な場合、後続の処理が実行されます。

#### エラー時

- **Authorization ヘッダーの形式エラー**:

  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_AUTH_HEADER",
      "message": "Authorization: Bearer <token> 形式が必要です",
      "details": "Missing or malformed Authorization header"
    }
  }
  ```

- **トークンが無効な場合**:
  ```json
  {
    "success": false,
    "error": {
      "code": "AUTH_FAILURE",
      "message": "認証に失敗しました",
      "details": "Invalid token"
    }
  }
  ```

---

### **テスト方法**

1. **有効なトークンでのリクエスト**:

   - 有効な JWT トークンを含むリクエストを送信し、後続の処理が実行されるか確認します。

2. **無効なトークンでのリクエスト**:

   - 無効な JWT トークンを含むリクエストを送信し、`401 Unauthorized` が返されるか確認します。

3. **Authorization ヘッダーの形式エラー**:

   - `Authorization` ヘッダーが `Bearer <token>` 形式でないリクエストを送信し、`401 Unauthorized` が返されるか確認します。

4. **ペイロードの必須項目欠如**:
   - 必須項目 (`user_id`, `email`) が欠けているトークンを含むリクエストを送信し、`401 Unauthorized` が返されるか確認します。

---

### **補足**

- **セキュリティ**:

  - JWT トークンは `HS256` アルゴリズムで署名され、秘密鍵 (`JWT_SECRET`) を使用して保護されます。
  - トークンの有効期限や発行者、対象者を検証することで、セキュリティを強化します。

- **柔軟性**:

  - 開発環境と本番環境で異なるエラーメッセージを返すことで、デバッグとセキュリティの両方を考慮します。

- **再利用性**:
  - `jwtMiddleware` は、認証が必要な任意のエンドポイントで再利用できます。

---

これで、ミドルウェアの実装流れ、動作の流れ、レスポンス例、テスト方法についての説明が完了しました。
