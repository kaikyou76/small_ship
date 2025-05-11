# ✅ バックエンドのルート設定

- `backend/tsconfig.json` に相対パス (../../) の多用を防げるために、src/ ディレクトリをルートとして扱う
  ![alt text](image-3.png)

### 2.曖昧な書き方を直す

- `"outDir": ""`は非推薦
  ![alt text](image-4.png)

### 3.コンパイル対象ディレクトリの追加

src 配下のすべてのファイル（.ts, .json, .md, .js など）を型チェックやコンパイルの対象に入れるように追加する
![alt text](image-6.png)
