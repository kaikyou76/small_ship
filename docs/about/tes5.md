#### 已深度思考

> Okay, let me try to work through this. The user provided a database schema with various tables and wants each table explained in the same format as the initial example. Let me look at the initial example first to understand the format.
> The original example had tables like users, products, images, etc., each with fields, types, and notes. Then, the user provided another schema with more tables and modifications, such as adding roles to users, sessions, categories with parent_id, FTS for products, tags, cart_items with both user_id and session_id, orders with status, reviews, wishlists, admin_logs, and indexes.
> My task is to take each CREATE TABLE statement from the user-provided schema and create a table description similar to the first example. Each table should have columns listed with their types and notes, and any additional explanations like foreign keys, unique constraints, triggers, indexes, etc.
> Starting with the users table. The original had id, email, password, name, created_at. The new one adds a role column with default 'user'. So in the notes, I should mention the 'user' and 'admin' roles, the default, and other existing fields like password_hash instead of password. Also, the name is optional.
> Next, the sessions table. It has id, user_id, session_token, expires_at, user_agent, ip_address, created_at. The notes should explain the purpose of each field, the foreign key to users, and that session_token is unique.
> Categories have a parent_id for hierarchical structure. Need to note that null parent_id means top-level category.
> Products table seems similar to the original but with a category_id FK to categories. The notes should mention the stock and category relationship.
> The products_fts is a virtual table for full-text search. Need to explain it's using FTS5 and the triggers that sync data from products. The triggers (after insert, delete, update) need to be mentioned in the notes.
> Images table now has an is_main boolean flag to indicate the main image. So the notes should mention that default is 0 (false) and probably that only one image per product can be the main, though there's no explicit constraint here, just the column.
> Tags and product_tags are many-to-many. The notes should explain the unique constraint on tag names and the composite primary key for product_tags.
> Cart_items now allow either user_id or session_id to handle guest vs logged-in users. The unique constraints are per user/product or session/product. Also, the quantity default is 1.
> Orders have a status field with default 'pending'. Need to note possible values like 'shipped', etc.
> Order_items include price_at_purchase for historical tracking.
> Reviews have a rating between 1-5 and a unique constraint to prevent multiple reviews by the same user on the same product.
> Wishlists (or favorites) have a unique user-product pair.
> Admin_logs track admin actions, with target_type and target_id, and a foreign key to the users table (admin_id).
> Indexes are listed at the end. Each index's purpose (performance) and the columns involved should be mentioned.
> Now, I need to go through each CREATE TABLE statement and convert them into the table format provided. Make sure the notes are concise and cover all aspects, including constraints, defaults, FKs, unique, and any additional features like triggers or virtual tables.
> For example, the products_fts is a virtual table using FTS5, so the note should mention that it's for full-text search on name and description, content is from products table, and the triggers that keep it in sync. Each trigger (after insert, delete, update) is handled by inserting, deleting, or updating the FTS table accordingly.
> When explaining cart_items, the unique constraints on (user_id, product_id) and (session_id, product_id) ensure that a product can only be added once per user or session. Also, one of user_id or session_id must be present, but the table allows both to be null? Wait, the CREATE TABLE allows both user_id and session_id to be set? But the UNIQUE constraints are separate. Wait, looking at cart_items:
> UNIQUE(user_id, product_id),
> UNIQUE(session_id, product_id),
> But user_id and session_id can be null? Since in SQLite, UNIQUE constraints allow multiple NULLs. So, if a user is logged in, user_id is set, session_id is null. For a guest, session_id is set, user_id is null. The unique constraints ensure that for a given user or session, a product is only in the cart once. So in the notes, it should mention that either user_id or session_id is used, and the unique constraints prevent duplicates.
> The admin_logs table's action and target_type fields should have examples, like 'create_product', 'update_category', etc.
> The indexes are straightforward, each created to improve query performance on specific columns.
> Each of these points needs to be translated into the table format, matching the original example's style, with columns, types, and notes.
> Now, proceed to list each table one by one in the specified format.

以下に各テーブルの説明をフォーマットに沿って整理します：

### 💬 ユーザー（users）

| フィールド    | タイプ   | 説明                                                    |
| ------------- | -------- | ------------------------------------------------------- |
| id            | INTEGER  | PK、自動採番                                            |
| email         | TEXT     | ユニーク、必須                                          |
| password_hash | TEXT     | ハッシュ化済みパスワード                                |
| name          | TEXT     | オプション                                              |
| role          | TEXT     | ユーザー権限（'user' または 'admin'） デフォルト 'user' |
| created_at    | DATETIME | 作成日時（デフォルト現在時刻）                          |

---

### 💬 セッション（sessions）

| フィールド    | タイプ   | 説明                           |
| ------------- | -------- | ------------------------------ |
| id            | INTEGER  | PK、自動採番                   |
| user_id       | INTEGER  | users.id を参照                |
| session_token | TEXT     | ユニークなセッショントークン   |
| expires_at    | DATETIME | セッションの有効期限           |
| user_agent    | TEXT     | ユーザーのブラウザ情報         |
| ip_address    | TEXT     | ユーザーの IP アドレス         |
| created_at    | DATETIME | 作成日時（デフォルト現在時刻） |

---

### 💬 カテゴリ（categories）

| フィールド | タイプ  | 説明                             |
| ---------- | ------- | -------------------------------- |
| id         | INTEGER | PK、自動採番                     |
| name       | TEXT    | カテゴリ名（必須）               |
| parent_id  | INTEGER | 親カテゴリ ID（NULL なら大分類） |
|            |         | categories.id を参照             |

---

### 💬 商品（products）

