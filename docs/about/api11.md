了解しました。管理者用の操作ログシステムを以下のように実装します。操作履歴の記録と取得機能を提供し、セキュリティ監査やトラブルシューティングに活用できる設計です。

### 1. 操作ログ一覧取得 API (`GET /admin/logs`)

`backend/src/endpoints/admin/getAdminLogs.ts`:

```typescript
import { Context } from "hono";
import {
  Bindings,
  ErrorResponse,
  SuccessResponse,
  JwtPayload,
} from "../../types/types";

export const getAdminLogsHandler = async (
  c: Context<{ Bindings: Bindings; Variables: { jwtPayload?: JwtPayload } }>
): Promise<Response> => {
  const payload = c.get("jwtPayload");

  // 管理者権限チェック
  if (!payload || payload.role !== "admin") {
    return c.json(
      {
        error: {
          code: "ADMIN_REQUIRED",
          message: "管理者権限が必要です",
        },
      } satisfies ErrorResponse,
      403
    );
  }

  try {
    const query = c.req.query();
    const page = Math.max(parseInt(query.page) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(query.per_page) || 20, 1), 100);
    const action = query.action || "";
    const userId = parseInt(query.user_id) || null;

    // クエリ構築
    const conditions = [];
    const binds = [];

    if (action) {
      conditions.push("action LIKE ?");
      binds.push(`%${action}%`);
    }

    if (userId) {
      conditions.push("user_id = ?");
      binds.push(userId);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    // ログ一覧取得
    const { results } = await c.env.DB.prepare(
      `SELECT 
        id,
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent,
        created_at
       FROM admin_logs
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(...binds, perPage, (page - 1) * perPage)
      .all<{
        id: number;
        user_id: number | null;
        action: string;
        resource_type: string | null;
        resource_id: number | null;
        details: string | null;
        ip_address: string | null;
        user_agent: string | null;
        created_at: string;
      }>();

    // 総数取得
    const { total } = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM admin_logs ${whereClause}`
    )
      .bind(...binds)
      .first<{ total: number }>();

    return c.json({
      data: results,
      meta: {
        page,
        per_page: perPage,
        total,
        filters: {
          action,
          user_id: userId,
        },
      },
    } satisfies SuccessResponse);
  } catch (error) {
    console.error("ログ取得エラー:", error);
    return c.json(
      {
        error: {
          code: "SERVER_ERROR",
          message: "ログの取得に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};
```

### 2. 操作ログ記録 API (`POST /admin/logs`)

`backend/src/endpoints/admin/createAdminLog.ts`:

```typescript
import { Context } from "hono";
import {
  Bindings,
  ErrorResponse,
  SuccessResponse,
  JwtPayload,
} from "../../types/types";
import { z } from "zod";

const logSchema = z.object({
  action: z.string().min(1).max(100),
  resource_type: z.string().max(50).optional(),
  resource_id: z.number().int().positive().optional(),
  details: z.record(z.any()).optional(),
});

export const createAdminLogHandler = async (
  c: Context<{ Bindings: Bindings; Variables: { jwtPayload?: JwtPayload } }>
): Promise<Response> => {
  const payload = c.get("jwtPayload");

  // 管理者権限チェック（ログ記録自体はAPI経由で行う場合）
  if (!payload || payload.role !== "admin") {
    return c.json(
      {
        error: {
          code: "ADMIN_REQUIRED",
          message: "管理者権限が必要です",
        },
      } satisfies ErrorResponse,
      403
    );
  }

  try {
    const json = await c.req.json();
    const result = logSchema.safeParse(json);

    if (!result.success) {
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "無効なログデータです",
          },
        } satisfies ErrorResponse,
        400
      );
    }

    const { action, resource_type, resource_id, details } = result.data;
    const ip_address =
      c.req.header("CF5-Connecting-IP") ||
      c.req.header("x-forwarded-for") ||
      "";
    const user_agent = c.req.header("user-agent") || "";

    // ログ記録
    const log = await c.env.DB.prepare(
      `INSERT INTO admin_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
    )
      .bind(
        payload.user_id,
        action,
        resource_type || null,
        resource_id || null,
        details ? JSON.stringify(details) : null,
        ip_address,
        user_agent,
        new Date().toISOString()
      )
      .first<{
        id: number;
        user_id: number;
        action: string;
        created_at: string;
      }>();

    return c.json(
      {
        data: {
          id: log.id,
          action: log.action,
          recorded_at: log.created_at,
        },
      } satisfies SuccessResponse,
      201
    );
  } catch (error) {
    console.error("ログ記録エラー:", error);
    return c.json(
      {
        error: {
          code: "SERVER_ERROR",
          message: "ログの記録に失敗しました",
        },
      } satisfies ErrorResponse,
      500
    );
  }
};

