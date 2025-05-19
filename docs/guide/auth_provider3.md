# 状態管理 AuthProvider コンポーネント 3.0

`AuthProvider.tsx` をさらに拡張して段階的に分けて実装していきます。以下に、**初段階的な実装ステップ**です。

## ✅ 全体の目的を先に確認

この `AuthProvider.tsx` の目的は：

1. ログイン状態（`isLoggedIn`）と現在のユーザー（`currentUser`）の管理
2. JWT トークンを `localStorage` で保持し、認証チェックを行う
3. ログイン・ログアウト後のリダイレクト制御
4. アプリ全体で `useAuth()` という簡単なフックで状態取得できるようにする

---

## 🪜 ステップごとの実装手順

---

### ### 🔹 ステップ 1：最小限のコンテキストを作る

```tsx
// AuthProvider.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  currentUser: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  return (
    <AuthContext.Provider value={{ isLoggedIn, currentUser }}>
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

✅ **この時点でできること**：

- ログイン状態とユーザー情報をコンテキストで共有できる。
- アプリの `_app.tsx` や `layout.tsx` で `<AuthProvider>` で囲めば OK。

---

### ### 🔹 ステップ 2：ログイン状態を localStorage から読み込む

```tsx
import { useEffect } from "react";

// ...省略（上と同じ）

useEffect(() => {
  const token = localStorage.getItem("jwtToken");
  const userData = localStorage.getItem("user");
  if (token && userData) {
    setIsLoggedIn(true);
    setCurrentUser(JSON.parse(userData));
  }
}, []);
```

✅ **この時点でできること**：

- ページ読み込み時にログイン状態を復元。

---

### ### 🔹 ステップ 3：`clearAuth()` や `logout()` の処理を追加

```tsx
const clearAuth = () => {
  localStorage.removeItem("jwtToken");
  localStorage.removeItem("user");
  setIsLoggedIn(false);
  setCurrentUser(null);
};

const logout = async () => {
  clearAuth();
  // TODO: APIでサーバー側ログアウト処理が必要なら追加
};
```

✅ **この時点でできること**：

- ユーザーのログアウト処理が動く。

---

### ### 🔹 ステップ 4：`checkAuth()` 関数で JWT の有効期限を確認

```tsx
const checkAuth = async () => {
  const token = localStorage.getItem("jwtToken");
  const userData = localStorage.getItem("user");

  if (!token || !userData) {
    clearAuth();
    return;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp * 1000 < Date.now()) {
      clearAuth();
      return;
    }
    setIsLoggedIn(true);
    setCurrentUser(JSON.parse(userData));
  } catch (err) {
    console.error("トークンエラー", err);
    clearAuth();
  }
};
```

✅ **この時点でできること**：

- トークンが期限切れならログアウトされる。

---

### ### 🔹 ステップ 5：useEffect で初回に checkAuth() を呼び出す

```tsx
useEffect(() => {
  checkAuth();
}, []);
```

---

### ### 🔹 ステップ 6：`AuthContext` の型を拡張

```tsx
interface AuthContextType {
  isLoggedIn: boolean;
  currentUser: User | null;
  clearAuth: () => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}
```

そして `value={{ isLoggedIn, currentUser, clearAuth, checkAuth, logout }}` に変更。

---

## ✅ 最終目標の形がステップ 6 のような完成版です。

---

```tsx
// frontend/components/AuthProvider.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
}

interface AuthContextType {
  currentUser: User | null;
  isLoggedIn: boolean;
  clearAuth: () => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  // 初期状態チェック（超簡易版）
  useEffect(() => {
    checkAuth();
  }, []);

  const clearAuth = useCallback(() => {
    console.log("認証情報をクリア");
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setCurrentUser(null);
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("jwtToken");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      clearAuth();
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp * 1000 < Date.now()) {
        clearAuth();
        return;
      }
      setIsLoggedIn(true);
      setCurrentUser(JSON.parse(userData));
    } catch (err) {
      console.error("トークンエラー", err);
      clearAuth();
    }
  };

  const logout = async () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{ currentUser, isLoggedIn, clearAuth, checkAuth, logout }}
    >
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

---

## 🧩 サンプル構成例（`pages/_app.tsx` または `layout.tsx`）

```tsx
import { AuthProvider } from "@/components/AuthProvider";

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
```

---

ご希望あれば、**ステップ 1 から順に一緒に実装していく**ことも可能です！
次に進めたいステップがあれば教えてください。