| フィールド  | タイプ   | 説明                           |
| ----------- | -------- | ------------------------------ |
| id          | INTEGER  | PK、自動採番                   |
| name        | TEXT     | 商品名（必須）                 |
| description | TEXT     | 商品説明                       |
| price       | INTEGER  | 価格（単位：円、必須）         |
| stock       | INTEGER  | 在庫数（デフォルト 0）         |
| category_id | INTEGER  | categories.id を参照           |
| created_at  | DATETIME | 登録日時（デフォルト現在時刻） |

---

### 💬 商品全文検索（products_fts）

| フィールド       | タイプ | 説明                        |
| ---------------- | ------ | --------------------------- |
| （仮想テーブル） | FTS5   | 商品名と説明の全文検索用    |
| name             | TEXT   | 検索対象の商品名            |
| description      | TEXT   | 検索対象の商品説明          |
| （トリガー）     |        | products テーブルと自動同期 |

---

### 💬 商品画像（images）

| フィールド | タイプ   | 説明                             |
| ---------- | -------- | -------------------------------- |
| id         | INTEGER  | PK、自動採番                     |
| product_id | INTEGER  | products.id を参照               |
| image_url  | TEXT     | 画像 URL（必須）                 |
| alt_text   | TEXT     | アクセシビリティ用代替テキスト   |
| is_main    | BOOLEAN  | メイン画像フラグ（デフォルト 0） |
| created_at | DATETIME | 登録日時（デフォルト現在時刻）   |

---

### 💬 タグ（tags）

| フィールド | タイプ  | 説明                     |
| ---------- | ------- | ------------------------ |
| id         | INTEGER | PK、自動採番             |
| name       | TEXT    | タグ名（ユニーク、必須） |

---

### 💬 商品タグ（product_tags）

| フィールド  | タイプ  | 説明                   |
| ----------- | ------- | ---------------------- |
| product_id  | INTEGER | products.id を参照     |
| tag_id      | INTEGER | tags.id を参照         |
| （複合 PK） |         | 商品とタグの多対多対応 |

---

### 💬 カートアイテム（cart_items）

| フィールド       | タイプ   | 説明                                                       |
| ---------------- | -------- | ---------------------------------------------------------- |
| id               | INTEGER  | PK、自動採番                                               |
| user_id          | INTEGER  | users.id を参照（ログイン時）                              |
| session_id       | TEXT     | ゲスト用セッション ID                                      |
| product_id       | INTEGER  | products.id を参照                                         |
| quantity         | INTEGER  | 数量（デフォルト 1）                                       |
| created_at       | DATETIME | 登録日時（デフォルト現在時刻）                             |
| （ユニーク制約） |          | user_id+product_id または session_id+product_id の重複防止 |

---

### 💬 注文（orders）

| フィールド  | タイプ   | 説明                                                       |
| ----------- | -------- | ---------------------------------------------------------- |
| id          | INTEGER  | PK、自動採番                                               |
| user_id     | INTEGER  | users.id を参照                                            |
| total_price | INTEGER  | 合計金額                                                   |
| status      | TEXT     | 注文状態（'pending', 'shipped' など） デフォルト 'pending' |
| created_at  | DATETIME | 登録日時（デフォルト現在時刻）                             |

---

### 💬 注文明細（order_items）

| フィールド        | タイプ  | 説明                     |
| ----------------- | ------- | ------------------------ |
| id                | INTEGER | PK、自動採番             |
| order_id          | INTEGER | orders.id を参照         |
| product_id        | INTEGER | products.id を参照       |
| quantity          | INTEGER | 購入数量                 |
| price_at_purchase | INTEGER | 購入時価格（履歴保存用） |

---

### 💬 レビュー（reviews）

| フィールド       | タイプ   | 説明                                 |
| ---------------- | -------- | ------------------------------------ |
| id               | INTEGER  | PK、自動採番                         |
| user_id          | INTEGER  | users.id を参照                      |
| product_id       | INTEGER  | products.id を参照                   |
| rating           | INTEGER  | 評価（1〜5）                         |
| comment          | TEXT     | コメント                             |
| created_at       | DATETIME | 登録日時（デフォルト現在時刻）       |
| （ユニーク制約） |          | ユーザーと商品の組み合わせで重複禁止 |

---

### 💬 お気に入り（wishlists）

| フィールド       | タイプ   | 説明                                 |
| ---------------- | -------- | ------------------------------------ |
| id               | INTEGER  | PK、自動採番                         |
| user_id          | INTEGER  | users.id を参照                      |
| product_id       | INTEGER  | products.id を参照                   |
| created_at       | DATETIME | 登録日時（デフォルト現在時刻）       |
| （ユニーク制約） |          | ユーザーと商品の組み合わせで重複禁止 |

---

### 💬 管理ログ（admin_logs）

| フィールド  | タイプ   | 説明                                   |
| ----------- | -------- | -------------------------------------- |
| id          | INTEGER  | PK、自動採番                           |
| admin_id    | INTEGER  | users.id を参照（管理者）              |
| action      | TEXT     | 実行アクション（例: 'create_product'） |
| target_type | TEXT     | 操作対象タイプ（例: 'product'）        |
| target_id   | INTEGER  | 操作対象の ID                          |
| description | TEXT     | 操作の詳細説明                         |
| created_at  | DATETIME | 登録日時（デフォルト現在時刻）         |

---

### 🔎 インデックス一覧

- `idx_users_email`: ユーザーのメール検索高速化
- `idx_products_name`: 商品名検索の高速化
- `idx_products_category_id`: カテゴリ別商品検索の高速化
- `idx_cart_items_user_id`: ユーザー別カート検索
- `idx_orders_status`: ステータス別注文管理
- （その他各テーブルの主要フィールドにインデックス設定）
