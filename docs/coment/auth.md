# 認証関連ユーティリティ

以下は、認証関連ユーティリティファイル (`auth.ts`) の実装流れについての詳細な説明です。このファイルは、JWT トークンの生成、パスワードのハッシュ化、パスワードの検証などの認証関連の機能を提供します。

---

### **認証関連ユーティリティの実装流れ**

```ts
// backend/src/lib/auth.ts
import { SignJWT, jwtVerify } from "jose";
import { Env, JwtPayload } from "../types/types";

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

#### 1. **JWT トークンの生成**

- `generateAuthToken` 関数は、ユーザー ID とメールアドレスを含む JWT トークンを生成します。

  ```typescript
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
  ```

  - **引数**:

    - `env`: 環境変数（`JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE` を含む）。
    - `userId`: ユーザー ID。
    - `email`: ユーザーのメールアドレス。
    - `expiresIn`: トークンの有効期限（デフォルトは 2 時間）。

  - **処理**:
    - `SignJWT` を使用して JWT トークンを生成します。
    - トークンには、ユーザー ID、メールアドレス、発行者、対象者、有効期限が含まれます。
    - トークンは `HS256` アルゴリズムで署名されます。

#### 2. **パスワードのハッシュ化**

- `hashPassword` 関数は、PBKDF2 アルゴリズムを使用してパスワードをハッシュ化します。

  ```typescript
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
  ```

  - **引数**:

    - `password`: ハッシュ化するパスワード。

  - **処理**:
    - ランダムなソルトを生成します。
    - PBKDF2 アルゴリズムを使用してパスワードをハッシュ化します。
    - ソルト、ハッシュ、イテレーション回数、ハッシュアルゴリズムを組み合わせて文字列として返します。

#### 3. **パスワードの検証**

- `verifyPassword` 関数は、入力されたパスワードとハッシュ化されたパスワードを比較します。

  ```typescript
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

  - **引数**:

    - `password`: 検証するパスワード。
    - `hashedPassword`: ハッシュ化されたパスワード。

  - **処理**:
    - ハッシュ化されたパスワードからソルト、ハッシュ、イテレーション回数、ハッシュアルゴリズムを抽出します。
    - 入力されたパスワードを同じアルゴリズムでハッシュ化します。
    - ハッシュ化されたパスワードと保存されているハッシュを比較し、一致するかどうかを返します。

---

### **動作の流れ**

1. **JWT トークンの生成**:

   - ユーザー ID とメールアドレスを含む JWT トークンを生成します。
   - トークンは認証済みユーザーの識別に使用されます。

2. **パスワードのハッシュ化**:

   - ユーザーが登録またはパスワードを変更する際に、パスワードをハッシュ化してデータベースに保存します。

3. **パスワードの検証**:
   - ユーザーがログインする際に、入力されたパスワードとデータベースに保存されているハッシュを比較します。

---

### **レスポンス例**

#### JWT トークンの生成

```typescript
const token = await generateAuthToken(env, 1, "test@example.com");
console.log(token); // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### パスワードのハッシュ化

```typescript
const hashedPassword = await hashPassword("password123");
console.log(hashedPassword); // "salt:hash:100000:SHA-256"
```

#### パスワードの検証

```typescript
const isValid = await verifyPassword("password123", hashedPassword);
console.log(isValid); // true
```

---

### **テスト方法**

1. **JWT トークンの生成**:

   - `generateAuthToken` 関数を呼び出し、正しい形式のトークンが生成されるか確認します。

2. **パスワードのハッシュ化**:

   - `hashPassword` 関数を呼び出し、パスワードが正しくハッシュ化されるか確認します。

3. **パスワードの検証**:
   - `verifyPassword` 関数を呼び出し、正しいパスワードとハッシュが一致するか確認します。
   - 無効なパスワードを入力して、検証が失敗するか確認します。

---

### **補足**

- **セキュリティ**:

  - JWT トークンは `HS256` アルゴリズムで署名され、秘密鍵 (`JWT_SECRET`) を使用して保護されます。
  - パスワードは PBKDF2 アルゴリズムでハッシュ化され、ソルトとイテレーション回数を使用して強力なセキュリティを提供します。

- **柔軟性**:
  - `generateAuthToken` 関数は、有効期限を柔軟に設定できます。
  - `hashPassword` 関数は、イテレーション回数やハッシュアルゴリズムを変更できます。

---

これで、認証関連ユーティリティファイルの実装流れ、動作の流れ、レスポンス例、テスト方法についての説明が完了しました。
