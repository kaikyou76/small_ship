# ✅ Next.js に Tailwind CSS をインストール・セットアップする方法

### ① Tailwind CSS をインストール

プロジェクトの（`frontend/`）で、ターミナルを開き、次を実行してください。

```bash
npm install tailwindcss postcss autoprefixer --save-dev
```

次は frontend/の配下に下記ファイルを手動で作成します：

- `tailwind.config.mjs`
- `postcss.config.mjs`

---

### ② `tailwind.config.mjs` を作成

```js
/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // 他のファイルパスがあれば追加
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

### ② 既存の`postcss.config.mjs` を編集

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};
```

👉 これで、`app/` と `components/` 以下のファイルで Tailwind が有効になります。

---

### ③ グローバル CSS ファイルを作る

`frontend/styles/`ディレクトリに、`globals.css`というファイルを作成してください。

ファイル内容はこれです：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

### ④ `_app.tsx` または `layout.tsx` に読み込む

次に、`app/layout.tsx` を編集して、さっき作った `globals.css` をインポートします！

```tsx
import "../styles/globals.css"; // ← これを必ず追加する！

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
```

---

# 🎯 ここまでで Tailwind 完了！

これで、

- `text-3xl`
- `bg-blue-600`
- `rounded-lg`
- `hover:bg-blue-700`
  とか、全部きれいに反映されるようになります ✨

---

要約すると：
| 作業 | やること |
|:-|:-|
| 1 | `npm install -D tailwindcss postcss autoprefixer` |
| 2 | `tailwind.config.mjs` を新規作成|
| 3 | `postcss.config.mjs`を編集 |
| 4 | `globals.css`を作成して Tailwind ディレクティブを書く |
| 5 | `layout.tsx`で `import '../styles/globals.css'` |

---
