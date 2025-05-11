# NavBar コンポーネント

バックエンドのコードを確認した上で、`NavBar`コンポーネントを正しく認証情報を取得・管理するように修正します。主な変更点は以下の通りです：

1. 認証状態をローカルステートだけでなく、Cookie や localStorage でも管理
2. バックエンドの`/api/users/me`エンドポイントを使用して認証状態を確認
3. ログアウト時にバックエンド API を呼び出す

以下が修正後のコードです：

```tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const NavBar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // 初期ロード時に認証状態を確認
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch("/api/users/me", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("認証状態の確認に失敗しました:", error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setIsLoggedIn(false);
        router.push("/");
      } else {
        console.error("ログアウトに失敗しました");
      }
    } catch (error) {
      console.error("ログアウト中にエラーが発生しました:", error);
    }
  };

  if (isLoading) {
    return (
      <nav className="bg-background text-foreground p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div className="animate-pulse h-6 w-24 bg-gray-200 rounded"></div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-background text-foreground p-4 shadow-md">
      <ul className="flex space-x-4">
        <li>
          <Link href="/" className="hover:text-blue-600">
            Home
          </Link>
        </li>
        <li>
          <Link href="/products" className="hover:text-blue-600">
            Products
          </Link>
        </li>
        {isLoggedIn ? (
          <li>
            <button
              onClick={handleLogout}
              className="hover:text-blue-600"
              type="button"
            >
              Logout
            </button>
          </li>
        ) : (
          <>
            <li>
              <Link href="/login" className="hover:text-blue-600">
                Login
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-blue-600">
                Register
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default NavBar;
```

### 主な改善点

1. **認証状態の永続化**:

   - `useEffect`で初期ロード時に`/api/users/me`を呼び出し、認証状態を確認
   - Cookie を使用するため`credentials: 'include'`を設定

2. **ログアウト処理**:

   - バックエンドの`/api/logout`を呼び出してセッションを破棄
   - 成功後にホームページにリダイレクト

3. **ローディング状態の管理**:

   - 認証状態確認中のローディング表示を追加
   - ユーザー体験を向上させるため、スケルトンスクリーンを表示

4. **エラーハンドリング**:

   - API 呼び出し時のエラーを適切にキャッチして処理

5. **ルーティング**:
   - `useRouter`を使用してログアウト後のリダイレクトを実装

### 追加で考慮すべき点

1. **トークン更新**:

   - トークンの有効期限が近づいたら自動更新する処理を追加すると良い

2. **グローバル状態管理**:

   - 認証状態を React Context や Redux で管理すると、アプリ全体で状態を共有できる

3. **CSRF 対策**:

   - 重要な操作には CSRF トークンを追加する

4. **セッション管理**:
   - セッションタイムアウト時の処理を追加

この修正により、NavBar コンポーネントはバックエンドの認証システムと正しく連携し、ユーザーの認証状態を適切に管理できるようになります。

## GP コメント

この `NavBar` コンポーネントの実装は、**ユーザーがログインしているかどうかをクライアント側で判断し、それに応じてナビゲーションの表示を切り替えるための処理**を担っています。具体的には、次のような役割を果たします：

---

### ✅ **主な役割**

#### 1. `useEffect` でログイン状態をサーバーから取得

```tsx
useEffect(() => {
  const checkAuthStatus = async () => {
    const response = await fetch('/api/users/me', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    ...
  };

  checkAuthStatus();
}, []);
```

- **目的**: ページの初期ロード時に `/api/users/me` エンドポイントを呼び出し、ログイン済みかどうかを確認。
- `credentials: 'include'` により、**Cookie（例：JWT）を自動送信**してサーバーがユーザー情報を判断。
- ログインしていれば `isLoggedIn` を `true` に設定。

---

#### 2. ログアウト処理の実装

```tsx
const handleLogout = async () => {
  await fetch('/api/logout', { method: 'POST', ... });
  setIsLoggedIn(false);
  router.push('/');
};
```

- サーバーに `/api/logout` を POST し、ログアウト処理を実行。
- 成功後、`isLoggedIn` を `false` にし、トップページへリダイレクト。

---

#### 3. 認証状態に応じたナビゲーション UI の表示

```tsx
{
  isLoggedIn ? (
    <button onClick={handleLogout}>Logout</button>
  ) : (
    <>
      <Link href="/login">Login</Link>
      <Link href="/register">Register</Link>
    </>
  );
}
```

- **ログイン済み：** 「Logout」ボタンを表示。
- **未ログイン：** 「Login」「Register」リンクを表示。

---

#### 4. 認証状態確認中のローディング表示

```tsx
if (isLoading) {
  return <div className="animate-pulse">...</div>;
}
```

- サーバーへの `/api/users/me` リクエストが完了するまではローディング表示を出す。
- 誤ってログイン/ログアウト UI を表示しないように。

---

### 🔁 認証の流れ（例）

1. ページ初期表示（`NavBar`マウント）
2. `useEffect` → `/api/users/me` にリクエスト → Cookie で認証状態を判定
3. 状態に応じて UI を切り替え
4. Logout クリック時 → `/api/logout` へ POST → 状態を `false` に更新 & リダイレクト

---

### 🔐 本番 API と連携するメリット

- クライアント側で状態をローカルに持つだけでなく、**実際の認証状態と整合性を保つ**ことができる。
- セキュリティ的にも「クッキー + サーバー判定」で安全。

---

必要であれば、`/api/users/me` や `/api/logout` の Cloudflare Workers 側実装もあわせて確認できますが、いかがですか？

![alt text](image-3.png)
