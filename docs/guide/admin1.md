# 管理員管理画面 1.0

### AuthProvider.tsx の改善

- `User` インターフェースに `role` プロパティを定義します。

```typescript
// frontend/components/AuthProvider.tsx
interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin"; // 必須追加
}
```

## AdminCenter.tsx 1.0 版

frontend/app/admin-center/page.tsx

```typescript
// frontend/app/admin-center/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import { useEffect } from "react";

export default function AdminCenter() {
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (user?.role !== "admin") {
      router.push("/member-center");
    }
  }, [user, router]);

  if (!user || user?.role !== "admin") {
    return null; // リダイレクト中のフォールバック
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">管理員センター</h1>
      <p>ようこそ！管理員様。</p>
    </div>
  );
}
```
