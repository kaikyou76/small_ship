# 設計女さんの API 設計

もちろんです！以下は、あなたの SQL スキーマに基づいた**機能を網羅する RESTful API 設計一覧**です（`/api/`をプレフィックスと仮定）。

---

## 🧑‍💼 ユーザー関連

| メソッド | エンドポイント  | 内容                         |
| -------- | --------------- | ---------------------------- |
| POST     | `/api/register` | ユーザー登録                 |
| POST     | `/api/login`    | ログイン（トークン発行）     |
| POST     | `/api/logout`   | ログアウト（セッション破棄） |
| GET      | `/api/users/me` | 自分のユーザー情報取得       |

---

## 📦 商品・カテゴリ関連

| メソッド | エンドポイント      | 内容                               |
| -------- | ------------------- | ---------------------------------- |
| GET      | `/api/products`     | 商品一覧（検索・カテゴリ絞込対応） |
| GET      | `/api/products/:id` | 商品詳細                           |
| POST     | `/api/products`     | 商品登録（管理者）                 |
| PUT      | `/api/products/:id` | 商品更新（管理者）                 |
| DELETE   | `/api/products/:id` | 商品削除（管理者）                 |

| メソッド | エンドポイント    | 内容                   |
| -------- | ----------------- | ---------------------- |
| GET      | `/api/categories` | カテゴリ一覧           |
| POST     | `/api/categories` | カテゴリ登録（管理者） |

---

## 🖼️ 画像関連

| メソッド | エンドポイント                  | 内容                 |
| -------- | ------------------------------- | -------------------- |
| POST     | `/api/products/:id/images`      | 商品画像アップロード |
| DELETE   | `/api/images/:imageId`          | 画像削除（管理者）   |
| PATCH    | `/api/images/:imageId/set-main` | メイン画像に設定     |

---

## 🛒 カート・注文関連

| メソッド | エンドポイント      | 内容                             |
| -------- | ------------------- | -------------------------------- |
| GET      | `/api/cart`         | カート一覧（ユーザー or ゲスト） |
| POST     | `/api/cart`         | 商品追加                         |
| PUT      | `/api/cart/:itemId` | 数量変更                         |
| DELETE   | `/api/cart/:itemId` | カートアイテム削除               |

| メソッド | エンドポイント    | 内容         |
| -------- | ----------------- | ------------ |
| POST     | `/api/orders`     | 注文確定     |
| GET      | `/api/orders`     | 注文履歴取得 |
| GET      | `/api/orders/:id` | 注文詳細     |

---

## ✨ タグ・検索

| メソッド | エンドポイント          | 内容                     |
| -------- | ----------------------- | ------------------------ |
| GET      | `/api/tags`             | タグ一覧取得             |
| GET      | `/api/search?q=keyword` | 商品全文検索（FTS 対応） |

---

## ⭐ レビュー・ウィッシュリスト

| メソッド | エンドポイント              | 内容                     |
| -------- | --------------------------- | ------------------------ |
| GET      | `/api/products/:id/reviews` | 商品レビュー一覧         |
| POST     | `/api/products/:id/reviews` | レビュー投稿             |
| DELETE   | `/api/products/:id/reviews` | レビュー削除（本人のみ） |

| メソッド | エンドポイント             | 内容               |
| -------- | -------------------------- | ------------------ |
| GET      | `/api/wishlist`            | お気に入り一覧     |
| POST     | `/api/wishlist/:productId` | お気に入り追加     |
| DELETE   | `/api/wishlist/:productId` | お気に入りから削除 |

---

## 🔐 管理者機能・操作ログ

| メソッド | エンドポイント          | 内容               |
| -------- | ----------------------- | ------------------ |
| GET      | `/api/admin/logs`       | 操作ログ一覧       |
| GET      | `/api/admin/orders`     | 全注文確認         |
| PUT      | `/api/admin/orders/:id` | 注文ステータス更新 |

---

必要であれば、この API 設計をベースに**OpenAPI 仕様（Swagger）形式**で出力することもできます。  
また、Next.js + Cloudflare Workers 向けのエンドポイント実装例も作れます。ご希望ありますか？
