了解しました。以下に階層構造対応のカテゴリ管理 API を実装します。商品カテゴリの親子関係を含めた包括的な管理システムを構築します。

### 1. カテゴリ一覧取得 API (階層構造対応 `GET /categories`)

`backend/src/endpoints/categories/listCategories.ts`:

```typescript
import { Context } from "hono";
import { Bindings, ErrorResponse, SuccessResponse } from "../../types/types";

interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  children?: Category[];
}

export const listCategoriesHandler = async (
  c: Context<{ Bindings: Bindings }>
): Promise<Response> => {
  try {
    // カテゴリ全件取得
    const { results } = await c.env.DB.prepare(
      "SELECT id, name, parent_id FROM categories ORDER BY name"
    ).all<{
      id: number;
      name: string;
      parent_id: number | null;
    }>();

    // 階層構造に変換
    const buildHierarchy = (
      categories: Category[],
      parentId: number | null = null
    ): Category[] => {
      return categories
        .filter((category) => category.parent_id === parentId)
        .map((category) => ({
          ...category,
          children: buildHierarchy(categories, category.id),
        }));
    };

    const hierarchicalCategories = buildHierarchy(results);

    return c.json(
      {
        data: hierarchicalCategories,
      } satisfies SuccessResponse,
      200
    );
  } catch (error) {
    console.error("List categories error:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "カテゴリ一覧の取得に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 2. カテゴリ作成 API (`POST /categories`)

`backend/src/endpoints/categories/createCategory.ts`:

```typescript
import { Context } from "hono";
import { Bindings, ErrorResponse, SuccessResponse } from "../../types/types";
import { z } from "zod";

const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  parent_id: z.number().int().nullable().optional(),
});

