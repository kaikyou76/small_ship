```json
// wrangler.jsonc環境設定
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "backend",
  "main": "src/worker.ts",
  "compatibility_date": "2025-04-18",
  "kv_namespaces": [
    {
      "binding": "TEST_NAMESPACE",
      "id": "test-namespace-id"
    }
  ],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "shopping-db",
      "database_id": "d53ad56f-f646-44dc-8dbf-3d2d15d76973",
      "preview_database_id": "d53ad56f-f646-44dc-8dbf-3d2d15d76973"
    }
  ],
  "r2_buckets": [
    {
      "binding": "R2_BUCKET",
      "bucket_name": "dev-bucket",
      "preview_bucket_name": "preview-bucket"
    }
  ],
  "vars": {
    "JWT_SECRET": "local_dev_secret_do_not_use_in_prod",
    "JWT_ISSUER": "kaikyou-shop-dev",
    "JWT_AUDIENCE": "kaikyou-shop-users-dev",
    "ENVIRONMENT": "development",
    "R2_PUBLIC_DOMAIN": "localhost:8787/assets"
  },
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
      "d1_databases": [
        {
          "binding": "DB",
          "database_name": "shopping-db",
          "database_id": "d53ad56f-f646-44dc-8dbf-3d2d15d76973"
        }
      ]
    },
    "preview": {
      "vars": {
        "JWT_SECRET": "local_preview_secret_do_not_use_in_prod",
        "JWT_ISSUER": "kaikyou-shop-preview",
        "JWT_AUDIENCE": "kaikyou-shop-users-preview",
        "ENVIRONMENT": "preview",
        "R2_PUBLIC_DOMAIN": "localhost:8787/assets"
      },
      "r2_buckets": [
        {
          "binding": "R2_BUCKET",
          "bucket_name": "preview-bucket"
        }
      ],
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

- wrangler.jsonc の開発環境変数に合わせてモック環境を設定する。

```ts
//backend/test/utils/mockEnv.ts
import { vi } from "vitest";
import type { Env } from "../../src/types/types";
export const createMockEnv = (): Env => ({
  ENVIRONMENT: "development",
  JWT_SECRET: "test-secret",
  JWT_ISSUER: "kaikyou-shop-test", // wrangler の構成に準拠した名前付けに調整
  JWT_AUDIENCE: "kaikyou-shop-users-test",
  R2_PUBLIC_DOMAIN: "localhost:8787/assets",

  DB: {
    prepare: vi.fn().mockImplementation(() => ({
      bind: vi.fn().mockReturnThis(), // bind()の後にrun(), all()等をチェーン可能に
      run: vi.fn().mockResolvedValue({ success: false }), // run()に失敗させたい場合など
      first: vi.fn(), // SELECT ... LIMIT 1 に対応
      all: vi.fn(), // SELECT など複数行取得
      raw: vi.fn(), // SQL文字列そのまま取得（必要なケースもある）
    })),
  } as any,

  R2_BUCKET: {
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  } as any,
});
```

---

## ✅ 1. `vars`

```jsonc
"vars": {
  "JWT_SECRET": "local_dev_secret_do_not_use_in_prod",
  "JWT_ISSUER": "kaikyou-shop-dev",
  "JWT_AUDIENCE": "kaikyou-shop-users-dev",
  "ENVIRONMENT": "development",
  "R2_PUBLIC_DOMAIN": "localhost:8787/assets"
}
```

これらは Cloudflare Workers で `env.JWT_SECRET` のようにアクセスされる **環境変数** です。テスト用に同様の構造で指定する必要があります。

**対応するモックコード:**

```ts
ENVIRONMENT: "test",
JWT_SECRET: "test-secret",
JWT_ISSUER: "kaikyou-shop-test",
JWT_AUDIENCE: "kaikyou-shop-users-test",
R2_PUBLIC_DOMAIN: "localhost:8787/assets",
```

🔎 **ポイント**：

- 名前は本番や開発環境と違ってよいですが、構造は一致させるべきです。
- `.env.production` や `wrangler.jsonc` の `"vars"` を真似れば OK。

---

## ✅ 2. `d1_databases`

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "shopping-db",
    "database_id": "d53ad56f-f646-44dc-8dbf-3d2d15d76973",
    "preview_database_id": "d53ad56f-f646-44dc-8dbf-3d2d15d76973"
  }
]
```

これは Cloudflare D1 データベースを `env.DB.prepare()` のようにバインディングする設定です。

**対応するモックコード:**

```ts
DB: {
  prepare: vi.fn().mockReturnValue({
    bind: vi.fn().mockReturnValue({
      first: vi.fn().mockResolvedValue(dummyUser),
      run: vi.fn().mockResolvedValue({ success: true }),
      all: vi.fn().mockResolvedValue({ results: [] }),
    }),
  }),
},
```

🔎 **ポイント**：

- 実行される `.prepare().bind().run()` のチェーンを模倣。
- `delete` や `select` に対応するため、`run`, `first`, `all` を用意。

---

## ✅ 3. `r2_buckets`

```jsonc
"r2_buckets": [
  {
    "binding": "R2_BUCKET",
    "bucket_name": "dev-bucket",
    "preview_bucket_name": "preview-bucket"
  }
]
```

これは Cloudflare R2（オブジェクトストレージ）バケットのバインディングです。

**対応するモックコード:**

```ts
R2_BUCKET: {
  get: vi.fn().mockResolvedValue(null),
  put: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
},
```

🔎 **ポイント**：

- `env.R2_BUCKET.get("filename")` のようにアクセスされる。
- 通常は `.get`, `.put`, `.delete` を実装すれば十分。

---

## ✅ 4. `kv_namespaces`

```jsonc
"kv_namespaces": [
  {
    "binding": "TEST_NAMESPACE",
    "id": "test-namespace-id"
  }
]
```

これは KV ストアの設定です。

**対応するモックコード:**

```ts
TEST_NAMESPACE: {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
},
```

🔎 **ポイント**：

- `env.TEST_NAMESPACE.get("some-key")` のように呼ばれる。
- `.get`, `.put`, `.delete` のモックで十分対応できます。

---

## ✅ 総合まとめ：`wrangler.jsonc` → `env` モック対応表

| wrangler.jsonc のキー     | モック `env` の対応コード                                 |
| ------------------------- | --------------------------------------------------------- |
| `vars.JWT_SECRET`         | `JWT_SECRET: "test-secret"`                               |
| `vars.JWT_ISSUER`         | `JWT_ISSUER: "kaikyou-shop-test"`                         |
| `vars.JWT_AUDIENCE`       | `JWT_AUDIENCE: "kaikyou-shop-users-test"`                 |
| `vars.ENVIRONMENT`        | `ENVIRONMENT: "test"`                                     |
| `vars.R2_PUBLIC_DOMAIN`   | `R2_PUBLIC_DOMAIN: "localhost:8787/assets"`               |
| `d1_databases[].binding`  | `DB: { prepare: vi.fn()... }`                             |
| `r2_buckets[].binding`    | `R2_BUCKET: { get, put, delete }`                         |
| `kv_namespaces[].binding` | `TEST_NAMESPACE: { get, put, delete }` //今回は使用しない |

---
