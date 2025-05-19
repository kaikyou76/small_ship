# 状態管理 AuthProvider コンポーネントのバック調査と修正

**ロゴイン後すぐログインページに戻らせされ、`/api/users/me`までの認証処理が到着できない問題。**

```bash
PS D:\next-projects\kaikyou-shop\backend> npm run dev
> kaikyou-shop-backend@0.0.1 dev
> wrangler dev --local


 ⛅️ wrangler 4.15.0 (update available 4.15.2)
-------------------------------------------------------

Your Worker and resources are simulated locally via Miniflare. For more information, see: https://developers.cloudflare.com/workers/testing/local-development.

Your Worker has access to the following bindings:
- KV Namespaces:
  - TEST_NAMESPACE: test-namespace-id [simulated locally]
- D1 Databases:
  - DB: shopping-db (d53ad56f-f646-44dc-8dbf-3d2d15d76973), Preview: (d53ad56f-f646-44dc-8dbf-3d2d15d76973) [simulated locally]
- R2 Buckets:
  - R2_BUCKET: preview-bucket [simulated locally]
- Vars:
  - JWT_SECRET: "local_dev_secret_do_not_use_in_prod"
  - JWT_ISSUER: "kaikyou-shop-dev"
  - JWT_AUDIENCE: "kaikyou-shop-users-dev"
  - ENVIRONMENT: "development"
  - R2_PUBLIC_DOMAIN: "localhost:8787/assets"
[wrangler:inf] Ready on http://127.0.0.1:8787
⎔ Starting local server...
{"timestamp":"2025-05-18T17:58:50.995Z","method":"POST","path":"/api/login","normalizedPath":"/api/login","phase":"request-start","environment":"development"}
[2025-05-18T17:58:51.258Z] [JWT] パスワード検証開始 {
  "hashedPassword": "MVzX0xgFNR..."
}
[2025-05-18T17:58:51.314Z] [JWT] パスワード検証結果 {
  "isValid": true
}
[2025-05-18T17:58:51.316Z] [JWT] トークン生成成功 {
  "userId": 6,
  "email": "lirong@163.com",
  "expiresIn": "2h"
}
[wrangler:inf] POST /api/login 200 OK (451ms)
{"timestamp":"2025-05-18T17:59:00.427Z","method":"GET","path":"/api/products","normalizedPath":"/api/products","phase":"request-start","environment":"development"}
Products: [
  {
    id: 1,
    name: 'Laptop',
    description: 'A powerful laptop with 16GB RAM and 512GB SSD',
    price: 1200,
    stock: 200,
    category_id: 1,
    created_at: '2025-05-03 23:54:16'
  },
  {
    id: 2,
    name: 'Smartphone',
    description: 'Latest model smartphone with 5G support',
    price: 800,
    stock: 10,
    category_id: 2,
    created_at: '2025-05-03 23:54:16'
  },
  {
    id: 3,
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with Bluetooth',
    price: 30,
    stock: 78,
    category_id: 3,
    created_at: '2025-05-03 23:54:16'
  }
]
[wrangler:inf] GET /api/products 200 OK (32ms)
{"timestamp":"2025-05-18T17:59:00.461Z","method":"GET","path":"/api/products","normalizedPath":"/api/products","phase":"request-start","environment":"development"}
Products: [
  {
    id: 1,
    name: 'Laptop',
    description: 'A powerful laptop with 16GB RAM and 512GB SSD',
    price: 1200,
    stock: 200,
    category_id: 1,
    created_at: '2025-05-03 23:54:16'
  },
  {
    id: 2,
    name: 'Smartphone',
    description: 'Latest model smartphone with 5G support',
    price: 800,
    stock: 10,
    category_id: 2,
    created_at: '2025-05-03 23:54:16'
  },
  {
    id: 3,
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with Bluetooth',
    price: 30,
    stock: 78,
    category_id: 3,
    created_at: '2025-05-03 23:54:16'
  }
]
[wrangler:inf] GET /api/products 200 OK (64ms)
╭──────────────────────────────────────────────────────────────────────────────────────────────────╮
│  [b] open a browser, [d] open devtools, [l] turn off local mode, [c] clear console, [x] to exit  │
╰──────────────────────────────────────────────────────────────────────────────────────────────────╯


```

