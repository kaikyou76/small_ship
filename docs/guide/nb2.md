Navbar をコンポーネント化して、ログイン状態や権限に応じて表示を制御する方法を提案します。以下に整理した実装を示します。

### 1. 権限付きボタンコンポーネントの作成

```tsx
// components/AuthButton.tsx
"use client";

import { useAuth } from "./AuthProvider";
import { ReactNode } from "react";

interface AuthButtonProps {
  children: ReactNode;
  requiredRole?: "user" | "admin";
  className?: string;
  href?: string;
  onClick?: () => void;
}

export const AuthButton = ({
  children,
  requiredRole,
  className = "",
  href,
  onClick,
}: AuthButtonProps) => {
  const { isLoggedIn, currentUser, isLoading } = useAuth();

  if (isLoading) return null;

  // ログイン不要またはログイン済みで権限条件を満たす場合
  const isVisible =
    !requiredRole || (isLoggedIn && currentUser?.role === requiredRole);

  if (!isVisible) return null;

  const baseClasses = "hover:text-blue-600 font-medium px-3 py-1 rounded";
  const finalClasses = `${baseClasses} ${className}`;

  return href ? (
    <Link href={href} className={finalClasses} onClick={onClick}>
      {children}
    </Link>
  ) : (
    <button className={finalClasses} onClick={onClick}>
      {children}
    </button>
  );
};
```

### 2. ログイン/ログアウトボタンコンポーネント

```tsx
// components/LoginLogoutButton.tsx
"use client";

import { useAuth } from "./AuthProvider";

export const LoginLogoutButton = () => {
  const { isLoggedIn, logout, isLoading } = useAuth();

  if (isLoading) return null;

  return isLoggedIn ? (
    <button
      onClick={logout}
      className="hover:text-blue-600 font-medium px-3 py-1 rounded"
    >
      Logout
    </button>
  ) : (
    <AuthButton href="/login" className="bg-gray-100">
      Login
    </AuthButton>
  );
};
```

### 3. リファクタリング後の NavBar コンポーネント

```tsx
// components/NavBar.tsx
"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { AuthButton } from "./AuthButton";
import { LoginLogoutButton } from "./LoginLogoutButton";

export const NavBar = () => {
  const { isLoggedIn, isLoading, currentUser } = useAuth();

  if (isLoading) {
    return <div className="animate-pulse h-16 bg-gray-100"></div>;
  }

  return (
    <nav className="bg-background text-foreground p-4 shadow-md">
      <div className="container mx-auto">
        <ul className="flex space-x-6 items-center">
          <li>
            <Link href="/" className="hover:text-blue-600 font-medium">
              Home
            </Link>
          </li>
          <li>
            <Link href="/products" className="hover:text-blue-600 font-medium">
              Products
            </Link>
          </li>

          <div className="flex-grow"></div>

          <AuthButton href="/member-center" className="bg-blue-50">
            会員センター
          </AuthButton>

          {currentUser && (
            <li className="text-sm text-gray-600">
              {currentUser.name} ({currentUser.role})
            </li>
          )}

          <LoginLogoutButton />

          <AuthButton
            href="/register"
            className="bg-gray-100"
            requiredRole={undefined}
          >
            Register
          </AuthButton>

          {/* 管理者のみ表示されるボタン例 */}
          <AuthButton href="/admin" requiredRole="admin" className="bg-red-50">
            Admin Panel
          </AuthButton>
        </ul>
      </div>
    </nav>
  );
};
```

### この実装の利点

1. **責務の分離**:

   - 認証ロジックは`AuthButton`と`LoginLogoutButton`にカプセル化
   - NavBar は表示の組み立てに集中

2. **再利用性**:

   - 権限が必要なボタンはどこでも`AuthButton`で簡単に実装可能
   - デザインは className で柔軟に変更可能

3. **保守性**:

   - 権限要件の変更が 1 箇所で可能
   - ログイン状態の管理が一元化

4. **拡張性**:
   - 新しい権限タイプの追加が容易
   - 複雑な表示条件もコンポーネント内に閉じ込め可能

この構造により、ナビゲーションバーの各要素が独立して管理でき、状態変化にも強固に対応できます。特に権限管理が必要なプロジェクトで効果を発揮します。