export const createCategoryHandler = async (
  c: Context<{ Bindings: Bindings }>
): Promise<Response> => {
  try {
    const rawJson = await c.req.json();
    const validationResult = createCategorySchema.safeParse(rawJson);

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

    const { name, parent_id } = validationResult.data;

    // 親カテゴリの存在確認
    if (parent_id) {
      const parentExists = await c.env.DB.prepare(
        "SELECT id FROM categories WHERE id = ?"
      )
        .bind(parent_id)
        .first();

      if (!parentExists) {
        return c.json(
          {
            error: {
              code: "PARENT_NOT_FOUND",
              message: "親カテゴリが見つかりません",
            },
          } satisfies ErrorResponse,
          404
        );
      }
    }

    // カテゴリ名の重複チェック（同一階層内）
    const existingCategory = await c.env.DB.prepare(
      "SELECT id FROM categories WHERE name = ? AND parent_id IS ?"
    )
      .bind(name, parent_id)
      .first();

    if (existingCategory) {
      return c.json(
        {
          error: {
            code: "CATEGORY_EXISTS",
            message: "このカテゴリ名は既に存在します",
          },
        } satisfies ErrorResponse,
        409
      );
    }

    // カテゴリ作成
    const result = await c.env.DB.prepare(
      "INSERT INTO categories (name, parent_id, created_at) VALUES (?, ?, ?) RETURNING *"
    )
      .bind(name, parent_id, new Date().toISOString())
      .first<{
        id: number;
        name: string;
        parent_id: number | null;
      }>();

    return c.json(
      {
        data: result,
      } satisfies SuccessResponse,
      201
    );
  } catch (error) {
    console.error("Create category error:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "カテゴリの作成に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 3. カテゴリ更新 API (`PUT /categories/:id`)

`backend/src/endpoints/categories/updateCategory.ts`:

```typescript
import { Context } from "hono";
import { Bindings, ErrorResponse, SuccessResponse } from "../../types/types";
import { z } from "zod";

const updateCategorySchema = z.object({
  name: z.string().min(1).max(50),
});

export const updateCategoryHandler = async (
  c: Context<{ Bindings: Bindings }>
): Promise<Response> => {
  try {
    const categoryId = parseInt(c.req.param("id"));
    if (isNaN(categoryId)) {
      return c.json(
        {
          error: {
            code: "INVALID_ID",
            message: "無効なカテゴリIDです",
          },
        } satisfies ErrorResponse,
        400
      );
    }

    const rawJson = await c.req.json();
    const validationResult = updateCategorySchema.safeParse(rawJson);

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

    const { name } = validationResult.data;

    // カテゴリ存在確認
    const category = await c.env.DB.prepare(
      "SELECT id, parent_id FROM categories WHERE id = ?"
    )
      .bind(categoryId)
      .first<{ id: number; parent_id: number | null }>();

    if (!category) {
      return c.json(
        {
          error: {
            code: "CATEGORY_NOT_FOUND",
            message: "カテゴリが見つかりません",
          },
        } satisfies ErrorResponse,
        404
      );
    }

    // カテゴリ名の重複チェック（同一階層内）
    const existingCategory = await c.env.DB.prepare(
      "SELECT id FROM categories WHERE name = ? AND parent_id IS ? AND id != ?"
    )
      .bind(name, category.parent_id, categoryId)
      .first();

    if (existingCategory) {
      return c.json(
        {
          error: {
            code: "CATEGORY_EXISTS",
            message: "このカテゴリ名は既に存在します",
          },
        } satisfies ErrorResponse,
        409
      );
    }

    // カテゴリ更新
    await c.env.DB.prepare("UPDATE categories SET name = ? WHERE id = ?")
      .bind(name, categoryId)
      .run();

    // 更新後のカテゴリ情報を取得
    const updatedCategory = await c.env.DB.prepare(
      "SELECT id, name, parent_id FROM categories WHERE id = ?"
    )
      .bind(categoryId)
      .first();

    return c.json(
      {
        data: updatedCategory,
      } satisfies SuccessResponse,
      200
    );
  } catch (error) {
    console.error("Update category error:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "カテゴリの更新に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 4. カテゴリ削除 API (`DELETE /categories/:id`)

`backend/src/endpoints/categories/deleteCategory.ts`:

```typescript
import { Context } from "hono";
import { Bindings, ErrorResponse, SuccessResponse } from "../../types/types";

export const deleteCategoryHandler = async (
  c: Context<{ Bindings: Bindings }>
): Promise<Response> => {
  try {
    const categoryId = parseInt(c.req.param("id"));
    if (isNaN(categoryId)) {
      return c.json(
        {
          error: {
            code: "INVALID_ID",
            message: "無効なカテゴリIDです",
          },
        } satisfies ErrorResponse,
        400
      );
    }

    // カテゴリ存在確認
    const category = await c.env.DB.prepare(
      "SELECT id FROM categories WHERE id = ?"
    )
      .bind(categoryId)
      .first();

    if (!category) {
      return c.json(
        {
          error: {
            code: "CATEGORY_NOT_FOUND",
            message: "カテゴリが見つかりません",
          },
        } satisfies ErrorResponse,
        404
      );
    }

    // サブカテゴリの存在確認
    const hasChildren = await c.env.DB.prepare(
      "SELECT id FROM categories WHERE parent_id = ? LIMIT 1"
    )
      .bind(categoryId)
      .first();

    if (hasChildren) {
      return c.json(
        {
          error: {
            code: "HAS_SUBCATEGORIES",
            message: "サブカテゴリが存在するため削除できません",
          },
        } satisfies ErrorResponse,
        400
      );
    }

    // 商品の関連付け確認
    const hasProducts = await c.env.DB.prepare(
      "SELECT id FROM products WHERE category_id = ? LIMIT 1"
    )
      .bind(categoryId)
      .first();

    if (hasProducts) {
      return c.json(
        {
          error: {
            code: "HAS_PRODUCTS",
            message: "このカテゴリに関連付けられた商品が存在します",
          },
        } satisfies ErrorResponse,
        400
      );
    }

    // カテゴリ削除
    await c.env.DB.prepare("DELETE FROM categories WHERE id = ?")
      .bind(categoryId)
      .run();

    return c.json(
      {
        data: {
          deleted: true,
          id: categoryId,
        },
      } satisfies SuccessResponse,
      200
    );
  } catch (error) {
    console.error("Delete category error:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "カテゴリの削除に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 5. ルートにカテゴリ管理 API を追加

`backend/src/routes/index.ts`:

```typescript
// ... 既存のインポート ...
import { listCategoriesHandler } from "endpoints/categories/listCategories";
import { createCategoryHandler } from "endpoints/categories/createCategory";
import { updateCategoryHandler } from "endpoints/categories/updateCategory";
import { deleteCategoryHandler } from "endpoints/categories/deleteCategory";

// ... 既存のルート定義 ...

// =====================
// Category Routes
// =====================
app
  .get("/api/categories", listCategoriesHandler)
  .post(
    "/api/categories",
    jwtMiddleware,
    adminMiddleware,
    createCategoryHandler
  )
  .put(
    "/api/categories/:id",
    jwtMiddleware,
    adminMiddleware,
    updateCategoryHandler
  )
  .delete(
    "/api/categories/:id",
    jwtMiddleware,
    adminMiddleware,
    deleteCategoryHandler
  );
```

### 6. データベーススキーマ (カテゴリテーブル)

`migrations/schema.sql` に以下を追加:

```sql
-- カテゴリテーブル（自己参照）
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  parent_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_parent ON categories(name, parent_id) WHERE parent_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_null_parent ON categories(name) WHERE parent_id IS NULL;
```

### 7. 動作確認スクリプト

#### カテゴリ一覧取得:

```bash
curl -X GET http://localhost:8787/api/categories
```

#### カテゴリ作成:

```bash
curl -X POST http://localhost:8787/api/categories \
  -H "Authorization: Bearer [管理者トークン]" \
  -H "Content-Type: application/json" \
  -d '{"name":"新カテゴリ", "parent_id":1}'
```

#### カテゴリ更新:

```bash
curl -X PUT http://localhost:8787/api/categories/1 \
  -H "Authorization: Bearer [管理者トークン]" \
  -H "Content-Type: application/json" \
  -d '{"name":"更新カテゴリ名"}'
```

#### カテゴリ削除:

```bash
curl -X DELETE http://localhost:8787/api/categories/1 \
  -H "Authorization: Bearer [管理者トークン]"
```

### 8. 実装した機能の概要

1. **階層構造カテゴリ**:

   - 親カテゴリと子カテゴリの関係
   - 再帰的な階層構造の構築
   - フラットな DB 構造を階層的に変換

2. **カテゴリ管理**:

   - カテゴリの作成・更新・削除
   - 名前の重複チェック（同一階層内）
   - 親カテゴリの存在確認

3. **安全な削除処理**:

   - サブカテゴリが存在する場合は削除不可
   - 商品が関連付けられている場合は削除不可

4. **バリデーション**:

   - カテゴリ名の長さ制限
   - ID の数値チェック
   - 適切なエラーレスポンス

5. **セキュリティ**:
   - JWT 認証必須
   - 管理者権限必須

### 9. 追加考慮事項

1. **カテゴリ移動機能**:

   - 親カテゴリを変更する機能
   - 階層位置の再編成

2. **カテゴリ画像**:

   - カテゴリごとの代表画像を設定

3. **並び順制御**:

   - カテゴリ表示順を制御する order フィールド

4. **多階層対応**:

   - 複数階層の深さ制限
   - パンくずリスト生成用の API

5. **バッチ処理**:
   - カテゴリ一括操作 API

この実装により、柔軟な商品分類システムを構築でき、ユーザーが商品を効率的に閲覧・検索できるようになります。
