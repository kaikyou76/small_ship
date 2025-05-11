```
…or create a new repository on the command line
echo "# ship-ship" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/kaikyou76/ship-ship.git
git push -u origin main
…or push an existing repository from the command line
git remote add origin https://github.com/kaikyou76/ship-ship.git
git branch -M main
git push -u origin main
```

```
…or push an existing repository from the command line
git remote add origin https://github.com/kaikyou76/ship-ship.git
git branch -M main
git push -u origin main
```

Windows 環境で **`ship-ship` 単一リポジトリ内で `frontend`（Next.js）と `backend`（Cloudflare Workers）を管理** しつつ、**Vercel にフロントエンドのみをデプロイ** する構成の手順を説明します。

---

## 📂 ディレクトリ構造（目標）

```
ship-ship/
├── frontend/      # Next.jsプロジェクト（Vercelでデプロイ）
│   ├── app/
│   ├── package.json
│   └── vercel.json  # Vercel設定
├── backend/       # Cloudflare Workersプロジェクト
│   ├── src/
│   └── package.json
└── .git/          # 単一リポジトリ
```

---

## 🛠️ 手順（Windows 対応）

### 1. **リポジトリの初期化**

```powershell
# ship-ship ディレクトリに移動
cd path\to\ship-ship

# Git初期化（既存の.gitがある場合は削除）
rm -r -force .git
git init

# 全ファイルをステージング
git add .

# 初期コミット
git commit -m "初期コミット"
```

### 2. **GitHub リポジトリと接続**

```powershell
# リモートリポジトリを追加
git remote add origin https://github.com/kaikyou76/ship-ship.git

# メインブランチを設定
git branch -M main

# プッシュ（強制プッシュが必要な場合）
git push -u -f origin main
```

---

### 3. **Vercel 向け設定（フロントエンドのみデプロイ）**

[設定説明](/coment/vercel_json)

#### `frontend/vercel.json` を作成

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

#### Vercel でプロジェクトをインポート

1. [Vercel ダッシュボード](https://vercel.com/) にログイン
2. **「Add New」→「Project」** を選択

---

## 🚀 **Vercel デプロイ続きの手順**

### 4. **Vercel プロジェクト設定画面の詳細**

1. **「Import Project」画面** で以下を設定:

   - **GitHub リポジトリ**: `ship-ship` リポジトリを選択
   - **Project Name**: 自動入力されます（必要に応じて変更可）
   - **Root Directory**: `frontend` に手動で変更
     （※ **「frontend」と直接入力** する必要があります）

2. **「Framework Preset」**

   - Next.js が自動検出されるはずです。されない場合は手動で選択。

3. **Environment Variables (環境変数)**
   - フロントエンドで必要な環境変数（例: `NEXT_PUBLIC_API_URL`）がある場合、ここで追加。

---

### 5. **「Deploy」ボタンをクリック**

- Vercel が自動で以下を実行:
  1. `frontend/package.json` を検出
  2. `npm install` → `npm run build` を実行
  3. デプロイ完了後、**本番 URL が発行**されます（例: `https://ship-ship.vercel.app`）

---

### 6. **デプロイ後の確認**

#### ✅ 正常にデプロイされたかチェック:

1. Vercel ダッシュボードで **「Logs」タブ** を開き、エラーがないか確認。
2. 発行された URL にアクセスし、Next.js アプリが表示されるかテスト。

#### 🔧 もし失敗する場合:

- **よくある原因と解決策**:
  - **`Root Directory` の指定ミス**
    → プロジェクト設定で `frontend` に再度確認。
  - **ビルドコマンドの不足**
    → `frontend/package.json` に `"build": "next build"` があるか確認。
  - **環境変数の未設定**
    → Vercel の「Settings」→「Environment Variables」で追加。

---

## ⚙️ **補足: 今後の開発フロー**

### フロントエンドを更新する場合

```powershell
# frontend ディレクトリで変更を加え、Gitにプッシュ
cd path\to\ship-ship\frontend
git add .
git commit -m "Update frontend"
git push origin main
```

→ Vercel が自動で**再デプロイ**を開始します（GitHub 連携時）。

### バックエンドを更新する場合

```powershell
# backend ディレクトリで変更を加え、プッシュ
cd path\to\ship-ship\backend
git add .
git commit -m "Update backend"
git push origin main
```

→ Cloudflare Workers 側で別途デプロイが必要です。

---

## 📌 **重要ポイント**

- **Vercel は `frontend` ディレクトリのみを監視**するため、`backend` の変更は影響しません。
- フロントエンドからバックエンドに API リクエストを送る場合、**CORS 設定**が必要になることがあります（Cloudflare Workers 側で対応）。

これで **Vercel へのデプロイが完了** します！ もしエラーが発生した場合は、具体的なエラーメッセージを教えてください。
