了解しました。ユーザー管理 API を開発します。以下の実装では、管理者権限チェックや本人確認などのセキュリティ対策を含めます。

### 1. 共通ミドルウェアの作成

まず、管理者権限チェック用のミドルウェアを作成します。

`backend/src/middleware/adminCheck.ts`:

```typescript
import { MiddlewareHandler } from "hono";
import { Env, JwtPayload } from "../types/types";

export const adminMiddleware: MiddlewareHandler<{
  Bindings: Env;
  Variables: {
    jwtPayload?: JwtPayload;
  };
}> = async (c, next) => {
  const payload = c.get("jwtPayload");

  if (!payload) {
    return c.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "認証が必要です",
        },
      },
      401
    );
  }

  // ユーザーのroleを取得
  const user = await c.env.DB.prepare("SELECT role FROM users WHERE id = ?")
    .bind(payload.user_id)
    .first<{ role: string }>();

  if (!user || user.role !== "admin") {
    return c.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "管理者権限が必要です",
        },
      },
      403
    );
  }

  await next();
};
```

### 2. ユーザー情報取得 API (`GET /users/:id`)

`backend/src/endpoints/users/getUserById.ts`:

```typescript
import { Context } from "hono";
import { Bindings, ErrorResponse, SuccessResponse } from "../../types/types";

export const getUserByIdHandler = async (
  c: Context<{ Bindings: Bindings; Variables: { jwtPayload?: JwtPayload } }>
): Promise<Response> => {
  try {
    const userId = parseInt(c.req.param("id"));
    if (isNaN(userId)) {
      return c.json(
        {
          error: {
            code: "INVALID_ID",
            message: "無効なユーザーIDです",
          },
        } satisfies ErrorResponse,
        400
      );
    }

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

    // 本人または管理者のみアクセス可能
    if (payload.user_id !== userId) {
      const user = await c.env.DB.prepare("SELECT role FROM users WHERE id = ?")
        .bind(payload.user_id)
        .first<{ role: string }>();

      if (user?.role !== "admin") {
        return c.json(
          {
            error: {
              code: "FORBIDDEN",
              message: "アクセス権限がありません",
            },
          } satisfies ErrorResponse,
          403
        );
      }
    }

    const user = await c.env.DB.prepare(
      "SELECT id, email, name, role, created_at FROM users WHERE id = ?"
    )
      .bind(userId)
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
    console.error("Get user by ID error:", error);
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

### 3. 全ユーザー一覧取得 API (`GET /users`) - 管理者用

`backend/src/endpoints/users/getUsers.ts`:

```typescript
import { Context } from "hono";
import { Bindings, ErrorResponse, SuccessResponse } from "../../types/types";
import { adminMiddleware } from "../../middleware/adminCheck";

