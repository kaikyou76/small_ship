# NavBar コンポーネント 完全修正コード（Vercel 互換版）

問題の本質を正しく理解するために、Windows サーバーと Vercel 環境の差異を技術的に深掘りします。根本原因は**localStorage の扱い方と環境依存の挙動**にあります。

### 🌟 根本原因の技術的解説

#### 1. **Windows サーバーで問題なかった理由**

```typescript
// Windows環境（従来のSSG/SSR動作）
- サーバーサイドでlocalStorageチェックがスキップされる
- クライアントサイドでhydration後に認証チェックが実行
- 初期表示フラッシュ後、正しい状態に落ち着く
```

#### 2. **Vercel で発生する問題のメカニズム**

```typescript
// Vercel（Edge Network環境）
- エッジロケーションで実行されるため、サーバーサイドでlocalStorageチェックが試行される
- typeof windowチェックがあっても、Edge Runtimeで予期せぬ挙動
- 認証失敗→即時リダイレクトのループ発生
```

### 🛠 完全修正コード（Vercel 互換版）

```tsx
"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const NavBar = () => {
  const [authState, setAuthState] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // クライアントサイドでのみ実行される保証
    if (typeof window === "undefined") return;

    const verifyAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setAuthState("unauthenticated");
        return;
      }

      try {
        const res = await fetch("/api/auth/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAuthState(res.ok ? "authenticated" : "unauthenticated");
      } catch {
        setAuthState("unauthenticated");
      }
    };

    verifyAuth();
  }, []);

  useEffect(() => {
    // リダイレクト制御（クライアントサイドのみ）
    if (typeof window === "undefined") return;

    if (authState === "unauthenticated" && !pathname.startsWith("/login")) {
      router.push("/login");
    }
  }, [authState, pathname]);

  // ローディング表示
  if (authState === "loading") {
    return <div className="skeleton-loader" />;
  }

  return (
    <nav>
      {authState === "authenticated" ? (
        <button
          onClick={() => {
            localStorage.removeItem("token");
            setAuthState("unauthenticated");
          }}
        >
          Logout
        </button>
      ) : (
        <Link href="/login">Login</Link>
      )}
    </nav>
  );
};
```

### 🔥 核心的な修正ポイント

1. **Edge Runtime 対策**

   ```typescript
   // 明示的なクライアントサイド実行ガード
   if (typeof window === "undefined") return;
   ```

2. **状態管理の最適化**

   ```typescript
   // サーバー/クライアントの状態不一致を防止
   const [authState, setAuthState] = useState<
     "loading" | "authenticated" | "unauthenticated"
   >("loading");
   ```

3. **Vercel 特有の挙動への対応**
   ```typescript
   // リダイレクト処理をuseEffect内に閉じ込め
   useEffect(() => {
     if (authState === "unauthenticated") {
       router.push("/login");
     }
   }, [authState]);
   ```

### 📊 環境比較表

| 項目                       | Windows サーバー    | Vercel (Edge)      |
| -------------------------- | ------------------- | ------------------ |
| **localStorage アクセス**  | クライアントのみ    | エッジで試行       |
| **初期レンダリング**       | HTML キャッシュ可能 | 動的レンダリング   |
| **認証チェックタイミング** | Hydration 後        | プリレンダリング時 |

### 💡 根本解決のための設計原則

1. **認証状態の取得をクライアントサイドに限定**

   ```typescript
   // 正しい例
   useEffect(() => {
     if (typeof window !== "undefined") {
       const token = localStorage.getItem("token");
       // ...
     }
   }, []);
   ```

2. **Edge Runtime を意識したエラーハンドリング**
   ```typescript
   try {
     // Edgeで失敗する可能性のある操作
   } catch (e) {
     console.error("Edge Runtime Error:", e);
     // フォールバック処理
   }
   ```

この修正により、Vercel 環境でも Windows サーバーと同様の安定した動作が得られます。特に Edge Runtime での localStorage アクセス制約が根本原因だったことがわかります。
