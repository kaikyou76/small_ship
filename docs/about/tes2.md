# 設計男さんの API 設計

もちろんです！  
このスキーマをベースに、機能をすべて網羅した**RESTful API 設計書（エンドポイント一覧）**をお渡しします。  
構造は以下のカテゴリに分けて整理しています：

---

# ✅ API 一覧（`/api/`配下と想定）

## 1. 🔐 認証系

| メソッド | エンドポイント   | 内容                                      |
| -------- | ---------------- | ----------------------------------------- |
| `POST`   | `/auth/register` | 新規ユーザー登録（email, password, name） |
| `POST`   | `/auth/login`    | ログイン、トークン発行                    |
| `POST`   | `/auth/logout`   | ログアウト（トークン無効化）              |
| `GET`    | `/auth/me`       | ログインユーザー情報取得（トークン必須）  |

---

## 2. 👤 ユーザー管理

| メソッド | エンドポイント | 内容                               |
| -------- | -------------- | ---------------------------------- |
| `GET`    | `/users/:id`   | ユーザー情報取得（管理者のみ）     |
| `GET`    | `/users`       | 全ユーザー一覧（管理者のみ）       |
| `PUT`    | `/users/:id`   | ユーザー情報更新（本人 or 管理者） |
| `DELETE` | `/users/:id`   | ユーザー削除（管理者）             |

---

## 3. 🛒 商品（Products）

| メソッド | エンドポイント  | 内容                                           |
| -------- | --------------- | ---------------------------------------------- |
| `GET`    | `/products`     | 商品一覧（検索、カテゴリ、タグなどでフィルタ） |
| `GET`    | `/products/:id` | 商品詳細（画像・レビュー含む）                 |
| `POST`   | `/products`     | 商品作成（管理者）                             |
| `PUT`    | `/products/:id` | 商品更新（管理者）                             |
| `DELETE` | `/products/:id` | 商品削除（管理者）                             |

---

## 4. 🖼️ 商品画像

| メソッド | エンドポイント         | 内容                                |
| -------- | ---------------------- | ----------------------------------- |
| `POST`   | `/products/:id/images` | 画像アップロード（メイン/追加画像） |
| `DELETE` | `/images/:id`          | 画像削除（管理者）                  |

---

## 5. 🏷️ タグ

| メソッド | エンドポイント               | 内容                     |
| -------- | ---------------------------- | ------------------------ |
| `GET`    | `/tags`                      | タグ一覧                 |
| `POST`   | `/tags`                      | タグ作成（管理者）       |
| `POST`   | `/products/:id/tags`         | 商品にタグ付け（管理者） |
| `DELETE` | `/products/:id/tags/:tag_id` | 商品のタグ解除（管理者） |

---

## 6. 📂 カテゴリ

| メソッド | エンドポイント    | 内容                           |
| -------- | ----------------- | ------------------------------ |
| `GET`    | `/categories`     | 全カテゴリ一覧（階層構造対応） |
| `POST`   | `/categories`     | カテゴリ作成（管理者）         |
| `PUT`    | `/categories/:id` | カテゴリ名変更（管理者）       |
| `DELETE` | `/categories/:id` | カテゴリ削除（管理者）         |

---

## 7. 🛍️ カート

| メソッド | エンドポイント   | 内容                                 |
| -------- | ---------------- | ------------------------------------ |
| `GET`    | `/cart`          | カート取得（ログイン or セッション） |
| `POST`   | `/cart`          | カートに商品追加                     |
| `PUT`    | `/cart/:item_id` | 数量変更                             |
| `DELETE` | `/cart/:item_id` | 商品削除                             |

---

## 8. 📦 注文

| メソッド | エンドポイント       | 内容                               |
| -------- | -------------------- | ---------------------------------- |
| `POST`   | `/orders`            | 注文確定（カートから生成）         |
| `GET`    | `/orders`            | 自分の注文一覧（ログインユーザー） |
| `GET`    | `/orders/:id`        | 注文詳細（本人 or 管理者）         |
| `PUT`    | `/orders/:id/status` | ステータス更新（管理者）           |

---

## 9. ✍️ レビュー

| メソッド | エンドポイント          | 内容                           |
| -------- | ----------------------- | ------------------------------ |
| `POST`   | `/products/:id/reviews` | レビュー投稿（1 商品 1 回）    |
| `GET`    | `/products/:id/reviews` | 商品のレビュー一覧             |
| `DELETE` | `/reviews/:id`          | レビュー削除（本人 or 管理者） |

---

## 10. 💖 お気に入り

| メソッド | エンドポイント           | 内容                     |
| -------- | ------------------------ | ------------------------ |
| `GET`    | `/wishlists`             | 自分のお気に入り商品一覧 |
| `POST`   | `/wishlists/:product_id` | 商品をお気に入りに追加   |
| `DELETE` | `/wishlists/:product_id` | 商品をお気に入りから削除 |

---

## 11. 📝 管理ログ（Admin Logs）

| メソッド | エンドポイント | 内容                                 |
| -------- | -------------- | ------------------------------------ |
| `GET`    | `/admin/logs`  | 操作ログ一覧（管理者）               |
| `POST`   | `/admin/logs`  | 操作記録（自動記録 or 管理者処理時） |

---

# 🔐 認証・認可

- JWT ベースの認証（トークン）
- 管理者用 API は `role = 'admin'` をチェック
- ゲスト（session_id）対応のエンドポイントは `cart`, `products` など一部のみ

---

# ✅ まとめ

この API 設計で、以下を完全にカバーできます：

- 一般ユーザーのすべての操作（閲覧、購入、レビュー、お気に入り）
- 管理者の操作（商品・カテゴリ・画像・ログなど）
- ゲスト対応（カート保持など）

---

必要であれば、各 API エンドポイントごとの**リクエスト/レスポンス例**、**OpenAPI (Swagger) 形式**, **Cloudflare Workers 向けルーティング構造**などもご提供できます！

どこまでドキュメント化・実装化しましょうか？
