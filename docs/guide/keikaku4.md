# Cloudflare D1 データベースのセットアップ

✅ Cloudflare D1 データベースを作成します。

```sh
npx wrangler d1 create shopping-db

```

※注意

Cloudflare D1 データベースを作成した後、Miniflare（ローカルエミュレータ）もローカル環境で Cloudflare D1 データベースの振る舞いを模倣する準備を整えます。そのため、新にローカルでデータベースを作成する必要がないです。
![alt text](image-20.png)
backend\wrangler.jsonc
![alt text](image-21.png)

-　**_✅ Cloudflare D1 データベースにテーブルを作成します。_**

[cloud_schema.sql をそのまま使います](/guide/keikaku3#✅-cloud-schema-sql)

```sh
npx wrangler d1 execute shopping-db --remote --file=./db/cloud_schema.sql
```

実行成功
![alt text](image-31.png)
Cloudflare ダッシュボードで確認
![alt text](image-32.png)

- ✅ **_ローカルでテーブルを作成します。_**

  [cloud_schema.sql をコーピして local_schema.sql にリネームします](/guide/keikaku3#✅-cloud-schema-sql)

  ※注意:

  ローカルでは仮想テーブル・トリガーをサーポートできないため、cloud_schema.sql からテーブル・トリガーを含むテーブルと記載を削除して local_schema.sql としてローカルで流す必要があります。
  ![alt text](image-33.png)

```sh
npx wrangler d1 execute shopping-db --local --file=./db/local_schema.sql
```

実行成功
![alt text](image-34.png)

初期データを作成するためには、ショッピングサイトに必要なテーブル（`products`, `categories`, `images`, `users` など）の内容を決定し、それに基づいてデータを挿入する必要があります。

### `products` テーブル

製品情報を格納するテーブルです。例えば以下のような初期データを作成できます。

```sql
INSERT INTO products (id, name, description, price, category_id, image_id, created_at, updated_at)
VALUES
  (1, 'Laptop', 'A powerful laptop with 16GB RAM and 512GB SSD', 1200.00, 1, 1, NOW(), NOW()),
  (2, 'Smartphone', 'Latest model smartphone with 5G support', 800.00, 2, 2, NOW(), NOW()),
  (3, 'Wireless Mouse', 'Ergonomic wireless mouse with Bluetooth', 30.00, 3, 3, NOW(), NOW());
```

### `categories` テーブル

製品カテゴリを定義するためのテーブルです。例えば以下のような初期データを作成できます。

```sql
INSERT INTO categories (id, name, created_at, updated_at)
VALUES
  (1, 'Electronics', NOW(), NOW()),
  (2, 'Smartphones', NOW(), NOW()),
  (3, 'Accessories', NOW(), NOW());
```

### `images` テーブル

製品に関連付けられた画像を格納するテーブルです。以下のようにデータを作成できます。

```sql
INSERT INTO images (id, url, created_at, updated_at)
VALUES
  (1, 'https://example.com/images/laptop.jpg', NOW(), NOW()),
  (2, 'https://example.com/images/smartphone.jpg', NOW(), NOW()),
  (3, 'https://example.com/images/mouse.jpg', NOW(), NOW());
```

### `users` テーブル

ユーザー情報を格納するテーブルです。例えば以下のような初期データを作成できます。

```sql
INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
VALUES
  (1, 'John Doe', 'john.doe@example.com', 'hashedpassword123', NOW(), NOW()),
  (2, 'Jane Smith', 'jane.smith@example.com', 'hashedpassword456', NOW(), NOW());
```

### `orders` テーブル (オプション)

注文履歴を格納するテーブルです。以下のように作成できます。

```sql
INSERT INTO orders (id, user_id, total_amount, status, created_at, updated_at)
VALUES
  (1, 1, 1200.00, 'completed', NOW(), NOW()),
  (2, 2, 800.00, 'pending', NOW(), NOW());
```

### 初期データ挿入の手順

1. 上記の SQL 文を`local_schema.sql`に追記して実行します。
2. 例えば、`SELECT * FROM products;`を実行して、初期データが反映されているか確認します。

初期データは、ユーザーが実際に使用する前に、アプリケーションが正しく動作するか確認するために非常に重要です。

### 順番

1. **categories テーブル**

   - `products` テーブルのカテゴリを参照するため、まずはカテゴリ情報を定義する `categories` テーブルを作成します。

2. **products テーブル**

   - `categories` テーブルに依存しているため、次に `products` テーブルを作成します。

3. **images テーブル**

   - `products` テーブルに依存しており、画像が製品に関連するため、`products` の後に `images` を作成します。

4. **users テーブル**

   - `sessions` テーブルや `orders` テーブルが `users` を参照するため、`users` テーブルを先に作成します。

5. **orders テーブル**

   - `users` テーブルに依存しているので、`users` 作成後に `orders` テーブルを作成します。

6. **その他のテーブル（必要に応じて）**
   - `sessions` や `order_items`、`reviews` など、必要なテーブルを順番に作成します。

## 順番で初期データ実行の SQL 文

```sql
-- categories テーブル
INSERT INTO categories (id, name)
VALUES
  (1, 'Electronics'),
  (2, 'Smartphones'),
  (3, 'Accessories');

-- products テーブル
INSERT INTO products (id, name, description, price, category_id)
VALUES
  (1, 'Laptop', 'A powerful laptop with 16GB RAM and 512GB SSD', 1200, 1),
  (2, 'Smartphone', 'Latest model smartphone with 5G support', 800, 2),
  (3, 'Wireless Mouse', 'Ergonomic wireless mouse with Bluetooth', 30, 3);

-- images テーブル
INSERT INTO images (id, product_id, image_url)
VALUES
  (1, 1, 'https://example.com/images/laptop.jpg'),
  (2, 2, 'https://example.com/images/smartphone.jpg'),
  (3, 3, 'https://example.com/images/mouse.jpg');

-- users テーブル
INSERT INTO users (id, name, email, password_hash)
VALUES
  (1, 'John Doe', 'john.doe@example.com', 'hashedpassword123'),
  (2, 'Jane Smith', 'jane.smith@example.com', 'hashedpassword456');

-- orders テーブル
INSERT INTO orders (id, user_id, total_price, status)
VALUES
  (1, 1, 1200, 'completed'),
  (2, 2, 800, 'pending');

```

実行する

```sh
npx wrangler d1 execute shopping-db --local --file=./db/init_data.sql
```

実行成功
![alt text](image-22.png)

### まとめ

上記の順番に従って初期データとして挿入することで、アプリケーションが正しく動作する最低限のデータが揃えるようになります。

> ## 現時点での開発進捗

```text
kaikyou-shop/
├── frontend/                       # Next.js フロントエンド（App Router構成）
│   ├── app/                      # App Router対応ページ
│   │   ├── layout.tsx           # ルートレイアウト
│   │   ├── page.tsx             # 商品一覧ページ（旧 index.tsx）
│   │   ├── product/             # 動的ルーティング（商品詳細）
│   │   │   └── [id]/page.tsx    # 商品詳細ページ
│   │   ├── cart/                # カートページ
│   │   │   └── page.tsx
│   │   ├── checkout/            # チェックアウトページ
│   │   │   └── page.tsx
│   ├── components/              # 再利用可能な UI コンポーネント
│   ├── public/                  # 静的ファイル（画像など）
│   │   └── images/
│   ├── styles/                  # CSS, Tailwindなど
│   │   └── global.css
│   ├── utils/                   # フロント用ユーティリティ
│   │   └── api.ts
│   ├── .env.local               # 環境変数（APIエンドポイントなど）
│   ├── next.config.js          # Next.js 設定ファイル
│   └── tsconfig.json           # TypeScript 設定ファイル

├── backend/                       # Cloudflare Workers (APIサーバー)
│   ├── src/
│   │   ├── index.ts              # メインエントリーポイント
│   │   ├── routes/              # エンドポイントごとのAPI
│   │   │   ├── products.ts      # 商品取得API
│   │   │   ├── cart.ts          # カート操作API
│   ├── db/                      # D1スキーマやマイグレーション
│   │   ├── schema.sql
│   ├── wrangler.jsonc            # Cloudflare Workers の設定
│   ├── .env                     # DBのURLなど

├── README.md
└── package.json                  # ルート共通の依存管理（希望による）

```
