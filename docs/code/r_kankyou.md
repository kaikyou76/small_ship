Render（[https://render.com）で環境変数を設定する方法は以下の通りです。](https://render.com）で環境変数を設定する方法は以下の通りです。)

---

### ✅ 1. **Render ダッシュボードにログイン**

[https://dashboard.render.com/](https://dashboard.render.com/) にアクセスし、アカウントにログインします。

---

### ✅ 2. **対象サービスを選択**

デプロイ済みのプロジェクト（Web Service、Background Worker など）をクリックします。

---

### ✅ 3. **環境変数（Environment）を設定する**

1. 左側メニューから **"Environment"** または **"Environment Variables"** をクリックします。
2. **Add Environment Variable** をクリック。
3. `Key` に環境変数名（例: `NEXT_PUBLIC_API_URL`）を入力。
4. `Value` にその値を入力。
5. 必要な分だけ追加して **Save Changes** を押します。

---

### ✅ 4. **再デプロイ（必要に応じて）**

変更が反映されるように、Render が自動的に再デプロイするか、手動で再起動してください。

---

### 📌 補足

- `NEXT_PUBLIC_` で始まる環境変数は、Next.js ではクライアント側でも参照されます。
- `NODE_ENV` はデフォルトで Render 側が `"production"` として設定されているので、明示的に設定する必要は通常ありません。

---
