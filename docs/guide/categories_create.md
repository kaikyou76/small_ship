# カテゴリ作成 API

<think>
カテゴリ作成エンドポイントの仕様を考えます。
 カテゴリ登録では、以下の情報を登録します：
   - カテゴリ名 (name): 必須
   - 親カテゴリID (parent_id): 任意（省略した場合は大分類として登録）

バリデーション：

- name: 必須、文字列、最大長 100 文字
- parent_id: 整数、存在するカテゴリ ID であること（ただし、階層は大分類・中分類のみとし、小分類の下には追加できないようにするなど、ビジネスルールに基づくバリデーションが必要な場合もあるが、ここではシンプルに）

エラーレスポンス：

- 認証エラー（管理者権限必須）
- バリデーションエラー
- 親カテゴリが存在しない場合のエラー

成功レスポンス：登録されたカテゴリ情報を返す

テーブル構造：

```sql
CREATE TABLE categories (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
parent_id INTEGER, -- null なら大分類、そうでなければ中分類・小分類
FOREIGN KEY (parent_id) REFERENCES categories(id)
);
```

実装の流れ：

1.  リクエスト受信
2.  管理者権限チェック
3.  リクエストボディから name と parent_id を取得
4.  バリデーション
5.  親カテゴリの存在チェック（parent_id が指定されている場合）
6.  データベースへの挿入
7.  成功レスポンス

注意：階層構造の深さ制限（例：大分類の下にしか中分類を作れない、など）は要件によりますが、ここでは特に制限を設けず、任意の階層を許容します。
ただし、親カテゴリが存在しない場合はエラーとします。

リクエストボディは JSON とします。
例: { "name": "食品", "parent_id": null } // 大分類
{ "name": "生鮮食品", "parent_id": 1 } // 中分類 (食品の下)

エンドポイント: POST /categories
</think>
以下は`createCategory.ts`の実装例です。商品作成ハンドラーを参考に、カテゴリ登録用のエンドポイントを作成します。

`backend/src/endpoints/categories/createCategory.ts`

