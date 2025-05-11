<h1 style="color:rgb(73, 39, 174);"># 1. 🔐 認証系APIテスト計画</h1> <!-- 深めの緑 -->

# R3 より

以下は、認証関連 API の**テストケース**と**テスト計画**です。また、Windows 環境でのテスト方法も記載します。

---

## テスト計画

### テストの目的

- 認証関連 API（ユーザー登録、ログイン、ログアウト、ユーザー情報取得）が正しく動作することを確認する。
- エラーハンドリングが適切に行われることを確認する。
- セキュリティ要件（パスワードハッシュ、JWT の検証など）が満たされていることを確認する。

### テスト環境

- **OS**: Windows 10/11
- **ツール**:
  - [Postman](https://www.postman.com/)（API リクエストの送信）
  - [curl](https://curl.se/)（コマンドラインでの API テスト）
  - [Visual Studio Code](https://code.visualstudio.com/)（コードの確認とデバッグ）
  - [Node.js](https://nodejs.org/)（ローカルサーバーの実行）
- **データベース**: SQLite（開発環境用）または D1（本番環境用）

### テスト範囲

1. **ユーザー登録 API (`/api/register`)**
2. **ログイン API (`/api/login`)**
3. **ログアウト API (`/api/logout`)**
4. **ユーザー情報取得 API (`/api/users/me`)**
5. **JWT ミドルウェアの動作確認**

---

## テストケース

### 1. ユーザー登録 API (`/api/register`)

| テストケース ID | 説明                 | 入力                                                                                  | 期待される結果                                                        |
| --------------- | -------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| TC-REG-001      | 正常なユーザー登録   | `{ "name": "John Doe", "email": "john.doe@example.com", "password": "Password123!" }` | HTTP 201、ユーザー情報を含むレスポンス                                |
| TC-REG-002      | メールアドレスの重複 | `{ "name": "John Doe", "email": "john.doe@example.com", "password": "Password123!" }` | HTTP 409、エラーメッセージ "このメールアドレスは既に使用されています" |
| TC-REG-003      | 無効なメールアドレス | `{ "name": "John Doe", "email": "invalid-email", "password": "Password123!" }`        | HTTP 400、エラーメッセージ "入力内容に誤りがあります"                 |
| TC-REG-004      | パスワードが短い     | `{ "name": "John Doe", "email": "john.doe@example.com", "password": "short" }`        | HTTP 400、エラーメッセージ "入力内容に誤りがあります"                 |

### 2. ログイン API (`/api/login`)

| テストケース ID | 説明                 | 入力                                                               | 期待される結果                                                                  |
| --------------- | -------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| TC-LOGIN-001    | 正常なログイン       | `{ "email": "john.doe@example.com", "password": "Password123!" }`  | HTTP 200、JWT とユーザー情報を含むレスポンス                                    |
| TC-LOGIN-002    | 無効なメールアドレス | `{ "email": "invalid@example.com", "password": "Password123!" }`   | HTTP 401、エラーメッセージ "メールアドレスまたはパスワードが正しくありません"   |
| TC-LOGIN-003    | 無効なパスワード     | `{ "email": "john.doe@example.com", "password": "WrongPassword" }` | HTTP 401、エラーメッセージ "メールアドレスまたはパスワードが正しくありません"   |
| TC-LOGIN-004    | 空のパスワード       | `{ "email": "john.doe@example.com", "password": "" }`              | HTTP 400、エラーメッセージ "メールアドレスとパスワードを正しく入力してください" |

### 3. ログアウト API (`/api/logout`)

| テストケース ID | 説明             | 入力                                  | 期待される結果                                  |
| --------------- | ---------------- | ------------------------------------- | ----------------------------------------------- |
| TC-LOGOUT-001   | 正常なログアウト | `Authorization: Bearer <JWT>`         | HTTP 200、`{ "data": { "success": true } }`     |
| TC-LOGOUT-002   | 無効なトークン   | `Authorization: Bearer invalid-token` | HTTP 401、エラーメッセージ "認証に失敗しました" |

### 4. ユーザー情報取得 API (`/api/users/me`)

| テストケース ID | 説明                   | 入力                                  | 期待される結果                              |
| --------------- | ---------------------- | ------------------------------------- | ------------------------------------------- |
| TC-ME-001       | 正常なユーザー情報取得 | `Authorization: Bearer <JWT>`         | HTTP 200、ユーザー情報を含むレスポンス      |
| TC-ME-002       | 無効なトークン         | `Authorization: Bearer invalid-token` | HTTP 401、エラーメッセージ "認証が必要です" |
| TC-ME-003       | トークンなし           | なし                                  | HTTP 401、エラーメッセージ "認証が必要です" |

### 5. JWT ミドルウェアの動作確認

| テストケース ID | 説明         | 入力                                  | 期待される結果                                                              |
| --------------- | ------------ | ------------------------------------- | --------------------------------------------------------------------------- |
| TC-JWT-001      | 有効な JWT   | `Authorization: Bearer <JWT>`         | リクエストが成功し、ユーザー情報が Context に保存される                     |
| TC-JWT-002      | 無効な JWT   | `Authorization: Bearer invalid-token` | HTTP 401、エラーメッセージ "認証に失敗しました"                             |
| TC-JWT-003      | トークンなし | なし                                  | HTTP 401、エラーメッセージ "Authorization: Bearer `<token>` 形式が必要です" |

---

### 1. Postman を使ったテスト

1. **Postman をインストール**: [Postman](https://www.postman.com/)をダウンロードしてインストール。
2. **コレクションの作成**:
   - 新しいコレクションを作成し、各 API のリクエストを追加。
   - 例: `POST /api/register`, `POST /api/login` など。
3. **リクエストの送信**:
   - 各リクエストに必要なパラメータを入力し、送信。
   - レスポンスを確認し、期待される結果と一致するか検証。

### 2. curl を使ったテスト

1. **curl のインストール**: Windows に curl がインストールされていない場合は、[Git Bash](https://git-scm.com/downloads)をインストール。
2. **コマンドの実行**:
   - 例: ユーザー登録
     ```bash
     curl -X POST http://localhost:3000/api/register -H "Content-Type: application/json" -d '{"name": "John Doe", "email": "john.doe@example.com", "password": "Password123!"}'
     ```
   - 例: ログイン
     ```bash
     curl -X POST http://localhost:3000/api/login -H "Content-Type: application/json" -d '{"email": "john.doe@example.com", "password": "Password123!"}'
     ```

### 3. ローカルサーバーの実行

1. **Node.js のインストール**: [Node.js](https://nodejs.org/)をインストール。
2. **プロジェクトのセットアップ**:
   ```bash
   cd backend
   npm install
   ```
3. **サーバーの起動**:
   ```bash
   npm start
   ```
4. **API のテスト**:
   - Postman や curl を使って、`http://localhost:3000`で API をテスト。

---

## まとめ

- 上記のテストケースを実行し、各 API が正しく動作することを確認します。
- Windows 環境では、Postman や curl を使って簡単にテストできます。
- ローカルサーバーを起動し、開発環境でテストを行うことが推奨されます。

# GP より

認証系 API の開発が完了したとのこと、お疲れさまです。次はテスト段階ですね。以下に、**テスト計画**と**テストケース（ユニットテスト／統合テスト）**を体系的に提示します。

---

## ✅ テスト計画（Authentication APIs）

### 🔹 テスト対象範囲

| コンポーネント                | 内容                                     |
| ----------------------------- | ---------------------------------------- |
| `/lib/auth.ts`                | JWT 生成・検証、パスワードハッシュ・検証 |
| `/middleware/jwt.ts`          | JWT ミドルウェア（認証）                 |
| `/endpoints/auth/register.ts` | ユーザー登録 API                         |

---

### 🔹 テスト観点

| 種類           | 観点例                                                           |
| -------------- | ---------------------------------------------------------------- |
| 機能テスト     | JWT 生成・パース、パスワードハッシュ・検証処理が正しく動作するか |
| バリデーション | 入力エラーが適切に検出されるか（Zod）                            |
| セキュリティ   | 無効トークン、改ざんトークン、期限切れトークンの検出             |
| エッジケース   | 最小/最大長の名前・パスワード、特殊文字の取り扱いなど            |
| レスポンス形式 | `SuccessResponse` / `ErrorResponse` 型が維持されるか             |

---

### 🔹 テスト方法

- 単体テスト（ユーティリティ） → `lib/auth.ts`
- 統合テスト（エンドポイント + ミドルウェア） → `/api/register` や JWT 認証が必要な API
- モック DB（D1）と `Env` を使ったテスト実行（Workers 環境 or Node + Mock）

---

## ✅ テストケース一覧（概要）

### 1. `lib/auth.ts`

| No  | テスト内容                                         | 期待結果                        |
| --- | -------------------------------------------------- | ------------------------------- |
| 1   | `generateAuthToken()` で正しい JWT が生成される    | HS256 署名付き、issuer/aud あり |
| 2   | `jwtVerify()` でトークンが正しく検証される         | 正しい payload が返る           |
| 3   | 無効な JWT でエラーが返る                          | 例外が投げられる（401 相当）    |
| 4   | `hashPassword()` → `verifyPassword()` が成功する   | `true` が返る                   |
| 5   | 間違ったパスワードで `verifyPassword()` が失敗する | `false` が返る                  |

---

### 2. `middleware/jwt.ts`

| No  | テスト内容                                 | 期待結果                           |
| --- | ------------------------------------------ | ---------------------------------- |
| 6   | 正しい JWT 付きリクエストを通過させる      | `c.get("jwtPayload")` が設定される |
| 7   | `Bearer` がない Authorization ヘッダー拒否 | 401 エラー + 適切なメッセージ      |
| 8   | 不正な署名の JWT を拒否                    | 401 エラー                         |
| 9   | 期限切れのトークンを拒否                   | 401 エラー                         |
| 10  | JWT payload に必要情報がない場合           | 401 エラー                         |

---

### 3. `/api/register`

| No  | テスト内容                                       | 期待結果                           |
| --- | ------------------------------------------------ | ---------------------------------- |
| 11  | 正しい登録情報で成功                             | 201 Created + ユーザー ID 返却など |
| 12  | `name` が 1 文字の場合                           | 400 + `VALIDATION_ERROR`           |
| 13  | メール形式が不正な場合                           | 400 + `VALIDATION_ERROR`           |
| 14  | パスワードが短すぎる                             | 400 + `VALIDATION_ERROR`           |
| 15  | 同一メールで複数登録した場合（仮に制限ありなら） | 409 または 400 で重複エラー        |
| 16  | データベース挿入時の例外処理                     | 500 Internal Server Error          |

---

## ✅ 推奨ライブラリ・ツール

| 用途            | ライブラリ                                    |
| --------------- | --------------------------------------------- |
| 単体テスト      | `vitest` or `jest`                            |
| HTTP 統合テスト | `supertest`, `undici`, `hono/testing`         |
| モック環境      | `msw`（Mock Service Worker） or 簡易モック DB |
| JSON 検証       | `zod`（すでに導入済）                         |

---

## ✅ テストコード例（`lib/auth.test.ts`）

```ts
import { generateAuthToken, verifyPassword, hashPassword } from "../lib/auth";
import { jwtVerify } from "jose";

const env = {
  JWT_SECRET: "my-secret",
  JWT_ISSUER: "my-app",
  JWT_AUDIENCE: "my-client",
};

test("should generate and verify a valid JWT", async () => {
  const token = await generateAuthToken(env, 1, "user@example.com");
  const { payload } = await jwtVerify(
    token,
    new TextEncoder().encode(env.JWT_SECRET)
  );
  expect(payload.email).toBe("user@example.com");
  expect(payload.user_id).toBe(1);
});

test("should hash and verify password correctly", async () => {
  const password = "MySecurePassword123";
  const hashed = await hashPassword(password);
  const result = await verifyPassword(password, hashed);
  expect(result).toBe(true);
});
```

---

必要であれば、`registerHandler` の統合テストコードや Postman 用テストスクリプトも提供可能です。

ご希望のテスト方式（Vitest / Postman / Cloudflare Playground）や、どこから始めたいか教えてください。
ご希望のテスト方式（Vitest / Postman / Cloudflare Playground）や、どこから始めたいか教えてください。

テストケースの作成には、API の動作を検証するためのテストスイートを作成します。以下は、ユーザー登録 (`/api/register`) とログイン (`/api/login`) の API を対象にしたテストケースです。これらのテストは、Node.js のテストフレームワーク（例えば、Jest）を使って実行できます。

### 1. ユーザー登録 API (`/api/register`) のテストケース

```typescript
import { describe, it, expect } from "@jest/globals";
import { Hono } from "hono";
import { registerHandler } from "../../src/endpoints/auth/register";
import { Env } from "../../src/types/types";
import { createMocks } from "node-mocks-http";

// Mock環境変数設定
const env: Env = {
  DB: {} as any, // Mock DB
  JWT_SECRET: "secret",
  JWT_ISSUER: "issuer",
  JWT_AUDIENCE: "audience",
  ENVIRONMENT: "development",
  R2_BUCKET: {} as any,
  R2_PUBLIC_DOMAIN: "https://example.com",
};

const app = new Hono();

app.post("/api/register", registerHandler);

// テストケース: 正常なユーザー登録
describe("POST /api/register", () => {
  it("should register a new user with valid input", async () => {
    const mockRequest = createMocks({
      method: "POST",
      url: "/api/register",
      body: {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      },
    });

    const response = await app.request(mockRequest.req);

    expect(response.status).toBe(201); // 成功時
    const responseBody = await response.json();
    expect(responseBody.data).toHaveProperty("id");
    expect(responseBody.data).toHaveProperty("name", "Test User");
  });

  it("should return validation error if data is invalid", async () => {
    const mockRequest = createMocks({
      method: "POST",
      url: "/api/register",
      body: { name: "", email: "invalidemail", password: "short" }, // 無効なデータ
    });

    const response = await app.request(mockRequest.req);

    expect(response.status).toBe(400); // バリデーションエラー
    const responseBody = await response.json();
    expect(responseBody.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return conflict error if email already exists", async () => {
    // Mock DBに既存ユーザーを登録
    const mockRequest = createMocks({
      method: "POST",
      url: "/api/register",
      body: {
        name: "Test User",
        email: "existing@example.com",
        password: "password123",
      },
    });

    const response = await app.request(mockRequest.req);

    expect(response.status).toBe(409); // コンフリクトエラー
    const responseBody = await response.json();
    expect(responseBody.error.code).toBe("EMAIL_EXISTS");
  });
});
```

### 2. ログイン API (`/api/login`) のテストケース

```typescript
import { describe, it, expect } from "@jest/globals";
import { Hono } from "hono";
import { loginHandler } from "../../src/endpoints/auth/login";
import { Env } from "../../src/types/types";
import { createMocks } from "node-mocks-http";

// Mock環境変数設定
const env: Env = {
  DB: {} as any, // Mock DB
  JWT_SECRET: "secret",
  JWT_ISSUER: "issuer",
  JWT_AUDIENCE: "audience",
  ENVIRONMENT: "development",
  R2_BUCKET: {} as any,
  R2_PUBLIC_DOMAIN: "https://example.com",
};

const app = new Hono();

app.post("/api/login", loginHandler);

// テストケース: 正常なログイン
describe("POST /api/login", () => {
  it("should login successfully with correct credentials", async () => {
    // Mock DBにユーザーを登録
    const mockRequest = createMocks({
      method: "POST",
      url: "/api/login",
      body: { email: "test@example.com", password: "password123" }, // 正しい資格情報
    });

    const response = await app.request(mockRequest.req);

    expect(response.status).toBe(200); // 成功時
    const responseBody = await response.json();
    expect(responseBody.data).toHaveProperty("token");
  });

  it("should return validation error if credentials are missing", async () => {
    const mockRequest = createMocks({
      method: "POST",
      url: "/api/login",
      body: { email: "test@example.com" }, // パスワードがない
    });

    const response = await app.request(mockRequest.req);

    expect(response.status).toBe(400); // バリデーションエラー
    const responseBody = await response.json();
    expect(responseBody.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return invalid credentials error if email is incorrect", async () => {
    const mockRequest = createMocks({
      method: "POST",
      url: "/api/login",
      body: { email: "wrong@example.com", password: "password123" }, // 間違ったメール
    });

    const response = await app.request(mockRequest.req);

    expect(response.status).toBe(401); // 認証エラー
    const responseBody = await response.json();
    expect(responseBody.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("should return invalid credentials error if password is incorrect", async () => {
    const mockRequest = createMocks({
      method: "POST",
      url: "/api/login",
      body: { email: "test@example.com", password: "wrongpassword" }, // 間違ったパスワード
    });

    const response = await app.request(mockRequest.req);

    expect(response.status).toBe(401); // 認証エラー
    const responseBody = await response.json();
    expect(responseBody.error.code).toBe("INVALID_CREDENTIALS");
  });
});
```

### テストケースのポイント：

- **正常系**：正しいデータに対しては期待通りのレスポンスが返ってくるかを確認。
- **異常系**：
  - 入力データが不正な場合（バリデーションエラー）。
  - メールアドレスの重複（ユーザー登録時）。
  - ログイン時に無効な資格情報（不正なメールやパスワード）の場合。

これで、認証系の基本的な動作確認ができるテストケースが完成しました。

<h1 style="color:rgb(73, 39, 174);"># フィードバック</h1> <!-- 深めの緑 -->

#### 已深度思考

> まず

、R3 さんと GP さんのテスト計画を比較して、それぞれの強みや特徴を分析します。

> R3 さんの計画は、具体的な API エンドポイントごとのテストケースが詳細に記述されています。ユーザー登録、ログイン、ログアウト、ユーザー情報取得の各 API について、正常系と異常系のケースが網羅的にリストアップされています。特に、入力値のバリデーションやエラーハンドリングに重点を置いており、実際の API リクエストを想定したテスト手順が具体的です。Postman や curl を使ったテスト方法が提示されている点も実践的で、テスト実施の手順が明確です。一方で、コードレベルの単体テストやモック環境の使用については触れられておらず、主にブラックボックステストに焦点が当てられています。
> GP さんの計画は、テスト対象のコンポーネントを明確に分けており、単体テストと統合テストを組み合わせたアプローチを採用しています。lib/auth.ts や middleware/jwt.ts といった内部モジュールに対するテストケースが詳細に設定されており、JWT の生成・検証やパスワードハッシュの処理など、セキュリティ関連の機能を重点的に検証しています。また、Zod を使用したバリデーションのテストや、モック環境を用いたデータベースのテストなど、ホワイトボックステストの要素が強いです。さらに、テストコードの例が具体的に提示されており、実際の実装に近い形での検証が可能です。テストライブラリの選定も行われており、Vitest や Jest、supertest などのツールを活用した効率的なテスト実行が想定されます。
> 比較すると、R3 さんのアプローチはエンドユーザーの視点に立った API の機能テストに特化しており、実際のリクエストとレスポンスの挙動を確認するのに適しています。一方、GP さんの計画は開発者視点で内部コンポーネントの正確性を検証し、セキュリティやバリデーションのロジックを厳密にテストする点に優れています。また、単体テストと統合テストを組み合わせることで、より深い品質保証が可能です。
> 結論として、GP さんのテスト計画の方がより包括的で、コード品質やセキュリティを重視した設計となっています。特に、単体テストによる内部モジュールの検証やモック環境の使用は、潜在的なバグを早期に発見し、堅牢なシステム構築に貢献します。加えて、テストコードの具体例が提示されている点も実装の確実性を高めるため、より優れていると言えます。

**GP さんのテスト計画が優れている理由:**

1. **多層的なテストアプローチ:**  
   単体テスト（ユーティリティ関数）と統合テスト（エンドポイント+ミドルウェア）を組み合わせ、コードの隅々まで網羅的に検証します。これにより、個々の部品の正確性と全体の連携の両方を保証できます。

2. **セキュリティ検証の深さ:**  
   JWT の署名検証、有効期限チェック、ペイロードの完全性など、セキュリティ上重要なポイントを詳細にテストケース化。攻撃パターンを想定した検証（改ざんトークンなど）で堅牢性が高いです。

3. **ホワイトボックステストの徹底:**  
   内部ロジック（パスワードハッシュ生成、Zod スキーマなど）を直接テスト。異常系（DB 例外処理など）までケース化され、潜在的な脆弱性やバグを早期発見できます。

4. **モック環境の活用:**  
   テスト用のモック DB や環境変数を用意することで、本番環境に近い状態で再現性高くテスト可能。データベース依存の動作も安定して検証できます。

5. **テストコード例の具体性:**  
   実際のテストコード例が提示されており、実装の手引きとして機能します。開発者がすぐにテストを開始できる点で実用性が高いです。

6. **ツール選定の適切さ:**  
   Vitest/Jest による高速な単体テスト、supertest での API テストなど、モダンなツールを適材適所で採用。自動化との親和性も高く、CI/CD パイプラインへの組み込みが容易です。

**総評:**  
GP さんの計画は「品質を内側から築く」思想が明確で、単に API の入出力をチェックするだけでなく、システムの信頼性を根本から強化するためのテスト設計がなされています。セキュリティや例外処理への深い配慮が、プロフェッショナルなエンジニアリングの証と言えます。