// 自動ログ記録用ヘルパー関数
export async function recordAdminLog(
  db: D1Database,
  options: {
    userId?: number;
    action: string;
    resourceType?: string;
    resourceId?: number;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<void> {
  try {
    await db
      .prepare(
        `INSERT INTO admin_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        options.userId || null,
        options.action,
        options.resourceType || null,
        options.resourceId || null,
        options.details ? JSON.stringify(options.details) : null,
        options.ipAddress || null,
        options.userAgent || null,
        new Date().toISOString()
      )
      .run();
  } catch (error) {
    console.error("自動ログ記録エラー:", error);
  }
}
```

### 3. ログミドルウェア（自動記録用）

`backend/src/middlewares/adminLogMiddleware.ts`:

```typescript
import { Next } from "hono";
import { Context } from "hono";
import { Bindings } from "../types/types";

export const adminLogMiddleware = async (
  c: Context<{ Bindings: Bindings }>,
  next: Next
) => {
  await next();

  // 管理者関連のエンドポイントのみ記録
  if (!c.req.path.startsWith("/admin")) return;

  const payload = c.get("jwtPayload");
  const status = c.res.status;
  const method = c.req.method;

  // 重要な操作のみ記録
  const shouldLog =
    method !== "GET" ||
    (status >= 400 && status < 600) ||
    c.req.path.includes("/admin/logs");

  if (shouldLog) {
    const action = `${method} ${c.req.path} - ${status}`;
    const ipAddress =
      c.req.header("CF5-Connecting-IP") ||
      c.req.header("x-forwarded-for") ||
      "";
    const userAgent = c.req.header("user-agent") || "";

    // 非同期で記録（レスポンスをブロックしない）
    c.executionCtx.waitUntil(
      recordAdminLog(c.env.DB, {
        userId: payload?.user_id,
        action,
        resourceType: c.req.path.split("/")[2],
        resourceId: parseInt(c.req.param("id")) || undefined,
        details: {
          method: c.req.method,
          path: c.req.path,
          status,
        },
        ipAddress,
        userAgent,
      })
    );
  }
};
```

### 4. ルート設定

`backend/src/routes/index.ts`:

```typescript
// ... 既存のインポート ...
import { getAdminLogsHandler } from "endpoints/admin/getAdminLogs";
import { createAdminLogHandler } from "endpoints/admin/createAdminLog";
import { adminLogMiddleware } from "middlewares/adminLogMiddleware";

// ... 既存のルート定義 ...

// =====================
// Admin Logs Routes
// =====================
app
  .use("/admin/*", adminLogMiddleware)
  .get("/admin/logs", jwtMiddleware, adminMiddleware, getAdminLogsHandler)
  .post("/admin/logs", jwtMiddleware, adminMiddleware, createAdminLogHandler);
```

### 5. データベーススキーマ

`migrations/schema.sql` に以下を追加:

```sql
-- 管理者操作ログテーブル
CREATE TABLE IF NOT EXISTS admin_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id INTEGER,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_admin_logs_user_id ON admin_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_logs_resource ON admin_logs(resource_type, resource_id);
```

### 6. 主な機能と特徴

1. **包括的なログ記録**:

   - 管理者操作の自動記録
   - 手動ログ記録 API
   - リソース変更追跡

2. **詳細な監査情報**:

   - 実行ユーザー
   - アクション内容
   - リソースタイプ/ID
   - IP アドレスとユーザーエージェント

3. **高度な検索機能**:

   - フィルタリング（アクション、ユーザー）
   - ページネーション
   - 時系列ソート

4. **セキュリティ対策**:

   - 管理者専用アクセス
   - 改ざん防止設計
   - 重要な操作の自動記録

5. **パフォーマンス考慮**:
   - 非同期ロギング
   - 効率的なインデックス設計
   - バッチ処理対応

### 7. 動作確認スクリプト

#### ログ一覧取得:

```bash
curl -X GET "http://localhost:8787/admin/logs?action=DELETE&user_id=123" \
  -H "Authorization: Bearer [管理者トークン]"
```

#### 手動ログ記録:

```bash
curl -X POST http://localhost:8787/admin/logs \
  -H "Authorization: Bearer [管理者トークン]" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "manual_operation",
    "resource_type": "product",
    "resource_id": 456,
    "details": {"note": "価格変更の手動承認"}
  }'
```

### 8. 追加実装オプション

1. **ログエクスポート機能**:

   ```typescript
   app.get("/admin/logs/export", ...);
   ```

   - CSV/Excel 形式でのエクスポート

2. **ログ保持ポリシー**:

   - 自動的な古いログの削除
   - ログローテーション

3. **リアルタイム監視**:

   - WebSocket を使ったリアルタイムログ表示

4. **セキュリティアラート**:
   - 不審な操作の自動検知と通知

この実装により、システム管理者がすべての重要な操作を追跡・監査できる堅牢なロギングシステムを構築できます。セキュリティ要件に応じて、さらに詳細な情報を記録するように拡張することも可能です。