問題の原因を特定するために、`AuthProvider.tsx`に詳細なデバッグログを追加しました。以下の修正版では、各ステップで何が起こっているかを明確に追跡できます。

```typescript
// frontend/components/AuthProvider.tsx (デバッグ強化版)
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";

type Role = "user" | "admin";

interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
}

interface AuthContextType {
  currentUser: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  clearAuth: () => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();
  const authCheckRef = useRef<Promise<void> | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiUrl) throw new Error("APIエンドポイントが設定されていません");

  const clearAuth = useCallback(() => {
    console.log("[AUTH] 認証情報をクリア");
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setCurrentUser(null);
  }, []);

  const checkAuth = useCallback(
    async (initialCheck = false) => {
      if (authCheckRef.current) {
        console.log("[AUTH] 既存の認証チェック処理を待機");
        return authCheckRef.current;
      }

      console.groupCollapsed(
        `[AUTH] 認証チェック開始 (initial: ${initialCheck})`
      );
      console.log("[AUTH] 現在のパス:", window.location.pathname);
      setIsLoading(true);

      const authCheckPromise = (async () => {
        try {
          const token = localStorage.getItem("jwtToken");
          const storedUser = localStorage.getItem("user");
          console.log("[AUTH] ローカルストレージから取得:", {
            token,
            storedUser,
          });

          if (!token || !storedUser) {
            console.warn("[AUTH] トークンまたはユーザー情報が不足");
            throw new Error("認証情報がありません");
          }

          // トークンの有効期限チェック
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            console.log("[AUTH] トークンペイロード:", payload);

            const isExpired = payload.exp * 1000 < Date.now();
            console.log(
              `[AUTH] トークン有効期限チェック: ${new Date(
                payload.exp * 1000
              )} (現在: ${new Date()})`
            );

            if (isExpired) {
              console.warn("[AUTH] トークン有効期限切れ");
              throw new Error("トークンの有効期限が切れています");
            }
          } catch (e) {
            console.error("[AUTH] トークン解析エラー:", e);
            throw e;
          }

          // 即時UI更新のためにローカルデータを使用
          const user = JSON.parse(storedUser);
          console.log("[AUTH] ローカルユーザーデータを設定:", user);
          setCurrentUser(user);

          // サーバーサイド認証チェック
          console.log("[AUTH] サーバー認証開始...");
          const response = await fetch(`${apiUrl}/api/users/me`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
          });

          console.log("[AUTH] サーバー応答:", {
            status: response.status,
            ok: response.ok,
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("[AUTH] 認証失敗:", errorText);
            throw new Error(`認証が必要です (${response.status})`);
          }

          const userData = await response.json();
          console.log("[AUTH] 認証成功 ユーザーデータ:", userData);

          localStorage.setItem("user", JSON.stringify(userData));
          setCurrentUser(userData);
          setIsLoggedIn(true);
          console.log("[AUTH] 認証状態を更新");

          // 初期チェック時のみリダイレクト処理
          if (initialCheck) {
            const currentPath = window.location.pathname;
            console.log("[AUTH] 初期チェック 現在パス:", currentPath);

            if (currentPath === "/login" || currentPath === "/register") {
              console.log("[AUTH] ログイン後リダイレクト実行");
              router.push("/");
            }
          }
        } catch (error) {
          console.groupEnd();
          console.error("[AUTH] 認証チェックエラー:", error);
          clearAuth();

          if (initialCheck && window.location.pathname !== "/login") {
            console.log("[AUTH] 未認証ユーザーをログイン画面にリダイレクト");
            router.push("/login");
          }
        } finally {
          setIsLoading(false);
          authCheckRef.current = null;
          console.groupEnd();
        }
      })();

      authCheckRef.current = authCheckPromise;
      return authCheckPromise;
    },
    [apiUrl, clearAuth, router]
  );

  // ... (logout関数は変更なし)

  useEffect(() => {
    let mounted = true;

    const initialCheck = async () => {
      console.log("[AUTH] 初回認証チェック開始");
      try {
        await checkAuth(true);
      } catch (error) {
        console.error("[AUTH] 初回認証チェックエラー:", error);
      } finally {
        if (mounted) {
          console.log("[AUTH] 初回認証チェック完了");
        }
      }
    };

    initialCheck();

    return () => {
      mounted = false;
    };
  }, [checkAuth]);

  // ... (その他のuseEffectは変更なし)

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoggedIn,
        isLoading,
        clearAuth,
        checkAuth,
        logout,
      }}
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

## 追加したデバッグポイント

1. **認証フローの開始/終了マーカー**

   ```typescript
   console.groupCollapsed(`[AUTH] 認証チェック開始 (initial: ${initialCheck})`);
   // ...
   console.groupEnd();
   ```

2. **トークン検証の詳細**

   ```typescript
   console.log(
     `[AUTH] トークン有効期限チェック: ${new Date(
       payload.exp * 1000
     )} (現在: ${new Date()})`
   );
   ```

3. **API レスポンスの詳細ログ**

   ```typescript
   console.log("[AUTH] サーバー応答:", {
     status: response.status,
     ok: response.ok,
   });
   ```

4. **リダイレクト判断ロジック**
   ```typescript
   console.log("[AUTH] 初期チェック 現在パス:", currentPath);
   ```

## 確認すべきログ出力

1. **正常フローの場合:**

   ```
   [AUTH] 認証チェック開始 (initial: true)
     [AUTH] トークンペイロード: {user_id: 6, exp: 1747596200, ...}
     [AUTH] サーバー応答: {status: 200, ok: true}
     [AUTH] 認証成功 ユーザーデータ: {id: 6, name: "lirong", ...}
   ```

2. **問題が発生する場合の典型的なパターン:**
   - **トークン不一致**:
     ```
     [AUTH] トークン解析エラー: Invalid token format
     ```
   - **API 接続失敗**:
     ```
     [AUTH] サーバー応答: {status: 401, ok: false}
     ```
   - **リダイレクトループ**:
     ```
     [AUTH] 初期チェック 現在パス: /login
     [AUTH] 未認証ユーザーをログイン画面にリダイレクト
     ```

## 次のアクション

1. この修正版を実装後、以下のコマンドでコンソールログを監視:

   ```bash
   # Chromeの場合
   F12 → Consoleタブ → "Verbose"レベルを選択
   ```

2. ログイン操作を行い、コンソールに出力される`[AUTH]`タグのログを全て記録

3. 問題が再現した際のログの**最後の 20 行程度**を共有してください。特に:
   - トークン検証が成功しているか
   - `/api/users/me`のレスポンスステータス
   - リダイレクトが発生する直前の状態

これにより、認証フローのどこで問題が発生しているか正確に特定できます。

# 問題の確定

再度ログインテストしたところ、DevTools（デブツール）から以下のログが表示

```
Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools
AuthProvider.tsx:60 [AUTH] 認証チェック開始 (initial: false)
app-index.js:33 [AUTH] 認証チェックエラー: Error: 認証情報がありません
    at eval (AuthProvider.tsx:77:19)
    at eval (AuthProvider.tsx:160:7)
    at verifyAuth (page.tsx:25:13)
    at eval (page.tsx:32:5)
    at commitHookEffectListMount (react-dom.development.js:21102:23)
    at commitHookPassiveMountEffects (react-dom.development.js:23154:7)
    at commitPassiveMountOnFiber (react-dom.development.js:23259:11)
    at recursivelyTraversePassiveMountEffects (react-dom.development.js:23237:7)
    at commitPassiveMountOnFiber (react-dom.development.js:23256:9)
    at recursivelyTraversePassiveMountEffects (react-dom.development.js:23237:7)
    at commitPassiveMountOnFiber (react-dom.development.js:23370:9)
    at recursivelyTraversePassiveMountEffects (react-dom.development.js:23237:7)
    at commitPassiveMountOnFiber (react-dom.development.js:23370:9)
    at recursivelyTraversePassiveMountEffects (react-dom.development.js:23237:7)
    at commitPassiveMountOnFiber (react-dom.development.js:23256:9)
    at recursivelyTraversePassiveMountEffects (react-dom.development.js:23237:7)
    at commitPassiveMountOnFiber (react-dom.development.js:23370:9)
    at recursivelyTraversePassiveMountEffects (react-dom.development.js:23237:7)
    at commitPassiveMountOnFiber (react-dom.development.js:23256:9)
    at recursivelyTraversePassiveMountEffects (react-dom.development.js:23237:7)
    at commitPassiveMountOnFiber (react-dom.development.js:23370:9)
    at recursivelyTraversePassiveMountEffects (react-dom.development.js:23237:7)
    at commitPassiveMountOnFiber (react-dom.development.js:23256:9)
    at recursivelyTraversePassiveMountEffects (react-dom.development.js:23237:7)
    at commitPassiveMountOnFiber (react-dom.development.js:23256:9)
    at recursivelyTraversePassiveMountEffects (react-dom.development.js:23237:7)
    at commitPassiveMountOnFiber (react-dom.development.js:23256:9)
    at recursivelyTraversePassiveMountEffects (react-dom.development.js:23237:7)
    at commitPassiveMountOnFiber (react-dom.development.js:23370:9)
    at recursivelyTraversePassiveMountEffects (react-dom.development.js:23237:7)
    at commitPassiveMountOnFiber (react-dom.development.js:23256:9)
    at recursivelyTraversePassiveMountEffects (react-dom.development.js:23237:7)
    at commitPassiveMountOnFiber (react-dom.development.js:23256:9)
    at recursivelyTraversePassiveMountEffects (react-dom.development.js:23237:7)
    at commitPassiveMountOnFiber (react-dom.development.js:23370:9)
    at recursivelyTraversePassiveMountEffects (react-dom.development.js:23237:7)
    at commitPassiveMountOnFiber (react-dom.development.js:23256:9)
    at recursivelyTraversePassiveMountEffects (react-dom.development.js:23237:7)
    at commitPassiveMountOnFiber (react-dom.development.js:23370:9)
    at recursivelyTraversePassiveMountEffects (react-dom.development.js:23237:7)
    at commitPassiveMountOnFiber (react-dom.development.js:23256:9)
    at recursivelyTraversePassiveMountEffects (react-dom.development.js:23237:7)
    at commitPassiveMountOnFiber (react-dom.development.js:23370:9)
    at recursivelyTraversePassiveMountEffects (react-dom.development.js:23237:7)
    at commitPassiveMountOnFiber (react-dom.development.js:23370:9)
    at recursivelyTraversePassiveMountEffects (react-dom.development.js:23237:7)
    at commitPassiveMountOnFiber (react-dom.development.js:23370:9)
    at recursivelyTraversePassiveMountEffects (react-dom.development.js:23237:7)
    at commitPassiveMountOnFiber (react-dom.development.js:23370:9)
    at recursivelyTraversePassiveMountEffects (react-dom.development.js:23237:7)
