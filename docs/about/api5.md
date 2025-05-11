了解しました。タグ管理 API を以下のように実装します。商品タグの関連付けや管理機能を包括的に実装します。

### 1. タグ一覧取得 API (`GET /tags`)

`backend/src/endpoints/tags/listTags.ts`:

```typescript
import { Context } from "hono";
import { Bindings, ErrorResponse, SuccessResponse } from "../../types/types";
import { z } from "zod";

const querySchema = z.object({
  page: z.preprocess(Number, z.number().int().min(1).default(1)),
  per_page: z.preprocess(Number, z.number().int().min(1).max(100).default(20)),
  sort: z.enum(["name", "popular", "newest"]).default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export const listTagsHandler = async (
  c: Context<{ Bindings: Bindings }>
): Promise<Response> => {
  try {
    // クエリパラメータのバリデーション
    const validationResult = querySchema.safeParse(c.req.query());
    if (!validationResult.success) {
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "無効なクエリパラメータです",
            issues: validationResult.error.errors,
          },
        } satisfies ErrorResponse,
        400
      );
    }

    const { page, per_page, sort, order } = validationResult.data;

    // ソート条件
    let orderBy = "name ASC";
    if (sort === "popular") {
      orderBy = "product_count DESC";
    } else if (sort === "newest") {
      orderBy = "created_at DESC";
    } else {
      orderBy = `name ${order}`;
    }

    // 総数取得
    const totalCount = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM tags"
    ).first<{ count: number }>();

    // タグ一覧取得（商品件数付き）
    const tags = await c.env.DB.prepare(
      `SELECT 
        t.id,
        t.name,
        t.created_at,
        COUNT(pt.product_id) as product_count
       FROM tags t
       LEFT JOIN product_tags pt ON t.id = pt.tag_id
       GROUP BY t.id
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`
    )
      .bind(per_page, (page - 1) * per_page)
      .all<{
        id: number;
        name: string;
        created_at: string;
        product_count: number;
      }>();

    return c.json(
      {
        data: tags.results,
        meta: {
          page,
          per_page,
          total: totalCount?.count || 0,
        },
      } satisfies SuccessResponse,
      200
    );
  } catch (error) {
    console.error("List tags error:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "タグ一覧の取得に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 2. タグ作成 API (`POST /tags`)

`backend/src/endpoints/tags/createTag.ts`:

```typescript
import { Context } from "hono";
import { Bindings, ErrorResponse, SuccessResponse } from "../../types/types";
import { z } from "zod";

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
});

