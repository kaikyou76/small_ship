## ダッシュボード（管理画面）

了解しました。Next.js 14 以降（App Router）構成で、ログイン後にロール（`user` または `admin`）に応じて：

- `user` は `/dashboard` にリダイレクト
- `admin` は `/admin` にリダイレクト

できるように、まずは以下の 2 ページを作成しましょう。

---

## ✅ `app/dashboard/page.tsx`

```tsx
// app/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">ユーザーダッシュボード</h1>
      <p>ようこそ！ここでは注文履歴やアカウント情報を確認できます。</p>
    </div>
  );
}
```

---

## ✅ `app/admin/page.tsx`

```tsx
// app/admin/page.tsx
export default function AdminPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">管理者ページ</h1>
      <p>管理者専用ダッシュボードです。商品やユーザーを管理できます。</p>
    </div>
  );
}
```

---

ありがとうございます。ログイン後、JWT で認証し、ユーザーのロール（管理者/一般ユーザー）に応じて `/admin` または `/dashboard` にリダイレクトする処理を、Next.js 側の `app/login/page.tsx` に実装します。

---

## ✅ 準備前提

- `/api/login`: ユーザー認証 → JWT トークン発行（レスポンスに含まれる）
- `/api/users/me`: トークンを付けてユーザー情報（ロール含む）取得
- クライアントでは `useRouter` でリダイレクト、`fetch` で API 通信

---

## ✅ `app/login/page.tsx` 実装例（簡易版）

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 1. ログインAPIにPOSTしてJWTを取得
      const loginRes = await fetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!loginRes.ok) {
        throw new Error("ログインに失敗しました");
      }

      const { token } = await loginRes.json();

      // 2. ローカルストレージなどに保存（本番ではHttpOnly Cookie推奨）
      localStorage.setItem("token", token);

      // 3. JWTを使ってユーザー情報を取得
      const userRes = await fetch("/api/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!userRes.ok) {
        throw new Error("ユーザー情報の取得に失敗しました");
      }

      const user = await userRes.json();

      // 4. ロールに応じて遷移
      if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "ログインエラー");
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">ログイン</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
        />
        {error && <p className="text-red-600">{error}</p>}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          ログイン
        </button>
      </form>
    </div>
  );
}
```

---

## 🔐 備考（今後）

- `token` を **localStorage に保存するのは開発用**。本番では `HttpOnly Cookie` に移行すべき。
- `/api/users/me` から返される JSON には最低限 `{ role: "admin" | "user" }` を含めてください。
- `router.push()` でルーティング完了後、自動的に各ページが表示されます。

---

次に、`/api/login` や `/api/users/me` の Next.js 側ルーティング（`app/api`）とバックエンドの連携部分を実装しますか？