```typescript:backend/src/endpoints/categories/createCategory.ts
// backend/src/endpoints/categories/createCategory.ts
import { Context } from "hono";
import { Bindings, ErrorResponse, JwtPayload } from "../types/types";

export const categoriesPostHandler = async (
  c: Context<{ Bindings: Bindings; Variables: { jwtPayload?: JwtPayload } }>
): Promise<Response> => {
  const db = c.env.DB;
  const requestId = crypto.randomUUID();

  try {
    console.log(`[${requestId}] Starting category creation process`);

    // 認証チェック (管理者権限必須)
    const payload = c.get("jwtPayload");
    console.log(`[${requestId}] Auth check - Role: ${payload?.role || "none"}`);

    if (!payload || payload.role !== "admin") {
      const errorType = !payload ? "UNAUTHORIZED" : "FORBIDDEN";
      console.warn(`[${requestId}] Auth failed - ${errorType}`);
      return c.json(
        {
          error: {
            code: errorType,
            message: !payload
              ? "認証が必要です"
              : "カテゴリ登録には管理者権限が必要です",
          },
        } satisfies ErrorResponse,
        !payload ? 401 : 403
      );
    }

    // JSONボディ取得
    console.log(`[${requestId}] Parsing request body`);
    const body = await c.req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      console.warn(`[${requestId}] Invalid request body`);
      return c.json(
        {
          error: {
            code: "INVALID_REQUEST",
            message: "リクエストボディが不正です",
          },
        } satisfies ErrorResponse,
        400
      );
    }

    const { name, parent_id } = body as {
      name?: unknown;
      parent_id?: unknown;
    };

    // 簡易バリデーション
    console.log(`[${requestId}] Validating input data`);
    const errors: Record<string, string> = {};

    if (typeof name !== "string" || !name.trim()) {
      errors.name = "カテゴリ名は必須です";
    } else if (name.length > 100) {
      errors.name = "カテゴリ名は100文字以内で入力してください";
    }

    if (parent_id !== undefined && parent_id !== null) {
      if (
        typeof parent_id !== "number" ||
        !Number.isInteger(parent_id) ||
        parent_id <= 0
      ) {
        errors.parent_id = "親カテゴリIDは正の整数で指定してください";
      }
    }

    if (Object.keys(errors).length > 0) {
      console.warn(`[${requestId}] Validation failed:`, errors);
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "入力内容に誤りがあります",
            details: errors,
          },
        } satisfies ErrorResponse,
        400
      );
    }

    // 親カテゴリの存在チェック
    if (parent_id) {
      console.log(
        `[${requestId}] Checking parent category existence: ${parent_id}`
      );
      const parentCheck = await db
        .prepare("SELECT id FROM categories WHERE id = ?")
        .bind(parent_id)
        .first<{ id: number }>();

      if (!parentCheck) {
        console.warn(`[${requestId}] Parent category not found: ${parent_id}`);
        return c.json(
          {
            error: {
              code: "PARENT_NOT_FOUND",
              message: "指定された親カテゴリが存在しません",
            },
          } satisfies ErrorResponse,
          400
        );
      }
    }

    // カテゴリ重複チェック
    console.log(`[${requestId}] Checking category duplication`);
    const duplicateCheck = await db
      .prepare("SELECT id FROM categories WHERE name = ? AND parent_id IS ?")
      .bind(name, parent_id || null)
      .first<{ id: number }>();

    if (duplicateCheck) {
      console.warn(`[${requestId}] Duplicate category detected: ${name}`);
      return c.json(
        {
          error: {
            code: "DUPLICATE_CATEGORY",
            message: "同名のカテゴリが既に存在します",
          },
        } satisfies ErrorResponse,
        409
      );
    }

    // カテゴリ挿入
    console.log(`[${requestId}] Inserting category into database`);
    const insertResult = await db
      .prepare(
        `INSERT INTO categories (name, parent_id)
         VALUES (?, ?) RETURNING id, name, parent_id;`
      )
      .bind(name, parent_id || null)
      .first<{ id: number; name: string; parent_id: number | null }>();

    if (!insertResult) {
      throw new Error("カテゴリIDの取得に失敗しました");
    }

    console.log(`[${requestId}] Category created with ID: ${insertResult.id}`);

    // 成功レスポンス
    return c.json(
      {
        success: true,
        data: {
          id: insertResult.id,
          name: insertResult.name,
          parent_id: insertResult.parent_id,
        },
      },
      201
    );
  } catch (error) {
    console.error(`[${requestId}] Error in category creation:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "カテゴリ登録処理に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 主な特徴と商品作成ハンドラーからの変更点

1. **認証処理**

   - 管理者権限チェックを商品作成と同様に実装
   - エラーメッセージをカテゴリ登録用に調整

2. **リクエスト形式**

   - 商品作成の FormData ではなく、JSON ボディを処理
   - 必須パラメータ: `name`（カテゴリ名）
   - オプションパラメータ: `parent_id`（親カテゴリ ID）

3. **バリデーション**

   - シンプルな手動バリデーションを実装
   - カテゴリ名: 必須、文字列、100 文字以内
   - 親カテゴリ ID: 整数値チェック
   - 親カテゴリの存在チェック（指定された場合）
   - 同一階層での重複カテゴリ名チェック

4. **データベース操作**

   - シンプルな INSERT 操作
   - RETURNING 句で登録内容を取得
   - 親カテゴリがない場合の NULL 処理

5. **エラーハンドリング**
   - 親カテゴリが存在しない場合の専用エラー
   - 重複カテゴリ登録時の 409 Conflict エラー
   - その他のバリデーションエラー

### 使い方サンプル

**リクエスト例 (大分類の作成):**

```json
POST /categories
Content-Type: application/json

{
  "name": "家電"
}
```

**レスポンス例:**

```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "家電",
    "parent_id": null
  }
}
```

**リクエスト例 (中分類の作成):**

```json
POST /categories
Content-Type: application/json

{
  "name": "テレビ",
  "parent_id": 5
}
```

この実装では、カテゴリの階層構造を考慮した登録処理を行い、必要なバリデーションとエラーハンドリングを備えています。
