# 状態管理 AuthProvider コンポーネント 4.0

- 今回は AuthProvider コンポーネントの機能をほぼ完成するように以下の実装を予定します。

### ①**`isLoading` の追加**

```tsx
interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean; // ←追加
  currentUser: User | null;
  clearAuth: () => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}
```

`isLoading: boolean;` は、認証関連の非同期操作（認証チェックやログアウト）が進行中かどうかを示すフラグです。これにより、以下のことが実現されます：

- ローディング状態の表示
- 重複処理の防止
- UI の状態管理

このフラグを使用することで、ユーザーエクスペリエンスが向上し、アプリケーションの安定性が高まります。

### ②**参照 ref `authCheckRef` の追加**

### **`authCheckRef` の役割**

1. **重複した認証チェックの防止**

   - `authCheckRef` を使用して、認証チェックが既に進行中かどうかを追跡します。
   - これにより、同じ認証チェックが複数回実行されるのを防ぎます。

2. **非同期処理の状態管理**

   - `authCheckRef` に進行中の認証チェックの Promise を保存し、その Promise が完了するまで待機します。

3. **メモリリークの防止**
   - 認証チェックが完了した後、`authCheckRef` を `null` にリセットすることで、不要な参照をクリアします。

---

### **`authCheckRef` の流れ**

#### **1. 認証チェックの開始**

`checkAuth` が呼び出されると、まず `authCheckRef.current` をチェックします。  
もし `authCheckRef.current` が存在する場合（つまり、認証チェックが既に進行中の場合）、その Promise を返します。

```typescript
if (authCheckRef.current) {
  return authCheckRef.current;
}
```

#### **2. 認証チェックの実行**

`authCheckRef.current` が `null` の場合、新しい認証チェックを開始します。  
この際、`authCheckRef.current` に認証チェックの Promise を保存します。

```typescript
const authCheckPromise = (async () => {
  try {
    // ... 認証チェック処理 ...
  } catch (error) {
    // ... エラーハンドリング ...
  } finally {
    setIsLoading(false);
    authCheckRef.current = null; // 認証チェック完了後にリセット
  }
})();

authCheckRef.current = authCheckPromise;
return authCheckPromise;
```

#### **3. 認証チェックの完了**

認証チェックが完了すると、`finally` ブロックで `authCheckRef.current` を `null` にリセットします。  
これにより、次の認証チェックが正しく開始できるようになります。

```typescript
finally {
  setIsLoading(false);
  authCheckRef.current = null; // 認証チェック完了後にリセット
}
```

---

`authCheckRef` は、以下の役割を果たします：

1. 重複した認証チェックを防ぐ。
2. 非同期処理の状態を管理する。
3. メモリリークを防止する。

この実装により、認証チェックが効率的かつ安全に実行されます。

### **③ フラグ　`initialCheck` の追加**

このコードにおける **`initialCheck`** の役割は、**「アプリケーションの初期ロード時かどうか」を判別し、それに応じてリダイレクト処理を制御する**ことです。以下に具体的な流れを解説します。

---

## **1. `initialCheck` の役割**

### **主な目的**

- **初期ロード時（`initialCheck = true`）**:
  - ユーザーがログイン済みかどうかをチェックし、不要なページ（`/login` や `/register`）にアクセスしていた場合、トップページ (`/`) にリダイレクトする。
  - 未ログインの場合、ログインページ (`/login`) にリダイレクトする。
- **非初期時（`initialCheck = false`）**:
  - リダイレクトをスキップし、単に認証状態を更新する（例: ユーザーがボタンをクリックしたときなど）。

| シナリオ         | `initialCheck` の値 | 動作                                                                                        |
| ---------------- | ------------------- | ------------------------------------------------------------------------------------------- |
| **アプリ起動時** | `true`              | ログイン済みなら `/login` や `/register` からリダイレクト。未ログインなら `/login` に誘導。 |
| **手動チェック** | `false`             | リダイレクトせず、認証状態のみ更新。                                                        |
| **認証失敗時**   | `true`              | 未ログインなら `/login` にリダイレクト。                                                    |

**`initialCheck` は「初期ロード時かどうか」でリダイレクトの挙動を切り替えるフラグ**として機能しています。これにより、UX とセキュリティを両立させています。

## AuthProvider コンポーネント 4.0 完成版

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
  useRef,
} from "react";
import { useRouter } from "next/navigation";