export const getUsersHandler = async (
  c: Context<{ Bindings: Bindings; Variables: { jwtPayload?: JwtPayload } }>
): Promise<Response> => {
  try {
    // クエリパラメータの取得
    const { page = 1, per_page = 20 } = c.req.query();
    const pageNum = parseInt(page as string) || 1;
    const perPageNum = parseInt(per_page as string) || 20;

    if (pageNum < 1 || perPageNum < 1) {
      return c.json(
        {
          error: {
            code: "INVALID_PAGINATION",
            message: "ページ番号と表示件数は1以上の値を指定してください",
          },
        } satisfies ErrorResponse,
        400
      );
    }

    // 総ユーザー数取得
    const totalCount = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM users"
    ).first<{ count: number }>();

    // ユーザー一覧取得
    const users = await c.env.DB.prepare(
      `SELECT id, email, name, role, created_at 
       FROM users 
       ORDER BY id DESC
       LIMIT ? OFFSET ?`
    )
      .bind(perPageNum, (pageNum - 1) * perPageNum)
      .all<{
        id: number;
        email: string;
        name: string;
        role: string;
        created_at: string;
      }>();

    return c.json(
      {
        data: users.results,
        meta: {
          page: pageNum,
          per_page: perPageNum,
          total: totalCount?.count || 0,
        },
      } satisfies SuccessResponse,
      200
    );
  } catch (error) {
    console.error("Get users error:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "ユーザー一覧の取得に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 4. ユーザー情報更新 API (`PUT /users/:id`)

`backend/src/endpoints/users/updateUser.ts`:

```typescript
import { Context } from "hono";
import { Bindings, ErrorResponse, SuccessResponse } from "../../types/types";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
  role: z.enum(["user", "admin"]).optional(),
});

export const updateUserHandler = async (
  c: Context<{ Bindings: Bindings; Variables: { jwtPayload?: JwtPayload } }>
): Promise<Response> => {
  try {
    const userId = parseInt(c.req.param("id"));
    if (isNaN(userId)) {
      return c.json(
        {
          error: {
            code: "INVALID_ID",
            message: "無効なユーザーIDです",
          },
        } satisfies ErrorResponse,
        400
      );
    }

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

    // 本人または管理者のみ更新可能
    if (payload.user_id !== userId) {
      const user = await c.env.DB.prepare("SELECT role FROM users WHERE id = ?")
        .bind(payload.user_id)
        .first<{ role: string }>();

      if (user?.role !== "admin") {
        return c.json(
          {
            error: {
              code: "FORBIDDEN",
              message: "更新権限がありません",
            },
          } satisfies ErrorResponse,
          403
        );
      }
    }

    const rawJson = await c.req.json();
    const validationResult = updateUserSchema.safeParse(rawJson);

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

    const { name, email, role } = validationResult.data;

    // 本人がroleを変更しようとした場合
    if (role && payload.user_id === userId) {
      return c.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "自身の権限は変更できません",
          },
        } satisfies ErrorResponse,
        403
      );
    }

    // メールアドレス重複チェック
    if (email) {
      const existingUser = await c.env.DB.prepare(
        "SELECT id FROM users WHERE email = ? AND id != ?"
      )
        .bind(email, userId)
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
    }

    // 更新するフィールドの構築
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (name) {
      updateFields.push("name = ?");
      updateValues.push(name);
    }
    if (email) {
      updateFields.push("email = ?");
      updateValues.push(email);
    }
    if (role) {
      updateFields.push("role = ?");
      updateValues.push(role);
    }

    if (updateFields.length === 0) {
      return c.json(
        {
          error: {
            code: "NO_UPDATES",
            message: "更新する内容がありません",
          },
        } satisfies ErrorResponse,
        400
      );
    }

    updateValues.push(userId);

    const query = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
    await c.env.DB.prepare(query)
      .bind(...updateValues)
      .run();

    // 更新後のユーザー情報を取得
    const updatedUser = await c.env.DB.prepare(
      "SELECT id, email, name, role, created_at FROM users WHERE id = ?"
    )
      .bind(userId)
      .first();

    return c.json(
      {
        data: updatedUser,
      } satisfies SuccessResponse,
      200
    );
  } catch (error) {
    console.error("Update user error:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "ユーザー情報の更新に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 5. ユーザー削除 API (`DELETE /users/:id`)

`backend/src/endpoints/users/deleteUser.ts`:

```typescript
import { Context } from "hono";
import { Bindings, ErrorResponse, SuccessResponse } from "../../types/types";

export const deleteUserHandler = async (
  c: Context<{ Bindings: Bindings; Variables: { jwtPayload?: JwtPayload } }>
): Promise<Response> => {
  try {
    const userId = parseInt(c.req.param("id"));
    if (isNaN(userId)) {
      return c.json(
        {
          error: {
            code: "INVALID_ID",
            message: "無効なユーザーIDです",
          },
        } satisfies ErrorResponse,
        400
      );
    }

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

    // 管理者でなければ削除不可
    const user = await c.env.DB.prepare("SELECT role FROM users WHERE id = ?")
      .bind(payload.user_id)
      .first<{ role: string }>();

    if (user?.role !== "admin") {
      return c.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "管理者権限が必要です",
          },
        } satisfies ErrorResponse,
        403
      );
    }

    // 自分自身は削除不可
    if (payload.user_id === userId) {
      return c.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "自分自身のアカウントは削除できません",
          },
        } satisfies ErrorResponse,
        403
      );
    }

    // ユーザー存在確認
    const targetUser = await c.env.DB.prepare(
      "SELECT id FROM users WHERE id = ?"
    )
      .bind(userId)
      .first();

    if (!targetUser) {
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

    // トランザクション開始
    const result = await c.env.DB.batch([
      // 関連データ削除 (セッション、カート、レビューなど)
      c.env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId),
      c.env.DB.prepare("DELETE FROM cart_items WHERE user_id = ?").bind(userId),
      c.env.DB.prepare("DELETE FROM reviews WHERE user_id = ?").bind(userId),
      c.env.DB.prepare("DELETE FROM wishlists WHERE user_id = ?").bind(userId),
      // 最後にユーザー削除
      c.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId),
    ]);

    return c.json(
      {
        data: {
          success: true,
          affectedRows: result.reduce((sum, r) => sum + (r.success ? 1 : 0), 0),
        },
      } satisfies SuccessResponse,
      200
    );
  } catch (error) {
    console.error("Delete user error:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "ユーザーの削除に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 6. ルートにユーザー管理 API を追加

`backend/src/routes/index.ts` を更新:

```typescript
// ... 既存のインポート ...
import { getUserByIdHandler } from "endpoints/users/getUserById";
import { getUsersHandler } from "endpoints/users/getUsers";
import { updateUserHandler } from "endpoints/users/updateUser";
import { deleteUserHandler } from "endpoints/users/deleteUser";

// ... 既存のルート定義 ...

// =====================
// User Management Routes
// =====================
app
  .get("/api/users/:id", jwtMiddleware, getUserByIdHandler)
  .get("/api/users", jwtMiddleware, adminMiddleware, getUsersHandler)
  .put("/api/users/:id", jwtMiddleware, updateUserHandler)
  .delete("/api/users/:id", jwtMiddleware, adminMiddleware, deleteUserHandler);
```

### 7. 動作確認

#### ユーザー情報取得 (管理者または本人のみ)

```bash
curl -X GET http://localhost:8787/api/users/1 \
  -H "Authorization: Bearer [管理者または本人のトークン]"
```

#### 全ユーザー一覧 (管理者のみ)

```bash
curl -X GET http://localhost:8787/api/users \
  -H "Authorization: Bearer [管理者トークン]"
```

#### ユーザー情報更新 (本人または管理者)

```bash
curl -X PUT http://localhost:8787/api/users/1 \
  -H "Authorization: Bearer [トークン]" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}'
```

#### ユーザー削除 (管理者のみ)

```bash
curl -X DELETE http://localhost:8787/api/users/2 \
  -H "Authorization: Bearer [管理者トークン]"
```

これで、以下の機能が実装されました：

1. 特定ユーザー情報の取得（管理者または本人のみ）
2. 全ユーザー一覧の取得（管理者のみ）
3. ユーザー情報の更新（本人または管理者）
   - 本人は自分自身の情報を更新可能
   - 管理者は他のユーザーの情報とロールを更新可能
4. ユーザーの削除（管理者のみ）
   - 関連データも一括削除
   - 自己削除は防止

セキュリティ対策として、適切な権限チェック、バリデーション、エラーハンドリングを実装しています。また、管理者機能には必ず adminMiddleware を適用しています。