window.console.error @ app-index.js:33Understand this error
AuthProvider.tsx:46 [AUTH] 認証情報をクリア
AuthProvider.tsx:234 [AUTH] 初回認証チェック開始
2AuthProvider.tsx:56 [AUTH] 既存の認証チェック処理を待機
AuthProvider.tsx:234 [AUTH] 初回認証チェック開始
2AuthProvider.tsx:56 [AUTH] 既存の認証チェック処理を待機
AuthProvider.tsx:241 [AUTH] 初回認証チェック完了
page.tsx:27 [AUTH] 未認証ユーザーをリダイレクト
hot-reloader-client.js:187 [Fast Refresh] rebuilding
hot-reloader-client.js:44 [Fast Refresh] done in 588ms
3AuthProvider.tsx:56 [AUTH] 既存の認証チェック処理を待機
2page.tsx:27 [AUTH] 未認証ユーザーをリダイレクト
hot-reloader-client.js:187 [Fast Refresh] rebuilding
hot-reloader-client.js:44 [Fast Refresh] done in 52ms
```

このエラーは、`AuthProvider` の認証チェックでローカルストレージに認証情報（JWT トークンやユーザー情報）が見つからない場合に発生しています。問題を解決するために、以下の修正を行います。

## 修正ポイント

1. **初期認証チェックの競合状態を解消**
2. **リダイレクト処理の最適化**
3. **ローディング状態の管理改善**

## 修正後のコード

```tsx
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { useRouter } from "next/navigation";

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
};