type Role = "user" | "admin"; // 将来 "editor" など追加しやすい

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
    console.log("認証情報をクリア");
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setCurrentUser(null);
  }, []);

  const checkAuth = useCallback(
    async (initialCheck = false) => {
      if (authCheckRef.current) {
        return authCheckRef.current;
      }

      console.log("認証チェック開始", { initialCheck });
      setIsLoading(true);

      const authCheckPromise = (async () => {
        try {
          const token = localStorage.getItem("jwtToken");
          const storedUser = localStorage.getItem("user");

          if (!token || !storedUser) {
            throw new Error("認証情報がありません");
          }

          // トークンの有効期限チェック
          const payload = JSON.parse(atob(token.split(".")[1]));
          if (payload.exp * 1000 < Date.now()) {
            throw new Error("トークンの有効期限が切れています");
          }

          // 即時UI更新のためにローカルデータを使用
          const user = JSON.parse(storedUser);
          setCurrentUser(user);

          // サーバーサイド認証チェック
          const response = await fetch(`${apiUrl}/api/users/me`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
          });

          if (!response.ok) {
            throw new Error("認証が必要です");
          }

          const userData = await response.json();
          localStorage.setItem("user", JSON.stringify(userData));
          setCurrentUser(userData);
          setIsLoggedIn(true); // 明示的に状態を更新

          // 初期チェック時のみリダイレクト処理
          if (initialCheck) {
            const currentPath = window.location.pathname;
            if (currentPath === "/login" || currentPath === "/register") {
              router.push("/");
            }
          }
        } catch (error) {
          console.error("認証チェックエラー:", error);
          clearAuth();
          if (initialCheck && window.location.pathname !== "/login") {
            router.push("/login");
          }
        } finally {
          setIsLoading(false);
          authCheckRef.current = null;
        }
      })();

      authCheckRef.current = authCheckPromise;
      return authCheckPromise;
    },
    [apiUrl, clearAuth, router]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("jwtToken");

      if (!token) {
        console.warn(
          "ログアウト: トークンが存在しないためローカルクリアのみ実行"
        );
        clearAuth();
        router.push("/login");
        return;
      }

      // トークンの基本検証
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.exp * 1000 < Date.now()) {
          console.warn("ログアウト: トークン有効期限切れ");
          clearAuth();
          router.push("/login");
          return;
        }
      } catch (e) {
        console.error("トークン解析エラー:", e);
        clearAuth();
        router.push("/login");
        return;
      }

      const response = await fetch(`${apiUrl}/api/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // 401エラーでもクリア処理は実行
      if (response.status === 401) {
        console.warn("サーバー側で認証無効と判定");
      } else if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("ログアウト失敗詳細:", {
          status: response.status,
          error: errorData,
        });
        throw new Error(`ログアウトに失敗しました: ${response.status}`);
      }

      console.log("ログアウト成功");
      clearAuth();
      router.push("/login");
    } catch (error) {
      console.error("ログアウト処理中に例外発生:", error);
      clearAuth();
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, clearAuth, router]);

  useEffect(() => {
    let mounted = true;

    const initialCheck = async () => {
      try {
        await checkAuth(true); // 初回認証チェック
      } catch (error) {
        console.error("初回認証チェックエラー:", error);
      } finally {
        if (mounted) {
          console.log("初回認証チェック完了");
        }
      }
    };

    initialCheck();

    return () => {
      mounted = false;
    };
  }, [checkAuth]);

  useEffect(() => {
    // localStorageの変更を監視
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [checkAuth]);

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

---

**その `useEffect` がこの `AuthProvider` の「初回実行時の入口」になります**。

## 🔍 解説

この部分：

```tsx
useEffect(() => {
  let mounted = true;

  const initialCheck = async () => {
    try {
      await checkAuth(true); // ✅ 初回認証チェックの呼び出し
    } catch (error) {
      console.error("初回認証チェックエラー:", error);
    } finally {
      if (mounted) {
        console.log("初回認証チェック完了");
      }
    }
  };

  initialCheck();

  return () => {
    mounted = false;
  };
}, [checkAuth]);
```

---

## ✅ 何が起きているのか

### 1. `AuthProvider` コンポーネントが最初にマウントされると

React がこの `useEffect` を実行します。

### 2. `checkAuth(true)` が呼び出される

- これは `認証状態を確認し、必要なら `/login` にリダイレクトする` 処理。
- `true` を渡すことで「初期チェックとして特別な挙動（ログインページからの遷移など）」が有効になります。

### 3. `checkAuth` 内で以下が行われる

- `jwtToken` と `user` を `localStorage` から取得
- トークンの有効性を検証
- サーバーに `GET /api/users/me` を送信して認証確認
- 成功したらログイン状態に設定 (`isLoggedIn`, `currentUser`)
- `/login` や `/register` に居たら `/` にリダイレクト（`initialCheck === true` のとき）

---

## ✳️ まとめ：どこが入口か？

はい、以下のコードが\*\*`AuthProvider` の「最初の動き」＝認証チェックの開始地点（入口）\*\*です：

```ts
useEffect(() => {
  ...
  await checkAuth(true); // ✅ 初回チェック（入口）
  ...
}, [checkAuth]);
```

---

必要なら、`checkAuth(true)` と `checkAuth()`（引数なし）の動作の違いについても詳しく説明できます。興味ありますか？

## AuthProvider の完成によるホームページの修正

- `AuthProvider` から直接認証状態を制御するように商品一覧のホームページを修正します。

```tsx
// frontend/app/page.tsx
"use client";
// 他のimport変更なし
import { useAuth } from "../components/AuthProvider";
import { useRouter } from "next/navigation";

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
};

export default function Home() {
  const { isLoggedIn, isLoading: authLoading, checkAuth } = useAuth();
  const router = useRouter();
  //他のuseStateの設定は変更なし

  // 認証状態チェックとリダイレクト処理　//追加分
  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth();
      if (!authLoading && !isLoggedIn) {
        console.log("[AUTH] 未認証ユーザーをリダイレクト");
        router.push("/login");
      }
    };

    verifyAuth();
  }, [isLoggedIn, authLoading, checkAuth, router]);

  // 商品データ取得
  useEffect(() => {
    const fetchProducts = async () => {
      // 認証チェックが完了するまで待機
      if (authLoading) return; //追加

      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products`,
          {
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
  }, [authLoading]); //[]から[authLoading]依存関係追加

  // 認証チェック中は何も表示しない//追加
  if (authLoading) {
    //追加
    return null; //追加
  } //追加

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
