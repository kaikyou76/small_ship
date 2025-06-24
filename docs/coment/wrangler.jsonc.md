# wrangler.jsonc 環境変数設定

`backend\wrangler.jsonc`

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "backend",
  "main": "src/worker.ts",
  "compatibility_date": "2025-04-18",

  // Observability 設定
  "observability": {
    "enabled": true,
    "head_sampling_rate": 1
  },

  // 共通設定
  "kv_namespaces": [
    {
      "binding": "TEST_NAMESPACE",
      "id": "test-namespace-id",
      "preview_id": "test-namespace-id"
    }
  ],
  "vars": {
    "JWT_SECRET": "local_dev_secret_do_not_use_in_prod",
    "JWT_ISSUER": "kaikyou-shop-dev",
    "JWT_AUDIENCE": "kaikyou-shop-users-dev",
    "ENVIRONMENT": "development",
    "R2_PUBLIC_DOMAIN": "localhost:8787/assets"
  },
  "r2_buckets": [
    {
      "binding": "R2_BUCKET",
      "bucket_name": "dev-bucket",
      "preview_bucket_name": "preview-bucket"
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

  "env": {
    "development": {
      "vars": {
        "JWT_SECRET": "local_dev_secret_do_not_use_in_prod",
        "JWT_ISSUER": "kaikyou-shop-dev",
        "JWT_AUDIENCE": "kaikyou-shop-users-dev",
        "ENVIRONMENT": "development",
        "R2_PUBLIC_DOMAIN": "localhost:8787/assets"
      },
      "r2_buckets": [
        {
          "binding": "R2_BUCKET",
          "bucket_name": "dev-bucket",
          "preview_bucket_name": "dev-bucket"
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
      "kv_namespaces": [
        {
          "binding": "TEST_NAMESPACE",
          "id": "test-namespace-id",
          "preview_id": "test-namespace-id"
        }
      ]
    },
    "preview": {
      "vars": {
        "JWT_SECRET": "local_preview_secret_do_not_use_in_prod",
        "JWT_ISSUER": "kaikyou-shop-preview",
        "JWT_AUDIENCE": "kaikyou-shop-users-preview",
        "ENVIRONMENT": "preview",
        "R2_PUBLIC_DOMAIN": "preview-assets.example.com"
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
      ],
      "kv_namespaces": [
        {
          "binding": "TEST_NAMESPACE",
          "id": "test-namespace-id"
        }
      ]
    },
    "production": {
      "vars": {
        "JWT_SECRET": "{{ JWT_SECRET_PRODUCTION }}",
        "JWT_ISSUER": "kaikyou-shop",
        "JWT_AUDIENCE": "kaikyou-shop-users",
        "ENVIRONMENT": "production",
        "R2_PUBLIC_DOMAIN": "pub-1713e92651fc463cba099b34f8bf5cb1.r2.dev"
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
      ],
      "kv_namespaces": [
        {
          "binding": "KAIKYOU_NAMESPACE",
          "id": "37516d1abd6f4207a988759d5ade1adc"
        }
      ]
    }
  }
}
```