export default function Home() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 認証状態に基づくリダイレクト処理
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      console.log("[PAGE] 未認証ユーザーをリダイレクト");
      router.push("/login");
    }
  }, [isLoggedIn, authLoading, router]);

  // 商品データ取得
  useEffect(() => {
    if (authLoading || !isLoggedIn) return;

    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products`,
          {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) {
          throw new Error(
            `商品の取得に失敗しました (ステータス: ${res.status})`
          );
        }

        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error("商品取得エラー:", error);
        setError(
          error instanceof Error
            ? error.message
            : "予期せぬエラーが発生しました"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [authLoading, isLoggedIn]);

  // 認証チェック中は何も表示しない
  if (authLoading) {
    return null;
  }

  // 未認証状態であればここまで来ない（リダイレクトされる）
  if (!isLoggedIn) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          再読み込み
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">🛒 商品一覧</h1>

      {products.length === 0 ? (
        <p className="text-center text-gray-500">商品が見つかりませんでした</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="block p-6 border border-gray-200 rounded-lg shadow hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold mb-2 truncate">
                {product.name}
              </h2>
              <div className="flex justify-between items-center">
                <p className="text-gray-600">
                  ¥{product.price.toLocaleString()}
                </p>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    product.stock > 0
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {product.stock > 0 ? "在庫あり" : "売り切れ"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

## 主な改善点

1. **認証チェックの簡素化**

   - `checkAuth` を直接呼び出すのではなく、`AuthProvider` が管理する状態 (`isLoggedIn`, `authLoading`) を監視
   - これにより、認証チェックの重複実行を防ぎます

2. **リダイレクト処理の最適化**

   ```tsx
   useEffect(() => {
     if (!authLoading && !isLoggedIn) {
       router.push("/login");
     }
   }, [isLoggedIn, authLoading, router]);
   ```

3. **データ取得の条件追加**

   ```tsx
   useEffect(() => {
     if (authLoading || !isLoggedIn) return;
     // データ取得処理
   }, [authLoading, isLoggedIn]);
   ```

4. **状態管理の明確化**
   - `authLoading`: 認証チェック中の状態
   - `isLoggedIn`: 認証状態
   - `isLoading`: データ取得中の状態

## エラー発生の根本原因

元のエラー `[AUTH] 認証チェックエラー: Error: 認証情報がありません` は、以下の状況で発生していました：

1. `AuthProvider` の初期チェックでローカルストレージに認証情報がないことを検出
2. ページコンポーネントでも `checkAuth` を呼び出し、同じエラーが再発生
3. 二重のエラーログが出力されていた

今回の修正で、この競合状態を解消し、認証フローをより明確に分離しました。

## 追加の検証ポイント

1. **ローカルストレージの状態確認**

   - 開発者ツールで `localStorage` に `jwtToken` と `user` が正しく保存されているか確認

   ```javascript
   console.log({
     token: localStorage.getItem("jwtToken"),
     user: localStorage.getItem("user"),
   });
   ```

2. **Cookie の送信確認**

   - API リクエストに `credentials: "include"` が設定されているか確認
   - クロスオリジンの場合は CORS 設定も確認

3. **認証フローの整合性**
   - ログイン成功後に正しく認証情報が保存されているか
   - ログアウト時に認証情報がクリアされているか

これらの修正により、認証フローがより安定し、デバッグも容易になります。
