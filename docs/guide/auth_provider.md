# 状態管理 AuthProvider コンポーネント 1.0

**最小限の JWT 認証実装**に絞り、状態管理の基本機能だけに集中します。

### 究極に簡潔な AuthProvider 実装 (v1.0)

```typescript
// frontend/components/AuthProvider.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // 初期状態チェック（超簡易版）
  useEffect(() => {
    const token = localStorage.getItem("jwt");
    const userData = localStorage.getItem("user");
    if (token && userData) setUser(JSON.parse(userData));
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem("jwt", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
```

- `AuthProvider.tsx` コンポーネントの **詳しい解説**です。

---

## 🧭 概要

このコードは、Next.js（App Router 使用）で **JWT を使った簡易ログイン状態の管理**を行うための **認証コンテキスト（`AuthContext`）** を提供しています。

- JWT を `localStorage` に保存してユーザー状態を保持
- ログイン・ログアウト処理を定義
- アプリケーション全体で `useAuth()` フックを使ってユーザー情報にアクセス可能

---

## 🧩 各部分の詳細

### 1. `"use client";`

```ts
"use client";
```

- これは **Next.js App Router** 特有のディレクティブです。
- `AuthProvider.tsx` を **クライアントコンポーネントとして扱う**ことを明示しています。
- `localStorage` や `useState` などのブラウザ API を使うために必要。

---

### 2. `User` インターフェース

```ts
interface User {
  id: string;
  email: string;
  name: string;
}
```

- ログインユーザー情報の構造を定義。
- 必要に応じて `role`, `avatarUrl`, `createdAt` などを追加可能。

---

### 3. `AuthContextType`

```ts
interface AuthContextType {
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
}
```

- 認証状態を共有するためのコンテキストの構造。
- 状態変数 `user` と 2 つの関数 `login`, `logout` を提供。

---

### 4. `AuthContext` 作成

```ts
const AuthContext = createContext<AuthContextType | undefined>(undefined);
```

- React の Context を作成。`undefined` を初期値にして、未設定時のエラーを検出しやすくしています。

---

### 5. `AuthProvider` コンポーネント

```ts
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  ...
}
```

- 認証状態を子コンポーネントに共有する **Provider**。
- グローバルで `user`, `login`, `logout` を使用可能にします。

---

#### 5-1. 状態とルーターの定義

```ts
const [user, setUser] = useState<User | null>(null);
const router = useRouter();
```

- `user`: 現在ログインしているユーザー情報を保持。
- `router`: ページ遷移のために使用（ログアウト後の `/login` 遷移など）。

---

#### 5-2. 初回マウント時に状態復元

```ts
useEffect(() => {
  const token = localStorage.getItem("jwt");
  const userData = localStorage.getItem("user");
  if (token && userData) setUser(JSON.parse(userData));
}, []);
```

- クライアント側で **localStorage から JWT とユーザーデータを取得**。
- `user` にセットして、ログイン状態を復元。
- `[]` により初回マウント時のみ実行。

---

#### 5-3. `login` 関数

```ts
const login = (token: string, userData: User) => {
  localStorage.setItem("jwt", token);
  localStorage.setItem("user", JSON.stringify(userData));
  setUser(userData);
};
```

- JWT とユーザーデータを `localStorage` に保存し、`user` 状態を更新。
- サインイン成功時などにこの関数を呼び出します。

---

#### 5-4. `logout` 関数

```ts
const logout = () => {
  localStorage.removeItem("jwt");
  localStorage.removeItem("user");
  setUser(null);
  router.push("/login");
};
```

- localStorage のデータを削除。
- ユーザー状態を初期化（ログアウト）。
- `/login` ページへ遷移。

---

### 6. Context Provider の返却

```tsx
return (
  <AuthContext.Provider value={{ user, login, logout }}>
    {children}
  </AuthContext.Provider>
);
```

- 子コンポーネントに `AuthContext` の値（`user`, `login`, `logout`）を渡す。

---

### 7. `useAuth()` カスタムフック

```ts
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
```

- コンテキストを簡単に使うための **専用フック**。
- `AuthProvider` の外で使うとエラーを出してデバッグしやすくする工夫もあり。

---

## 🗂️ このコードの使い方

```tsx
// app/layout.tsx（App Routerの場合）

import { AuthProvider } from "@/components/AuthProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

---

```tsx
// 任意のコンポーネント
import { useAuth } from "@/components/AuthProvider";

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <>
      <p>Welcome, {user?.name}</p>
      <button onClick={logout}>Log out</button>
    </>
  );
};
```

---

## 🚨 注意点・改善ポイント

| ポイント                                      | 内容                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| ❗ `localStorage`の値は改ざんされる可能性あり | 実際の API リクエスト時には JWT を使ってサーバー側で検証する必要があります |
| 🔐 `JWT` は暗号化されていない                 | トークンには機密情報を含めず、署名だけで検証できる設計にしましょう         |
| ⛔ `AuthContext`の型チェックを厳格にしている  | フックを使う時に`Provider`の中で使う必要があることを明示しています         |

---

## ✅ 結論

このコードは、Next.js + JWT ベースのシンプルなログイン状態管理に適した作りです：

### 使い方サンプル

```typescript
// ログインページ
const LoginPage = () => {
  const { login } = useAuth();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/login", { method: "POST", body: ... });
    const { token, user } = await res.json();
    login(token, user);
  };
  // ...
};

// プロテクトページ
const Dashboard = () => {
  const { user } = useAuth();
  if (!user) return <div>ログインが必要です</div>;
  return <div>ようこそ {user.name}さん</div>;
};
```

### バックエンド対応ポイント（最小限）

```typescript
// Cloudflare Workers側 (login.ts)
export const loginHandler = async (c: Context) => {
  const { email, password } = await c.req.json();

  // 1. ユーザー検証（簡易版）
  const user = await c.env.DB.prepare(
    "SELECT id, email, name FROM users WHERE email = ? AND password_hash = ?"
  )
    .bind(email, hash(password))
    .first();

  if (!user) return c.json({ error: "認証失敗" }, 401);

  // 2. JWT発行（有効期限2時間）
  const token = await generateAuthToken(c.env, { userId: user.id }, "2h");

  return c.json({ token, user });
};
```

### この実装の特徴

1. **超軽量**：

   - 状態管理のみに特化（ログイン/ログアウト/ユーザー情報保持）
   - 余計なチェックや更新ロジックを排除

2. **即戦力**：

   - どのページからでも`useAuth`で即アクセス可能
   - ログイン状態に応じた簡単なリダイレクト処理

3. **拡張の下地**：
   - 後から CSRF 対策やトークン更新を追加可能
   - 型安全を維持したまま機能追加できる

### 注意点

- 最初は`localStorage`を使った簡易実装
- セキュリティ強化が必要になったら段階的に追加
- プロダクション環境では必ず HTTPS を適用

「動く最低限」を最優先したため、以下の機能は意図的に省略しています：

- トークン自動更新
- 細かいエラーハンドリング
- マルチタブ同期
- CSRF 対策

必要に応じて、これらの機能を後から追加していくことをおすすめします。まずはこのシンプルな実装で状態管理の基本フローを確立しましょう。
