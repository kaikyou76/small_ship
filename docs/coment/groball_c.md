# グローバル状態管理

### 1. `layout.tsx`の修正

```tsx
// app/layout.tsx
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

### 2. `AuthContext`の分離

`NavBar`コンポーネントから認証ロジックを分離し、専用のコンテキストファイルを作成：

```tsx
// context/AuthContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

type AuthState = "loading" | "authenticated" | "unauthenticated";

interface AuthContextType {
  authState: AuthState;
  currentUser: User | null;
  verifyAuth: () => Promise<void>;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiUrl) throw new Error("APIエンドポイントが設定されていません");

  const storage = {
    get: <T,>(key: string): T | null => {
      if (typeof window === "undefined") return null;
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : null;
    },
    set: (key: string, value: unknown) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify(value));
      }
    },
    remove: (key: string) => {
      if (typeof window !== "undefined") {
        localStorage.removeItem(key);
      }
    },
  };

  const clearAuth = useCallback(() => {
    storage.remove("token");
    storage.remove("user");
    setAuthState("unauthenticated");
    setCurrentUser(null);
  }, []);

  const verifyAuth = useCallback(async () => {
    if (typeof window === "undefined") return;

    const token = storage.get<string>("token");
    if (!token) {
      setAuthState("unauthenticated");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      const userData = await response.json();
      storage.set("user", userData);
      setCurrentUser(userData);
      setAuthState("authenticated");
    } catch (error) {
      console.error("認証エラー:", error);
      clearAuth();
    }
  }, [apiUrl, clearAuth]);

  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const publicPaths = ["/", "/login", "/register"];
    if (authState === "unauthenticated" && !publicPaths.includes(pathname)) {
      router.push("/login");
    }
  }, [authState, pathname, router]);

  return (
    <AuthContext.Provider
      value={{ authState, currentUser, verifyAuth, clearAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
```

### 3. `NavBar`コンポーネントの簡素化

```tsx
// components/NavBar.tsx
"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";

const NavBar = () => {
  const { authState, currentUser, clearAuth } = useAuth();

  if (authState === "loading") {
    return <div className="animate-pulse h-16 bg-gray-100" />;
  }

  return (
    <nav className="bg-background text-foreground p-4 shadow-md">
      <ul className="flex space-x-4 items-center">
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
        {authState === "authenticated" ? (
          <>
            {currentUser && (
              <li className="text-sm text-gray-600">
                {currentUser.name} ({currentUser.role})
              </li>
            )}
            <li>
              <button onClick={clearAuth} className="hover:text-blue-600">
                Logout
              </button>
            </li>
          </>
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

### 4. ページコンポーネントの修正例

```tsx
// app/login/page.tsx
"use client";

import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const { verifyAuth } = useAuth();

  // ログイン処理
  const handleLogin = async () => {
    // ログイン処理...
    await verifyAuth(); // 認証状態を更新
  };

  return <div>{/* ログインフォーム */}</div>;
}
```

### 重要な修正ポイント

1. **`AuthProvider`をルートレイアウトで適用**
2. **認証ロジックをコンテキストに分離**
3. **すべてのページコンポーネントに`'use client'`ディレクティブを追加**
4. **静的生成が必要なページでは動的レンダリングを有効化**
   ```tsx
   // 静的生成が不可能なページでは
   export const dynamic = "force-dynamic";
   ```
