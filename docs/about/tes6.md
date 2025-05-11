以下に、提供されたスキーマを各テーブルごとに説明します。フォーマットは指定通りに統一しています。

> 💬 ユーザー（users）

|        Field         |     Type    |                          Notes                          |
|----------------------|-------------|--------------------------------------------------------|
| id                   | INTEGER     | PK, auto increment                                     |
| email                | TEXT        | Unique, Not null                                       |
| password_hash        | TEXT        | ハッシュ化されたパスワード                              |
| name                 | TEXT        | Optional                                               |
| role                 | TEXT        | ユーザーロール（'user' or 'admin'）、デフォルト 'user' |
| created_at           | DATETIME    | Default now                                            |

> 💬 セッション（sessions）

|      Field      |   Type   |                Notes                |
|-----------------|----------|-------------------------------------|
| id              | INTEGER  | PK                                  |
| user_id         | INTEGER  | FK → users(id)                      |
| session_token   | TEXT     | Unique                              |
| expires_at      | DATETIME | セッション有効期限                  |
| user_agent      | TEXT     | ユーザーエージェント情報（オプション）|
| ip_address      | TEXT     | IPアドレス（オプション）            |
| created_at      | DATETIME | Default now                         |

> 💬 カテゴリ（categories）

|     Field     |   Type   |                   Notes                   |
|---------------|----------|-------------------------------------------|
| id            | INTEGER  | PK                                        |
| name          | TEXT     | Not null                                  |
| parent_id     | INTEGER  | 親カテゴリID（nullなら大分類）            |
|               |          | FK → categories(id)（自己参照）           |

> 💬 商品（products）

|      Field      |   Type   |         Notes          |
|-----------------|----------|------------------------|
| id              | INTEGER  | PK                     |
| name            | TEXT     | NOT NULL               |
| description     | TEXT     | 商品説明                |
| price           | INTEGER  | NOT NULL（単位：円など）|
| stock           | INTEGER  | 在庫数（デフォルト0）    |
| category_id     | INTEGER  | FK → categories(id)     |
| created_at      | DATETIME | Default now            |

> 💬 商品FTS（products_fts）

|     Field     |   Type   |              Notes              |
|---------------|----------|---------------------------------|
| rowid         | INTEGER  | products.idと同期               |
| name          | TEXT     | 全文検索用（products.name）     |
| description   | TEXT     | 全文検索用（products.description）|

> 💬 商品画像（images）

|     Field     |   Type   |                   Notes                    |
|---------------|----------|--------------------------------------------|
| id            | INTEGER  | PK                                         |
| product_id    | INTEGER  | FK → products.id                           |
| image_url     | TEXT     | Not null                                   |
| alt_text      | TEXT     | 代替テキスト（アクセシビリティ対応）       |
| is_main       | BOOLEAN  | メイン画像フラグ（デフォルト0）            |
| created_at    | DATETIME | Default now                                |

> 💬 タグ（tags）

|     Field     |   Type   |         Notes         |
|---------------|----------|-----------------------|
| id            | INTEGER  | PK                    |
| name          | TEXT     | Not null, Unique      |

> 💬 商品タグ（product_tags）

|     Field     |   Type   |         Notes         |
|---------------|----------|-----------------------|
| product_id    | INTEGER  | FK → products(id)     |
| tag_id        | INTEGER  | FK → tags(id)         |
|               |          | 複合PK                |

> 💬 カートアイテム（cart_items）

|     Field     |   Type   |                     Notes                     |
|---------------|----------|-----------------------------------------------|
| id            | INTEGER  | PK                                            |
| user_id       | INTEGER  | FK → users(id)（null可）                      |
| session_id    | TEXT     | ゲスト用セッションID（null可）                |
| product_id    | INTEGER  | FK → products(id)                             |
| quantity      | INTEGER  | デフォルト1                                   |
| created_at    | DATETIME | Default now                                   |
|               |          | UNIQUE(user_id, product_id)またはUNIQUE(session_id, product_id)|

> 💬 注文（orders）

|     Field     |   Type   |             Notes             |
|---------------|----------|-------------------------------|
| id            | INTEGER  | PK                            |
| user_id       | INTEGER  | FK → users(id)                |
| total_price   | INTEGER  | Not null                      |
| status        | TEXT     | デフォルト'pending'           |
| created_at    | DATETIME | Default now                   |

> 💬 注文アイテム（order_items）

|     Field     |   Type   |                Notes                 |
|---------------|----------|--------------------------------------|
| id            | INTEGER  | PK                                   |
| order_id      | INTEGER  | FK → orders(id)                      |
| product_id    | INTEGER  | FK → products(id)                    |
| quantity      | INTEGER  | Not null                             |
| price_at_purchase | INTEGER | 購入時の価格（履歴保存用）           |

> 💬 レビュー（reviews）

|     Field     |   Type   |                Notes                 |
|---------------|----------|--------------------------------------|
| id            | INTEGER  | PK                                   |
| user_id       | INTEGER  | FK → users(id)                       |
| product_id    | INTEGER  | FK → products(id)                    |
| rating        | INTEGER  | 1〜5の評価                           |
| comment       | TEXT     | オプション                           |
| created_at    | DATETIME | Default now                          |
|               |          | UNIQUE(user_id, product_id)          |

> 💬 お気に入り（wishlists）

|     Field     |   Type   |                Notes                 |
|---------------|----------|--------------------------------------|
| id            | INTEGER  | PK                                   |
| user_id       | INTEGER  | FK → users(id)                       |
| product_id    | INTEGER  | FK → products(id)                    |
| created_at    | DATETIME | Default now                          |
|               |          | UNIQUE(user_id, product_id)          |

> 💬 管理ログ（admin_logs）

|     Field     |   Type   |                Notes                 |
|---------------|----------|--------------------------------------|
| id            | INTEGER  | PK                                   |
| admin_id      | INTEGER  | FK → users(id)                       |
| action        | TEXT     | 実行されたアクション（例: 'create_product'）|
| target_type   | TEXT     | 対象タイプ（例: 'product'）          |
| target_id     | INTEGER  | 対象ID                               |
| description   | TEXT     | オプション                           |
| created_at    | DATETIME | Default now                          |

> 💬 インデックス

|          Index名          |            対象テーブル・カラム            |
|---------------------------|--------------------------------------------|
| idx_users_email           | users(email)                               |
| idx_products_name         | products(name)                             |
| idx_products_description  | products(description)                      |
| idx_products_category_id  | products(category_id)                      |
| idx_images_product_id     | images(product_id)                         |
| idx_product_tags_tag_id   | product_tags(tag_id)                       |
| idx_product_tags_product_id| product_tags(product_id)                  |
| idx_cart_items_user_id    | cart_items(user_id)                        |
| idx_cart_items_session    | cart_items(session_id)                     |
| idx_orders_user_id        | orders(user_id)                            |
| idx_orders_status         | orders(status)                             |
| idx_order_items_order_id  | order_items(order_id)                      |
| idx_sessions_user_id      | sessions(user_id)                          |
| idx_categories_parent_id  | categories(parent_id)                      |
| idx_reviews_user_id       | reviews(user_id)                           |
| idx_reviews_product_id    | reviews(product_id)                        |
| idx_wishlists_user_id     | wishlists(user_id)                         |
| idx_admin_logs_admin_id   | admin_logs(admin_id)                       |