# 会員管理画面 1.0

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

## MemberCenter.tsx 1.0 版

frontend/app/member-center/page.tsx

```typescript
// frontend/app/member-center/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import { useEffect } from "react";

export default function MemberCenter() {
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
  }, [user, router]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">ユーザーダッシュボード</h1>
      <p>ようこそ！ここでは注文履歴やアカウント情報を確認できます。</p>
    </div>
  );
}
```
