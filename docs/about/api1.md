Next.js と Cloudflare Workers/D1 を使用した認証 API の実装を以下に示します。まず、必要なエンドポイントを実装する前に、認証関連のユーティリティ関数を準備します。

## 1. 認証関連ユーティリティファイルの作成

`backend/src/lib/auth.ts` に認証関連の関数をまとめます：

```typescript
import { SignJWT, jwtVerify } from "jose";
import { Env, JwtPayload } from "../types/types";

// トークン生成関数
export async function generateAuthToken(
  env: Env,
  userId: number,
  email: string,
  expiresIn = "30d"
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

// パスワードハッシュ関数
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// パスワード検証関数
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  const newHash = await hashPassword(password);
  return newHash === hashedPassword;
}
```

## 2. ユーザー登録 API (`/api/register`)

[実装説明](/coment/001)

`backend/src/endpoints/auth/register.ts`:

```typescript
import { Context } from "hono";
import { Bindings, ErrorResponse, SuccessResponse } from "../../types/types";
import { hashPassword } from "../../lib/auth";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
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

## 3. ログイン API (`/api/login`)

[実装説明](/coment/002)

`backend/src/endpoints/auth/login.ts`:

```typescript
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

    // トークン生成
    const token = await generateAuthToken(c.env, user.id, user.email);

    // セッション作成
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30日間有効

    await c.env.DB.prepare(
      "INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)"
    )
      .bind(user.id, sessionToken, expiresAt.toISOString())
      .run();

    return c.json(
      {
        data: {
          token,
          sessionToken,
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

## 4. ログアウト API (`/api/logout`)

[実装説明](/coment/004)

`backend/src/endpoints/auth/logout.ts`:

```typescript
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

## 5. ユーザー情報取得 API (`/api/users/me`)

[実装説明](/coment/003)

`backend/src/endpoints/auth/getUser.ts`:

```typescript
import { Context } from "hono";
import { Bindings, ErrorResponse, SuccessResponse } from "../../types/types";

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

## 6. ルートに認証 API を追加

[実装説明](/coment/routes)

`backend/src/routes/index.ts` を更新して、認証関連のルートを追加します：

```typescript
import { registerHandler } from "endpoints/auth/register";
import { loginHandler } from "endpoints/auth/login";
import { logoutHandler } from "endpoints/auth/logout";
import { getUserHandler } from "endpoints/auth/getUser";

// ... 既存のインポート ...

// =====================
// Auth Routes
// =====================
app
  .post("/api/register", registerHandler)
  .post("/api/login", loginHandler)
  .post("/api/logout", logoutHandler)
  .get("/api/users/me", jwtMiddleware, getUserHandler);

// ... 既存のルート定義 ...
```

### 7. 環境変数の設定

`wrangler.toml` に以下の環境変数を追加してください：

```toml
[vars]
JWT_SECRET = "your-very-secret-key" # 推測困難な長い文字列に変更
JWT_ISSUER = "your-app-name"
JWT_AUDIENCE = "your-app-audience"
ENVIRONMENT = "development" # productionでは"production"に変更
```

### 動作確認方法

1. ユーザー登録

```bash
curl -X POST http://localhost:8787/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

2. ログイン

```bash
curl -X POST http://localhost:8787/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

3. ユーザー情報取得

```bash
curl -X GET http://localhost:8787/api/users/me \
  -H "Authorization: Bearer [ログイン時に取得したトークン]"
```

4. ログアウト

```bash
curl -X POST http://localhost:8787/api/logout \
  -H "Authorization: Bearer [ログイン時に取得したトークン]"
```

これで、認証機能のバックエンド API が完成しました。フロントエンドのページと連携して、ユーザー登録、ログイン、ログアウト、ユーザー情報取得の機能が動作するようになります。

<h1 style="color:rgb(6, 110, 49);">フィードバック</h1> <!-- 深めの緑 -->

# R1

#### 已深度思考

> では

、認証系 API のコードを確認していきます。まず、全体の構成を見ると、ユーザー登録、ログイン、ログアウト、ユーザー情報取得のエンドポイントが実装されています。各エンドポイントではバリデーションやエラーハンドリングが行われており、セキュリティ面でもハッシュ化や JWT の使用が考慮されています。しかし、いくつか改善点や確認すべきポイントがあるようです。

> まず、auth.ts のパスワードハッシュ関数を見ます。現在は SHA-256 を使っていますが、ソルトが追加されていません。これではレインボーテーブル攻撃に脆弱です。ソルトを生成し、ハッシュ化に組み込む必要があります。また、専用のパスワードハッシュ関数である bcrypt や Argon2 の使用を検討すべきでしょう。ただし、Cloudflare Workers の環境でこれらが利用可能か確認が必要です。
> 次に、ユーザー登録 API では、メールアドレスの重複チェックを行っていますが、データベースの一意制約を設定していない場合、競合状態が発生する可能性があります。データベーススキーマに UNIQUE 制約を追加し、一貫性を保つことが重要です。また、エラーレスポンスで詳細な情報を返す際に、セキュリティリスクがないか確認します。例えば、存在するメールアドレスかどうかを具体的に伝えると、悪用される可能性がありますが、現在の実装では適切に処理されています。
> ログイン API では、ユーザーが存在しない場合とパスワードが間違っている場合に同じエラーメッセージを返しています。これはセキュリティ上好ましいですが、実際のレスポンスが適切か確認します。また、セッション管理ではセッショントークンを UUID で生成し、データベースに保存しています。トークンのランダム性は十分ですが、セッションの有効期限を 30 日に設定している点は、セキュリティポリシーに照らして適切か検討が必要かもしれません。
> ログアウト API では、Authorization ヘッダーからセッショントークンを取得して削除しますが、トークンが存在しない場合でも成功レスポンスを返しています。これは意図的であり、ユーザーにエラーを意識させないためかもしれませんが、仕様として問題ないか確認します。
> ユーザー情報取得 API では、JWT のペイロードからユーザー ID を取得し、データベースから情報を取得します。ユーザーが存在しない場合は 404 を返しますが、これは適切です。また、JWT の検証をミドルウェアで行い、Variables に保存している点は良い設計です。
> ルートの設定では、CORS の設定がグローバルミドルウェアとして実装されていますが、本番環境では Wildcard（'\*'）の代わりに具体的なオリジンを指定する必要があります。また、OPTIONS メソッドの処理が適切に行われています。
> 型定義では、JwtPayload に exp や iat が含まれていますが、jose ライブラリの検証でこれらのクレームが適切にチェックされているか確認します。また、エラーレスポンスの型が統一されており、Zod のエラーを扱えるようになっているのは良い点です。
> 全体的に見て、以下の改善点が考えられます：
>
> 1. パスワードハッシュの強化（ソルトの追加、専用ライブラリの検討）
> 2. データベースの一意制約の追加
> 3. セッションの有効期限設定の見直し
> 4. CORS のオリジン設定の厳格化
> 5. エラーメッセージの情報漏洩防止の再確認
> 6. トークンの署名アルゴリズムの確認（HS256 で問題ないか）
> 7. テストケースの作成（重複登録、不正なパスワード、トークン改ざんなど）
>    これらの点をテスト段階で検証し、必要に応じて修正を加えることが重要です。また、ログ出力に機密情報が含まれていないか確認し、本番環境では適切なログレベルを設定する必要があります。

認証系 API の実装について、以下のアドバイスと確認ポイントをご提示します:

1. **パスワードハッシュの脆弱性改善**

```typescript
// 現在の実装（改善提案）
export async function hashPassword(password: string): Promise<string> {
  // ソルト生成を追加
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const saltedPassword = encoder.encode(password + salt.toString());
  const hashBuffer = await crypto.subtle.digest("SHA-256", saltedPassword);
  return Array.from(new Uint8Array(hashBuffer), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}
```

→ ソルト生成を追加し PBKDF2 などの反復処理を実装するか、Cloudflare 環境で利用可能な代替ライブラリの検討が必要

2. **データベーススキーマの確認**

```sql
-- usersテーブルに一意制約追加
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,  -- 一意制約
  password_hash TEXT NOT NULL,
  ...
);
```

3. **セッション管理の改善点**

```typescript
// ログインAPIのセッション処理
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 30); // ← セキュリティポリシーに合わせ調整
```

4. **CORS 設定の本番環境対応**

```typescript
// 本番環境では具体的なドメインを指定
const allowedOrigins =
  c.env.ENVIRONMENT === "development"
    ? "*"
    : "https://your-production-domain.com";

c.header("Access-Control-Allow-Origin", allowedOrigins);
```

5. **JWT 検証の強化**

```typescript
// トークン検証処理に追加すべきチェック
const result = await jwtVerify(token, secret, {
  issuer: env.JWT_ISSUER,
  audience: env.JWT_AUDIENCE,
  requireExp: true, // 有効期限必須
  requireIat: true, // 発行時刻必須
});
```

6. **テストケースの例**

```text
必須テスト項目:
- 同一メールアドレスでの重複登録
- 不正パスワード形式での登録/ログイン
- 改ざんされたJWTトークンでのアクセス
- 有効期限切れトークンでのアクセス
- ログアウト後のセッショントークン無効化
- クロスサイトリクエストフォージェリ(CSRF)対策
```

7. **セキュリティヘッダーの追加提案**

```typescript
// グローバルミドルウェアに追加推奨ヘッダー
c.header(
  "Strict-Transport-Security",
  "max-age=63072000; includeSubDomains; preload"
);
c.header("X-Content-Type-Options", "nosniff");
c.header("X-Frame-Options", "DENY");
```

8. **パスワードポリシーの強化**

```typescript
// パスワードバリデーションの強化例
const passwordSchema = z
  .string()
  .min(8)
  .regex(/[A-Z]/) // 大文字必須
  .regex(/[0-9]/) // 数字必須
  .regex(/[!@#$%^&*]/); // 記号必須
```

9. **ログ出力の改善**

```typescript
// 機密情報を含まないログ出力
console.error(`Login error: ${error.message}`); // ← パスワードやトークンをログに出力しない
```

10. **レートリミットの実装検討**

```typescript
// ログイン試行回数制限の例
const MAX_ATTEMPTS = 5;
const key = `login_attempts:${email}`;
const attempts = await c.env.KV.get(key);
if (Number(attempts) >= MAX_ATTEMPTS) {
  return c.json({ error: "Too many attempts" }, 429);
}
```

**総合評価**:
基本的な認証フローは適切に実装されていますが、本番環境運用に向けて下記の改善が必要です:

1. パスワードストレージの強化（ソルト+ストレッチング）
2. データベースレイヤでの制約追加
3. セキュリティヘッダーの追加
4. 包括的なテストケースの作成
5. レートリミットの実装

テストフェーズでは特に以下を重点的に確認してください:

- エッジケース（境界値分析）
- マルチデバイス同時ログイン
- トークンリフレッシュ機能の必要性
- メールアドレス確認フローの有無

本番環境導入前に OWASP ASVS（Application Security Verification Standard）レベル 1 の要件を満たしていることを確認されることを強く推奨します。

# V3

提供されたコードは、認証システムの基本的な機能をカバーしており、ユーザー登録、ログイン、ログアウト、ユーザー情報取得などの API が実装されています。以下に、コードの確認と改善点をいくつか提案します。

### 1. パスワードハッシュの安全性

現在の`hashPassword`関数は、SHA-256 を使用してパスワードをハッシュ化していますが、これだけでは十分なセキュリティを提供しません。特に、ソルト（salt）が使用されていないため、レインボーテーブル攻撃に対して脆弱です。より安全なハッシュ化のために、`bcrypt`や`Argon2`などの専用のパスワードハッシュ関数を使用することを検討してください。

```typescript
import * as bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
```

### 2. JWT のセキュリティ

JWT の生成と検証には、`jose`ライブラリを使用していますが、JWT のセキュリティをさらに強化するために、以下の点を考慮してください。

- **JWT の有効期限**: 現在、トークンの有効期限は 2 時間に設定されていますが、セキュリティを向上させるために、リフレッシュトークンを導入し、アクセストークンの有効期限を短くすることを検討してください。
- **JWT の署名アルゴリズム**: `HS256`は安全ですが、より強力なアルゴリズム（例: `RS256`）を使用することも検討してください。

### 3. エラーハンドリング

エラーハンドリングは全体的に適切に実装されていますが、以下の点を改善することで、さらに堅牢なシステムにすることができます。

- **ログの詳細化**: エラーログにリクエストの詳細（例: リクエストボディ、ヘッダー）を含めることで、デバッグが容易になります。
- **エラーレスポンスの統一**: エラーレスポンスのフォーマットを統一し、クライアントがエラーを簡単に理解できるようにします。

### 4. セッション管理

セッション管理は、`sessionToken`を使用して実装されていますが、以下の点を考慮してください。

- **セッションの有効期限**: セッションの有効期限を短くし、定期的にセッションを更新する仕組みを導入することで、セキュリティを向上させます。
- **セッションの無効化**: ユーザーがログアウトした際に、セッションを無効化するだけでなく、セッションの有効期限を短くするなどの対策を追加します。

### 5. テストの実施

テストを実施する際には、以下の点に注意してください。

- **ユニットテスト**: 各関数（例: `hashPassword`, `generateAuthToken`）に対してユニットテストを実施し、正しく動作することを確認します。
- **統合テスト**: API エンドポイントに対して統合テストを実施し、エンドツーエンドの動作を確認します。
- **セキュリティテスト**: セキュリティ関連のテスト（例: パスワードのハッシュ化、JWT の検証）を実施し、システムの安全性を確認します。

### 6. ドキュメントとコメント

コードの可読性を向上させるために、以下の点を考慮してください。

- **関数の説明**: 各関数の目的と動作を説明するコメントを追加します。
- **API ドキュメント**: API の仕様をドキュメント化し、クライアントが API を正しく使用できるようにします。

### 7. 環境変数の管理

環境変数（例: `JWT_SECRET`, `DB`）の管理について、以下の点を考慮してください。

- **環境ごとの設定**: 開発環境、ステージング環境、本番環境ごとに異なる設定を管理する仕組みを導入します。
- **シークレット管理**: シークレット情報（例: `JWT_SECRET`）を安全に管理するために、シークレットマネージャーを使用します。

### 8. コードの再利用性

コードの再利用性を向上させるために、以下の点を考慮してください。

- **共通関数の抽出**: 複数のエンドポイントで使用される共通の処理（例: バリデーション、エラーハンドリング）を関数として抽出します。
- **ミドルウェアの活用**: 共通の処理（例: 認証、ログ）をミドルウェアとして実装し、複数のエンドポイントで再利用します。

### 9. パフォーマンスの最適化

パフォーマンスを向上させるために、以下の点を考慮してください。

- **データベースクエリの最適化**: データベースクエリのパフォーマンスを最適化し、レスポンスタイムを短縮します。
- **キャッシュの導入**: 頻繁にアクセスされるデータ（例: ユーザー情報）をキャッシュし、データベースへの負荷を軽減します。

### 10. セキュリティの強化

セキュリティを強化するために、以下の点を考慮してください。

- **CSRF 対策**: CSRF（クロスサイトリクエストフォージェリ）対策を実施し、不正なリクエストを防ぎます。
- **XSS 対策**: XSS（クロスサイトスクリプティング）対策を実施し、クライアント側でのスクリプトインジェクションを防ぎます。

これらの改善点を考慮することで、より安全で堅牢な認証システムを構築することができます。テストを実施する前に、これらの点を確認し、必要に応じて修正を行ってください。

# GT

認証系 API の実装は、全体的にとても丁寧に設計されており、基本的なセキュリティ要件やエラーハンドリングも意識されています。以下にレビューと改善点を簡潔にまとめます。

---

## ✅ 良い点（問題なし）

- **バリデーション**（`zod`）を使っており、入力の検証がしっかりしている。
- **パスワードのハッシュ化と検証**が適切に分離されている。
- **JWT の発行・検証**が `jose` ライブラリで実装されており、現代的。
- **セッション管理（DB ベース）**を組み合わせており、トークンと併用できる構成。
- **各種エラーレスポンスが一貫性のある構造**（`ErrorResponse`, `SuccessResponse`）で返されている。
- **ルート登録も分かりやすい構成**になっている。

---

## ⚠️ 改善・確認ポイント（推奨）

### 1. **JWT 検証処理の場所**

- `getUserHandler` で `jwtPayload` を `c.get("jwtPayload")` から取得しているが、`jwtMiddleware` によって正しく `c.set("jwtPayload", payload)` されているか確認してください（`middleware/jwt.ts` は本コードに含まれていないので確認対象）。

### 2. **セッションと JWT の役割重複について**

- `session_token` と `JWT` を両方返しているが、それぞれの使用目的が明確か確認しましょう（例：JWT は API 認証、session はフロント保持用など）。
- 将来的に `session_token` を Cookie に保存するなら、CSRF 対策も検討が必要です。

### 3. **ハッシュに salt を使用していない**

- `hashPassword` は SHA-256 単体なので、現状では「同じパスワード → 同じハッシュ」になり、レインボーテーブル攻撃に弱いです。
  - 簡易的には `password + env.SALT` を使う。
  - 推奨：`bcrypt` または `argon2` を使う（D1 環境で WASM 使えるなら検討可）。

### 4. **メールアドレスの重複チェックに競合の可能性**

- 同時登録が走ると 2 件目が通る可能性があります。
  - DB レベルで `UNIQUE` 制約がかかっているか確認してください。
  - 可能なら `INSERT ... ON CONFLICT` 等で対処。

### 5. **トークン失効処理**

- ログアウト時に `session_token` は削除しているが、`JWT` 自体には失効処理がない（これは普通の挙動だが、必要ならブラックリスト運用の設計も検討可能）。

---

## ✅ テストに進む前の最終チェックリスト

- [ ] `.env` に `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE` が設定されているか
- [ ] `middleware/jwt.ts` で JWT の検証処理が正しく動作しているか
- [ ] `users.email` に `UNIQUE` 制約があるか
- [ ] テスト用のユーザー削除や DB リセット機構は準備済みか（e2e テスト用）

---

準備が整っているようでしたら、次は **Postman や Playwright などで API の結合テスト** に入って問題ないと考えます。

テスト戦略やテスト用スクリプトが必要でしたらお手伝いできますが、いかがしますか？
