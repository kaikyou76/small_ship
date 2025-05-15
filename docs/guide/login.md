# login する

frontend\app\login\page.tsx

```tsx
// frontend/app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    global?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.email) {
      newErrors.email = "メールアドレスが必要です";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "有効なメールアドレスを入力してください";
    }

    if (!formData.password) {
      newErrors.password = "パスワードが必要です";
    } else if (formData.password.length < 8) {
      newErrors.password = "パスワードは8文字以上必要です";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMounted || !validateForm()) return;
    setIsSubmitting(true);
    setErrors({});

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!apiUrl) throw new Error("APIエンドポイントが設定されていません");

      const response = await fetch(`${apiUrl}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data?.message || `ログインに失敗しました (HTTP ${response.status})`
        );
      }

      const { data } = await response.json();
      if (data?.token) {
        localStorage.setItem("jwtToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("storage"));
        await new Promise((resolve) => setTimeout(resolve, 100));
        const returnTo = sessionStorage.getItem("preAuthPath") || "/";
        router.replace(returnTo);
        sessionStorage.removeItem("preAuthPath");
      }
    } catch (error) {
      console.error("ログインエラー詳細:", error);
      setErrors({
        global:
          error instanceof Error
            ? error.message
            : "ログイン処理中にエラーが発生しました",
      });
    } finally {
      if (isMounted) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div>
      <div>
        <h2>アカウントにログイン</h2>
      </div>

      <div>
        {errors.global && (
          <div>
            <p>{errors.global}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">メールアドレス</label>
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <p>{errors.email}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="password">パスワード</label>
            <div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "非表示" : "表示"}
              </button>
              {errors.password && <p>{errors.password}</p>}
            </div>
          </div>

          <div>
            <input id="remember-me" name="remember-me" type="checkbox" />
            <label htmlFor="remember-me">ログイン状態を保持</label>
          </div>

          <div>
            <button type="submit" disabled={isSubmitting}>
              ログイン
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- **デバック**

### ログインテスト

```bash
curl -X POST http://127.0.0.1:8787/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com", "password":"password123"}' \
     --cookie-jar cookie.txt
```

windwos 版

```bash
curl.exe -X POST http://127.0.0.1:8787/api/login `
  -H "Content-Type: application/json" `
  -d "{\`"email\`":\`"test@example.com\`", \`"password\`":\`"password123\`"}" `
  --cookie-jar cookie.txt
```

![alt text](image-35.png)

- cookie.txt

```
# Netscape HTTP Cookie File
# https://curl.se/docs/http-cookies.html
# This file was generated by libcurl! Edit at your own risk.

#HttpOnly_127.0.0.1	FALSE	/	TRUE	1747810851	session_token	7f02c6e0034031f81b775cf46f722664bbb75d4624af09f5ff2b262c1edaf185

```

### 認証済み API テスト

```bash
curl http://127.0.0.1:8787/api/users/me \
     --cookie cookie.txt

```

windows 版

```bash
curl.exe http://127.0.0.1:8787/api/users/me --cookie cookie.txt
```

以下は、`Content-Type`と`Authorization`ヘッダーを含む cURL コマンドの例です。ログイン後に取得した JWT トークンを使用して認証が必要な API をテストする場合のコマンドも含めています。

### 1. ログインリクエスト (トークン取得)

```bash
curl -X POST http://127.0.0.1:8787/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com", "password":"password123"}'
```

### 2. 認証が必要な API へのリクエスト (取得したトークンを使用)

```bash
# ログイン後、レスポンスから取得したトークンを使用
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNjUwMjM5MDIyLCJleHAiOjE2NTAzMjU0MjJ9.abc123def456ghi789"

curl -X GET http://127.0.0.1:8787/api/protected \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN"
```

### 3. ログインと認証リクエストを 1 つのスクリプトで実行

```bash
#!/bin/bash

# ログインしてトークンを取得
LOGIN_RESPONSE=$(curl -s -X POST http://127.0.0.1:8787/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com", "password":"password123"}')

# レスポンスからトークンを抽出
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "ログイン失敗:"
  echo $LOGIN_RESPONSE | jq
  exit 1
fi

echo "トークン取得成功: $TOKEN"

# 取得したトークンで保護されたAPIにアクセス
curl -X GET http://127.0.0.1:8787/api/protected \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

### 4. クレデンシャルを含むより完全な例

```bash
curl -X POST http://127.0.0.1:8787/api/login \
     -H "Content-Type: application/json" \
     -H "Accept: application/json" \
     -H "X-Requested-With: XMLHttpRequest" \
     -d '{"email":"test@example.com", "password":"password123"}' \
     --cookie-jar cookies.txt \
     --verbose
```

### 注意点:

1. `jq`コマンドを使う場合は事前にインストールが必要です (`brew install jq` or `apt-get install jq`)
2. 実際のトークンはログイン API のレスポンスに含まれる`data.token`を使用してください
3. パスワードは適切なものに変更してください
4. 開発環境では`http://127.0.0.1:8787`を実際の API エンドポイントに置き換えてください

このコマンド群を使えば、ログイン API のテストと、その後の認証が必要な API のテストが可能です。特に 2 番目の例は、ログイン後に取得したトークンを使って認証が必要なリソースにアクセスする方法を示しています。