export const createTagHandler = async (
  c: Context<{ Bindings: Bindings }>
): Promise<Response> => {
  try {
    const rawJson = await c.req.json();
    const validationResult = createTagSchema.safeParse(rawJson);

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

    // タグ名の重複チェック
    const existingTag = await c.env.DB.prepare(
      "SELECT id FROM tags WHERE name = ?"
    )
      .bind(name)
      .first();

    if (existingTag) {
      return c.json(
        {
          error: {
            code: "TAG_EXISTS",
            message: "このタグ名は既に存在します",
          },
        } satisfies ErrorResponse,
        409
      );
    }

    // タグ作成
    const result = await c.env.DB.prepare(
      "INSERT INTO tags (name, created_at) VALUES (?, ?) RETURNING *"
    )
      .bind(name, new Date().toISOString())
      .first<{
        id: number;
        name: string;
        created_at: string;
      }>();

    return c.json(
      {
        data: result,
      } satisfies SuccessResponse,
      201
    );
  } catch (error) {
    console.error("Create tag error:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "タグの作成に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 3. 商品にタグ付け API (`POST /products/:id/tags`)

`backend/src/endpoints/tags/addProductTag.ts`:

```typescript
import { Context } from "hono";
import { Bindings, ErrorResponse, SuccessResponse } from "../../types/types";
import { z } from "zod";

const addTagSchema = z.object({
  tag_id: z.number().int().positive(),
});

export const addProductTagHandler = async (
  c: Context<{ Bindings: Bindings }>
): Promise<Response> => {
  try {
    const productId = parseInt(c.req.param("id"));
    if (isNaN(productId)) {
      return c.json(
        {
          error: {
            code: "INVALID_PRODUCT_ID",
            message: "無効な商品IDです",
          },
        } satisfies ErrorResponse,
        400
      );
    }

    const rawJson = await c.req.json();
    const validationResult = addTagSchema.safeParse(rawJson);

    if (!validationResult.success) {
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "無効なタグIDです",
            issues: validationResult.error.errors,
          },
        } satisfies ErrorResponse,
        400
      );
    }

    const { tag_id } = validationResult.data;

    // 商品存在確認
    const productExists = await c.env.DB.prepare(
      "SELECT id FROM products WHERE id = ?"
    )
      .bind(productId)
      .first();

    if (!productExists) {
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

    // タグ存在確認
    const tagExists = await c.env.DB.prepare("SELECT id FROM tags WHERE id = ?")
      .bind(tag_id)
      .first();

    if (!tagExists) {
      return c.json(
        {
          error: {
            code: "TAG_NOT_FOUND",
            message: "タグが見つかりません",
          },
        } satisfies ErrorResponse,
        404
      );
    }

    // 既に関連付けられていないか確認
    const alreadyTagged = await c.env.DB.prepare(
      "SELECT id FROM product_tags WHERE product_id = ? AND tag_id = ?"
    )
      .bind(productId, tag_id)
      .first();

    if (alreadyTagged) {
      return c.json(
        {
          error: {
            code: "ALREADY_TAGGED",
            message: "この商品には既にタグが付けられています",
          },
        } satisfies ErrorResponse,
        409
      );
    }

    // タグ付け
    await c.env.DB.prepare(
      "INSERT INTO product_tags (product_id, tag_id, created_at) VALUES (?, ?, ?)"
    )
      .bind(productId, tag_id, new Date().toISOString())
      .run();

    // 更新後のタグ一覧を取得
    const tags = await c.env.DB.prepare(
      `SELECT t.id, t.name 
       FROM product_tags pt
       JOIN tags t ON pt.tag_id = t.id
       WHERE pt.product_id = ?`
    )
      .bind(productId)
      .all<{ id: number; name: string }>();

    return c.json(
      {
        data: {
          product_id: productId,
          tags: tags.results,
        },
      } satisfies SuccessResponse,
      201
    );
  } catch (error) {
    console.error("Add product tag error:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "タグの追加に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 4. 商品タグ解除 API (`DELETE /products/:id/tags/:tag_id`)

`backend/src/endpoints/tags/removeProductTag.ts`:

```typescript
import { Context } from "hono";
import { Bindings, ErrorResponse, SuccessResponse } from "../../types/types";

export const removeProductTagHandler = async (
  c: Context<{ Bindings: Bindings }>
): Promise<Response> => {
  try {
    const productId = parseInt(c.req.param("id"));
    const tagId = parseInt(c.req.param("tag_id"));

    if (isNaN(productId) || isNaN(tagId)) {
      return c.json(
        {
          error: {
            code: "INVALID_IDS",
            message: "無効な商品IDまたはタグIDです",
          },
        } satisfies ErrorResponse,
        400
      );
    }

    // 関連付け存在確認
    const relationExists = await c.env.DB.prepare(
      "SELECT id FROM product_tags WHERE product_id = ? AND tag_id = ?"
    )
      .bind(productId, tagId)
      .first();

    if (!relationExists) {
      return c.json(
        {
          error: {
            code: "RELATION_NOT_FOUND",
            message: "指定されたタグはこの商品に付けられていません",
          },
        } satisfies ErrorResponse,
        404
      );
    }

    // タグ解除
    await c.env.DB.prepare(
      "DELETE FROM product_tags WHERE product_id = ? AND tag_id = ?"
    )
      .bind(productId, tagId)
      .run();

    return c.json(
      {
        data: {
          removed: true,
          product_id: productId,
          tag_id: tagId,
        },
      } satisfies SuccessResponse,
      200
    );
  } catch (error) {
    console.error("Remove product tag error:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "タグの解除に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 5. ルートにタグ管理 API を追加

以下に、タグ管理 API のルート設定を追加します。

`backend/src/routes/index.ts`:

```typescript
// ... 既存のインポート ...
import { listTagsHandler } from "endpoints/tags/listTags";
import { createTagHandler } from "endpoints/tags/createTag";
import { addProductTagHandler } from "endpoints/tags/addProductTag";
import { removeProductTagHandler } from "endpoints/tags/removeProductTag";

// ... 既存のルート定義 ...

// =====================
// Tag Routes
// =====================
app
  .get("/api/tags", listTagsHandler)
  .post("/api/tags", jwtMiddleware, adminMiddleware, createTagHandler)
  .post(
    "/api/products/:id/tags",
    jwtMiddleware,
    adminMiddleware,
    addProductTagHandler
  )
  .delete(
    "/api/products/:id/tags/:tag_id",
    jwtMiddleware,
    adminMiddleware,
    removeProductTagHandler
  );
```

### 6. データベーススキーマ (タグ関連)

`migrations/schema.sql` に以下を追加:

```sql
-- タグテーブル
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 商品タグ関連テーブル
CREATE TABLE IF NOT EXISTS product_tags (
  product_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (product_id, tag_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_product_tags_product_id ON product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag_id ON product_tags(tag_id);
```

### 7. 動作確認スクリプト

#### タグ一覧取得:

```bash
curl -X GET http://localhost:8787/api/tags?sort=popular&order=desc
```

#### タグ作成:

```bash
curl -X POST http://localhost:8787/api/tags \
  -H "Authorization: Bearer [管理者トークン]" \
  -H "Content-Type: application/json" \
  -d '{"name":"新タグ"}'
```

#### 商品にタグ付け:

```bash
curl -X POST http://localhost:8787/api/products/123/tags \
  -H "Authorization: Bearer [管理者トークン]" \
  -H "Content-Type: application/json" \
  -d '{"tag_id":1}'
```

#### 商品からタグ解除:

```bash
curl -X DELETE http://localhost:8787/api/products/123/tags/1 \
  -H "Authorization: Bearer [管理者トークン]"
```

### 8. 実装した機能の概要

1. **タグ一覧取得**:

   - ページネーション対応
   - ソート機能（名前順、人気順、新着順）
   - 各タグの商品件数付き

2. **タグ作成**:

   - 管理者のみ作成可能
   - タグ名の重複チェック
   - バリデーション（1-50 文字）

3. **商品タグ管理**:

   - 商品へのタグ付け
   - 商品からのタグ解除
   - 関連の存在チェック
   - 適切なエラーハンドリング

4. **セキュリティ**:
   - 管理者権限必須
   - JWT 認証
   - 厳密な入力バリデーション

### 9. 追加考慮事項

1. **タグの編集機能**:

   - 必要に応じて `PUT /tags/:id` を追加

2. **タグの一括操作**:

   - 複数タグの一括追加・削除 API

3. **タグクラウド表示**:

   - 人気タグを強調表示するための weight 付き取得 API

4. **タグ検索**:
   - タグ名での絞り込み検索

この実装により、商品とタグの多対多関係を効果的に管理でき、商品のカテゴライズや検索性向上に貢献します。
