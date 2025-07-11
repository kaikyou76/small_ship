## 📝 ショッピングサイト：要件定義（初期版）

---

### 🔐 ユーザー機能

| ID  | 機能名               | 説明                                           |
| --- | -------------------- | ---------------------------------------------- |
| U01 | ユーザー登録         | 名前、メール、パスワードなどでアカウント作成。 |
| U02 | ログイン／ログアウト | 登録済みユーザーが認証してログイン。           |
| U03 | プロフィール編集     | ユーザー名、住所、パスワード変更など。         |
| U04 | 配送先住所の管理     | 複数住所の登録・選択が可能。                   |
| U05 | 購入履歴の閲覧       | 過去の注文履歴を一覧表示。                     |

---

### 🛍️ 商品機能

| ID  | 機能名                     | 説明                                     |
| --- | -------------------------- | ---------------------------------------- |
| P01 | 商品一覧表示               | 全商品またはカテゴリ別に商品を一覧表示。 |
| P02 | 商品詳細表示               | 画像、説明、価格、在庫などの詳細情報。   |
| P03 | 商品検索／絞り込み         | キーワード、価格帯、タグなどで検索。     |
| P04 | 商品カテゴリ管理（管理者） | カテゴリの作成・編集・削除（管理者用）。 |
| P05 | 商品の在庫管理（管理者）   | 在庫の確認・更新（管理者用）。           |

---

### 🧺 カート機能

| ID  | 機能名             | 説明                                       |
| --- | ------------------ | ------------------------------------------ |
| C01 | カートに商品を追加 | ログイン中のユーザーのカートに商品を追加。 |
| C02 | カート内商品の編集 | 数量の変更・削除など。                     |
| C03 | カートを注文に変換 | 注文確定時にカートから注文情報を作成。     |

---

### 📦 注文機能

| ID  | 機能名                       | 説明                                         |
| --- | ---------------------------- | -------------------------------------------- |
| O01 | 注文確定                     | 配送先、支払い方法を指定して注文確定。       |
| O02 | 注文履歴表示                 | 自分の注文の一覧・詳細を確認。               |
| O03 | 注文ステータス管理（管理者） | 発送準備中、発送済み、キャンセルなどを管理。 |

---

### 💳 支払い機能（簡易）

| ID  | 機能名             | 説明                                                         |
| --- | ------------------ | ------------------------------------------------------------ |
| S01 | 決済処理（ダミー） | 本番環境では Stripe や Pay.jp と連携。開発初期はモックで可。 |

---

### 🔧 管理者機能（Admin）

| ID  | 機能名                 | 説明                                   |
| --- | ---------------------- | -------------------------------------- |
| A01 | 商品の登録・編集・削除 | 商品マスターの管理。                   |
| A02 | ユーザー管理           | 登録ユーザーの確認・無効化など。       |
| A03 | 注文状況の確認・対応   | ユーザーの注文を確認しステータス更新。 |

---

### 📋 補足情報

- 認証には `メール+パスワード` を基本に設計（将来的に OAuth 追加も可能）
- 住所・配送・在庫の扱いは簡易からスタートし、拡張可能な設計を目指す
- 商品画像は 1 つ以上登録可能とする（images テーブル）
- カテゴリ・タグは別テーブルに分けてリレーション設計

---

### ✅ 次のステップ

- [ ] この要件を元に **ER 図** を描く
- [ ] schema.sql の初期設計（テーブル定義）を行う
- [ ] API 設計に入る（GET/POST などのエンドポイント）

---
