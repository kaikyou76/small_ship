# グローバルな状態管理

`AuthProvider`・`createContext`・`useContext` は、React で **グローバルな状態管理**をするための基本的な仕組みです。とくに「ログイン情報」や「テーマ設定」など、**複数のコンポーネントにまたがって共有される状態**を扱うときによく使います。

---

## 🔧 それぞれの役割

### ✅ `createContext`

- グローバルな状態を定義する「箱」を作ります。
- `React.createContext()` で作成します。

```tsx
const AuthContext = createContext(null);
```

---

### ✅ `AuthProvider`

- `AuthContext.Provider` をラップしたコンポーネント。
- 子コンポーネントに **認証状態（ログインしているか、ユーザー情報など）** を渡す役割をします。

```tsx
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // ログイン状態

  const login = (userInfo) => setUser(userInfo);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

### ✅ `useContext`

- `AuthContext` から値を「取り出す」ための React フック。

```tsx
import { useContext } from "react";

const { user, login, logout } = useContext(AuthContext);
```

---

## 🧩 例：使い方の全体像

```tsx
// AuthContext.js
import { createContext, useState, useContext } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  return (
    <AuthContext.Provider
      value={{ user, login: setUser, logout: () => setUser(null) }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

```tsx
// App.jsx
import { AuthProvider } from "./AuthContext";
import HomePage from "./HomePage";

export default function App() {
  return (
    <AuthProvider>
      <HomePage />
    </AuthProvider>
  );
}
```

```tsx
// HomePage.jsx
import { useAuth } from "./AuthContext";

export default function HomePage() {
  const { user, login, logout } = useAuth();

  return (
    <div>
      {user ? (
        <>
          <p>こんにちは、{user.name}さん</p>
          <button onClick={logout}>ログアウト</button>
        </>
      ) : (
        <button onClick={() => login({ name: "Taro" })}>ログイン</button>
      )}
    </div>
  );
}
```

---

## ✅ よくある用途

- ログイン・認証情報の管理
- ダークモードの状態管理
- 多言語設定（i18n）

---
