実装状況ばっちりですね！Next.js（App Router）＋ Cloudflare Workers ＋ D1 スキーマも整理されていて、拡張性もある設計になってます。

✅ 次のステップ：商品登録ページ（POST）
現在はバックエンドが POST /api/products に対応済みなので、これを呼び出すフロントエンドフォームを作成しましょう。

💡 新規商品登録ページの作成例
例として /product/new というルートで商品登録ページを作成するとします。

frontend/app/product/new/page.tsx を以下のように実装：

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProductPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category_id: "",
    image_url: "",
  });

  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      ...form,
      price: parseInt(form.price),
      stock: parseInt(form.stock),
      category_id: form.category_id ? parseInt(form.category_id) : undefined,
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        setError(err.error?.message || "登録に失敗しました");
        return;
      }

      const newProduct = await res.json();
      router.push(`/product/${newProduct.id}`);
    } catch (err) {
      console.error("送信エラー:", err);
      setError("ネットワークエラーが発生しました");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">新規商品登録</h1>

      {error && <p className="text-red-500 mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          placeholder="商品名"
          required
          onChange={handleChange}
          value={form.name}
          className="w-full p-2 border rounded"
        />
        <textarea
          name="description"
          placeholder="商品説明"
          onChange={handleChange}
          value={form.description}
          className="w-full p-2 border rounded"
        />
        <input
          name="price"
          type="number"
          placeholder="価格"
          required
          onChange={handleChange}
          value={form.price}
          className="w-full p-2 border rounded"
        />
        <input
          name="stock"
          type="number"
          placeholder="在庫数"
          onChange={handleChange}
          value={form.stock}
          className="w-full p-2 border rounded"
        />
        <input
          name="category_id"
          type="number"
          placeholder="カテゴリID（任意）"
          onChange={handleChange}
          value={form.category_id}
          className="w-full p-2 border rounded"
        />
        <input
          name="image_url"
          type="url"
          placeholder="画像URL（任意）"
          onChange={handleChange}
          value={form.image_url}
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          登録
        </button>
      </form>
    </div>
  );
}
```

🔧 確認しておくこと
.env.local に以下のように NEXT_PUBLIC_API_BASE_URL を定義済みか確認：

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8787
```

※デプロイ先の URL に合わせて切り替えてください。
category_id は categories テーブルを使って選択式にする場合、API で取得して `<select> `に変換するのもおすすめです。

必要ならこのあとに「バリデーション追加」「カテゴリ一覧 API 作成」「画像アップロード対応」なども順次拡張していけます！

続きを実装していきますか？他にも UI や API の相談あればぜひ！

# 次はお願いします。

✅ 実装するエンドポイント#

[ ] PUT /api/products/:id 商品更新
[ ] DELETE /api/products/:id 商品削除

✅ 対応するフロントエンド#

[ ] 商品更新フォーム（管理者向けなど）
[ ] 削除ボタンと確認ダイアログ

以下は、次のステップとしての実装例です。バックエンドで商品更新（PUT）と削除（DELETE）のエンドポイントを追加し、さらにフロントエンド側で管理者向けの更新フォームと削除ボタンを組み込む実装例を示します。

---

## 1. バックエンド実装

### 1-1. 商品更新エンドポイント（PUT /api/products/:id）

更新時はリクエストボディの各項目が任意入力になります。更新する値だけを反映できるよう、`COALESCE` で既存値と置き換えを行う実装例を示します。

**backend/src/endpoints/productUpdate.ts**

```ts
import { z } from "zod";
import { Context } from "hono";

type Bindings = {
  DB: D1Database;
};

export const productPutHandler = async (c: Context<{ Bindings: Bindings }>) => {
  // URLパラメータからIDを取得
  const id = c.req.param("id");

  // 更新用スキーマ ※全フィールドが任意で更新可能
  const bodySchema = z
    .object({
      name: z.string().min(1, "商品名は必須です").optional(),
      description: z.string().optional(),
      price: z.number().positive("正の値を指定してください").optional(),
      stock: z.number().int().nonnegative("在庫は0以上の整数").optional(),
      category_id: z.number().int().optional(),
      image_url: z.string().url("有効なURLを指定してください").optional(),
    })
    .strict();

  const parsed = bodySchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  try {
    // 対象商品が存在するか確認
    const existing = await c.env.DB.prepare(
      `
      SELECT * FROM products WHERE id = ?
    `
    )
      .bind(id)
      .first();

    if (!existing) {
      return c.json({ error: "商品が見つかりませんでした" }, 404);
    }

    const { name, description, price, stock, category_id, image_url } =
      parsed.data;

    // 更新実行。更新対象の値が存在する場合のみ置き換え、存在しなければ既存値を維持する方法
    const result = await c.env.DB.prepare(
      `
      UPDATE products
      SET name         = COALESCE(?, name),
          description  = COALESCE(?, description),
          price        = COALESCE(?, price),
          stock        = COALESCE(?, stock),
          category_id  = COALESCE(?, category_id),
          image_url    = COALESCE(?, image_url)
      WHERE id = ?
      RETURNING id, name, price, stock;
    `
    )
      .bind(name, description, price, stock, category_id, image_url, id)
      .first();

    return c.json(result, 200);
  } catch (error) {
    console.error("商品更新失敗:", error);
    return c.json({ error: "商品更新に失敗しました" }, 500);
  }
};
```

### 1-2. 商品削除エンドポイント（DELETE /api/products/:id）

指定した ID の商品が存在すれば削除するシンプルな実装例です。

**backend/src/endpoints/productDelete.ts**

```ts
import { Context } from "hono";

type Bindings = {
  DB: D1Database;
};

export const productDeleteHandler = async (
  c: Context<{ Bindings: Bindings }>
) => {
  const id = c.req.param("id");

  try {
    const result = await c.env.DB.prepare(
      `
      DELETE FROM products WHERE id = ?
    `
    )
      .bind(id)
      .run();

    if (result.changes === 0) {
      return c.json({ error: "商品が見つかりませんでした" }, 404);
    }
    return c.json({ message: "商品を削除しました" }, 200);
  } catch (error) {
    console.error("商品削除失敗:", error);
    return c.json({ error: "商品削除に失敗しました" }, 500);
  }
};
```

---

## 2. フロントエンド実装

### 2-1. 商品更新フォーム（管理者向け）

※既存の値を取得してフォームにプリセットし、編集後に `PUT /api/products/:id` へ送信する例です。以下は Next.js のページコンポーネント例です。

**frontend/app/product/[id]/edit/page.tsx**

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
};

async function fetchProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/${id}`
    );
    if (!res.ok) return null;
    const product: Product = await res.json();
    return product;
  } catch (error) {
    console.error("商品取得エラー:", error);
    return null;
  }
}

export default function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category_id: "",
    image_url: "",
  });
  const [error, setError] = useState<string | null>(null);

  // 初回レンダリング時に商品情報を取得
  useEffect(() => {
    (async () => {
      const data = await fetchProduct(params.id);
      if (data) {
        setProduct(data);
        setForm({
          name: data.name,
          description: data.description,
          price: data.price.toString(),
          stock: data.stock.toString(),
          category_id: "", // 必要に応じて事前取得した値を設定
          image_url: data.image_url || "",
        });
      } else {
        setError("商品が見つかりませんでした");
      }
    })();
  }, [params.id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      ...form,
      price: parseInt(form.price),
      stock: parseInt(form.stock),
      category_id: form.category_id ? parseInt(form.category_id) : undefined,
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/${params.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        setError(err.error?.message || "更新に失敗しました");
        return;
      }
      // 更新後は詳細ページへリダイレクト
      router.push(`/product/${params.id}`);
    } catch (err) {
      console.error("送信エラー:", err);
      setError("ネットワークエラーが発生しました");
    }
  };

  if (error) return <p className="p-6 text-red-500">{error}</p>;
  if (!product) return <p className="p-6">読み込み中...</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">商品更新</h1>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          placeholder="商品名"
          required
          onChange={handleChange}
          value={form.name}
          className="w-full p-2 border rounded"
        />
        <textarea
          name="description"
          placeholder="商品説明"
          onChange={handleChange}
          value={form.description}
          className="w-full p-2 border rounded"
        />
        <input
          name="price"
          type="number"
          placeholder="価格"
          required
          onChange={handleChange}
          value={form.price}
          className="w-full p-2 border rounded"
        />
        <input
          name="stock"
          type="number"
          placeholder="在庫数"
          onChange={handleChange}
          value={form.stock}
          className="w-full p-2 border rounded"
        />
        <input
          name="category_id"
          type="number"
          placeholder="カテゴリID（任意）"
          onChange={handleChange}
          value={form.category_id}
          className="w-full p-2 border rounded"
        />
        <input
          name="image_url"
          type="url"
          placeholder="画像URL（任意）"
          onChange={handleChange}
          value={form.image_url}
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
        >
          更新する
        </button>
      </form>
    </div>
  );
}
```

### 2-2. 削除ボタンと確認ダイアログ

以下は、商品詳細ページ（例：`frontend/app/product/[id]/page.tsx`）に管理者用の削除ボタンを追加する例です。  
※削除処理前にブラウザ標準の `confirm()` を利用して確認ダイアログを表示しています。

```tsx
"use client";

import { useRouter } from "next/navigation";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
};

async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/${id}`
    );
    if (!res.ok) return null;
    const product: Product = await res.json();
    return product;
  } catch (error) {
    console.error("商品取得エラー:", error);
    return null;
  }
}

export default async function ProductDetail({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const product = await getProduct(params.id);

  if (!product) {
    return <p>商品が見つかりませんでした。</p>;
  }

  // 管理者向けに削除ボタンを表示
  const handleDelete = async () => {
    if (!confirm("本当にこの商品を削除してよろしいですか？")) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/${params.id}`,
        {
          method: "DELETE",
        }
      );
      if (res.ok) {
        // 削除成功時は一覧ページなどへ遷移
        router.push("/");
      } else {
        alert("削除に失敗しました");
      }
    } catch (error) {
      console.error("削除エラー:", error);
      alert("ネットワークエラーが発生しました");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{product.name}</h1>
      <img src={product.image_url} alt={product.name} className="mb-4 w-48" />
      <p className="mb-2">価格: ¥{product.price}</p>
      <p className="mb-2">在庫: {product.stock}個</p>
      <p className="text-gray-700">{product.description}</p>

      {/* 更新・削除用の管理者アクション */}
      <div className="mt-6 space-x-4">
        <button
          onClick={() => router.push(`/product/${params.id}/edit`)}
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
        >
          編集する
        </button>
        <button
          onClick={handleDelete}
          className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
        >
          削除する
        </button>
      </div>
    </div>
  );
}
```

---

## 補足ポイント

- **認証・認可**  
  管理者機能の場合、バックエンド・フロントエンドともに適切な認証や認可の仕組み（セッション、JWT など）を実装して、一般ユーザーから管理機能を隠す設計にしてください。

- **エラーハンドリング**  
  バックエンドでエラー発生時のレスポンスや、フロントエンドでのエラーメッセージ表示など、ユーザー向けのフィードバックを充実させるのが望ましいです。

- **バリデーション強化**  
  PUT エンドポイントでは入力された値が部分更新でも正しく検証されるよう、必要に応じた追加バリデーションを実施してください。

---

以上で、商品更新／削除のエンドポイントと管理者向けフロントエンドの実装例を示しました。これらを参考に実装を進め、必要に応じて改良していきましょう。他にも疑問点や追加の機能について質問があれば、ぜひお知らせください。

# 次はお願いします、カート追加・削除エンドポイント実装。

了解です！以下の 3 つのエンドポイントの実装を進めます。

---

## ✅ **1. 商品更新（PUT /api/products/:id）**

### ファイル: `backend/src/endpoints/productUpdate.ts`

```ts
import { Context } from "hono";
import { Bindings, JwtPayload } from "../types/types";

export const productUpdateHandler = async (
  c: Context<{ Bindings: Bindings; Variables: { jwtPayload?: JwtPayload } }>
): Promise<Response> => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { name, description, price, image_url, category_id } = body;

  if (!name || !price || !category_id) {
    return c.json({ error: "必須項目が不足しています" }, 400);
  }

  try {
    await c.env.DB.prepare(
      `
      UPDATE products
      SET name = ?, description = ?, price = ?, image_url = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    )
      .bind(name, description ?? "", price, image_url ?? "", category_id, id)
      .run();

    return c.json({ success: true });
  } catch (err) {
    console.error("商品更新エラー:", err);
    return c.json({ error: "商品更新に失敗しました" }, 500);
  }
};
```

---

## ✅ **2. 商品削除（DELETE /api/products/:id）**

### ファイル: `backend/src/endpoints/productDelete.ts`

```ts
import { Context } from "hono";
import { Bindings, JwtPayload } from "../types/types";

export const productDeleteHandler = async (
  c: Context<{ Bindings: Bindings; Variables: { jwtPayload?: JwtPayload } }>
): Promise<Response> => {
  const id = c.req.param("id");

  try {
    await c.env.DB.prepare(`DELETE FROM products WHERE id = ?`).bind(id).run();
    return c.json({ success: true });
  } catch (err) {
    console.error("商品削除エラー:", err);
    return c.json({ error: "商品削除に失敗しました" }, 500);
  }
};
```

---

## ✅ **3. ルーティングに追加**

### 修正: `backend/src/routes/index.ts`

```ts
import { productUpdateHandler } from "endpoints/productUpdate";
import { productDeleteHandler } from "endpoints/productDelete";

app
  .put("/api/products/:id", productUpdateHandler)
  .delete("/api/products/:id", productDeleteHandler);
```

---

次に進む前に：

- 商品更新用の **管理画面用フォーム** や、
- 商品削除時の **確認ダイアログと削除処理のフロントエンド実装**

を進めますか？  
それとも、`POST /api/cart`（カートに追加）と`DELETE /api/cart/:productId`（カート削除）に行きますか？
了解、きっちりまとめて、洩れなく、ダラダラせず、**カートの追加（POST）・更新（PUT）・削除（DELETE）**を**バックエンド（Cloudflare Workers）とフロントエンド（Next.js + Axios）両方**に実装します。

---

# ✅ バックエンド（Cloudflare Workers）

## 🔧 1. D1 データベース構造

```sql
CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  session_id TEXT,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

- 認証済みユーザー：`user_id`
- 未ログイン：`session_id`
- 同一ユーザー + 同一商品 が重複しないように、取得時に条件指定

---

## 📁 2. API エンドポイント：`backend/src/endpoints/cart.ts`

```ts
import { Context } from "hono";
import { Bindings, JwtPayload } from "../types/types";

type CartRequest = {
  product_id: number;
  quantity: number;
};

// 共通の識別子を取得
function getIdentifier(
  c: Context<{ Bindings: Bindings; Variables: { jwtPayload?: JwtPayload } }>
) {
  const user_id = c.get("jwtPayload")?.user_id;
  const session_id = c.req.header("x-session-id");
  if (!user_id && !session_id)
    throw new Error("user_id または session_id が必要です");
  const key = user_id ? "user_id" : "session_id";
  const value = user_id ?? session_id;
  return { key, value };
}

// POST /api/cart - 商品追加（存在すれば加算）
export async function cartPostHandler(c: Context) {
  const { product_id, quantity } = await c.req.json<CartRequest>();
  const { key, value } = getIdentifier(c);

  const existing = await c.env.DB.prepare(
    `SELECT id, quantity FROM cart_items WHERE ${key} = ? AND product_id = ?`
  )
    .bind(value, product_id)
    .first();

  if (existing) {
    await c.env.DB.prepare(`UPDATE cart_items SET quantity = ? WHERE id = ?`)
      .bind(existing.quantity + quantity, existing.id)
      .run();
  } else {
    await c.env.DB.prepare(
      `INSERT INTO cart_items (product_id, quantity, ${key}) VALUES (?, ?, ?)`
    )
      .bind(product_id, quantity, value)
      .run();
  }

  return c.json({ success: true });
}

// PUT /api/cart - 数量を更新（完全上書き）
export async function cartPutHandler(c: Context) {
  const { product_id, quantity } = await c.req.json<CartRequest>();
  const { key, value } = getIdentifier(c);

  await c.env.DB.prepare(
    `UPDATE cart_items SET quantity = ? WHERE ${key} = ? AND product_id = ?`
  )
    .bind(quantity, value, product_id)
    .run();

  return c.json({ success: true });
}

// DELETE /api/cart/:productId - 商品削除
export async function cartDeleteHandler(c: Context) {
  const productId = Number(c.req.param("productId"));
  const { key, value } = getIdentifier(c);

  await c.env.DB.prepare(
    `DELETE FROM cart_items WHERE ${key} = ? AND product_id = ?`
  )
    .bind(value, productId)
    .run();

  return c.json({ success: true });
}
```

---

## 🔗 3. ルーティング登録：`backend/src/routes/index.ts`

```ts
import {
  cartPostHandler,
  cartPutHandler,
  cartDeleteHandler,
} from "../endpoints/cart";

app
  .post("/api/cart", cartPostHandler)
  .put("/api/cart", cartPutHandler)
  .delete("/api/cart/:productId", cartDeleteHandler);
```

---

# ✅ フロントエンド（Next.js + Axios）

## 📁 `lib/api/cart.ts`

```ts
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8787";

export async function addToCart(productId: number, quantity = 1) {
  await axios.post(`${API_BASE}/api/cart`, {
    product_id: productId,
    quantity,
  });
}

export async function updateCart(productId: number, quantity: number) {
  await axios.put(`${API_BASE}/api/cart`, {
    product_id: productId,
    quantity,
  });
}

export async function removeFromCart(productId: number) {
  await axios.delete(`${API_BASE}/api/cart/${productId}`);
}
```

---

## ✅ 使い方例：`components/ProductCard.tsx`

```tsx
import { addToCart, updateCart, removeFromCart } from "@/lib/api/cart";

const handleAdd = async () => {
  await addToCart(product.id, 1);
};

const handleUpdate = async () => {
  await updateCart(product.id, 5);
};

const handleDelete = async () => {
  await removeFromCart(product.id);
};
```

---

# ✅ まとめ

| 機能       | メソッド | エンドポイント         | フロントエンド関数          |
| ---------- | -------- | ---------------------- | --------------------------- |
| カート追加 | `POST`   | `/api/cart`            | `addToCart(productId)`      |
| 数量更新   | `PUT`    | `/api/cart`            | `updateCart(productId)`     |
| 商品削除   | `DELETE` | `/api/cart/:productId` | `removeFromCart(productId)` |

---

必要があれば「カート一覧取得（GET）」もすぐ追加可能です。次にやりますか？

# 次はお願いします。ユーザーログインの backend と frontend の実装

了解です。**ユーザーログインの実装（バックエンドとフロントエンド）**をまとめて、**「管理者」と「一般購入者」**の権限にも対応します。

---

## ✅ 要件整理

- **認証方式**：メール＋パスワードのログイン
- **JWT トークンで認証**
- **ユーザー種別**（role）で権限分岐：
  - `admin`：管理者
  - `user`：購入者（一般ユーザー）

---

# ✅ バックエンド（Cloudflare Workers）

## 🗃️ 1. データベーススキーマ（`schema.sql`）

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', -- 'admin' または 'user'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔐 2. JWT ヘルパー関数（`utils/jwt.ts`）

```ts
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode("your-secret-key");

export async function signJwt(payload: any): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyJwt(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload;
}
```

---

## 🔐 3. 認証 API（`endpoints/auth.ts`）

```ts
import { Context } from "hono";
import { signJwt } from "../utils/jwt";
import { hashSync, compareSync } from "bcryptjs";

export async function loginHandler(c: Context) {
  const { email, password } = await c.req.json();

  const user = await c.env.DB.prepare(
    `SELECT id, email, password_hash, role FROM users WHERE email = ?`
  )
    .bind(email)
    .first();

  if (!user || !compareSync(password, user.password_hash)) {
    return c.json({ error: "認証失敗" }, 401);
  }

  const token = await signJwt({
    user_id: user.id,
    role: user.role,
    email: user.email,
  });

  return c.json({ token });
}
```

---

## 🔗 4. ルート登録（`routes/index.ts`）

```ts
import { loginHandler } from "../endpoints/auth";

app.post("/api/login", loginHandler);
```

---

# ✅ フロントエンド（Next.js）

## 📁 1. API 呼び出し（`lib/api/auth.ts`）

```ts
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8787";

export async function login(email: string, password: string): Promise<string> {
  const res = await axios.post(`${API_BASE}/api/login`, { email, password });
  const { token } = res.data;
  localStorage.setItem("token", token);
  return token;
}
```

---

## 🧠 2. ユーザー状態管理（`lib/auth.ts`）

```ts
import jwtDecode from "jwt-decode";

type User = {
  user_id: number;
  email: string;
  role: "admin" | "user";
};

export function getCurrentUser(): User | null {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    return jwtDecode<User>(token);
  } catch {
    return null;
  }
}

export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === "admin";
}
```

---

## 🧪 3. 使用例（`components/Dashboard.tsx`）

```tsx
import { getCurrentUser, isAdmin } from "@/lib/auth";

const Dashboard = () => {
  const user = getCurrentUser();

  return (
    <div>
      <p>こんにちは、{user?.email}</p>
      {isAdmin() ? <p>あなたは管理者です</p> : <p>あなたは一般ユーザーです</p>}
    </div>
  );
};
```

---

# ✅ 認証と権限分岐まとめ

| 対応項目      | バックエンド                | フロントエンド                 |
| ------------- | --------------------------- | ------------------------------ |
| ログイン API  | `/api/login` → JWT 返却     | `login(email, pass)`で呼び出し |
| JWT 生成/検証 | `signJwt()` / `verifyJwt()` | `jwt-decode`でユーザー情報取得 |
| 権限確認      | `role === 'admin'` 判定     | `isAdmin()` により判別         |

---

# ✅ 次のステップ

- ユーザー登録（サインアップ）も追加しますか？
- `middleware` による JWT チェックと `role` によるアクセス制限も可能です（管理者ページ保護など）

ご希望あればそのまま進めます！

# 次はお願いします。商品検索機能を実装してください。

完璧です。いただいた DB スキーマに基づいて、**全文検索＋キーワードハイライト機能付きの商品検索機能**（バックエンド＋フロントエンド）を実装します！

---

## ✅ 目標

- 検索対象：`products.name` + `products.description`
- FTS5 の仮想テーブル `products_fts` を活用
- **検索ワードをハイライト表示**（`snippet()` 関数）
- 結果に商品情報（`id`, `name`, `price`, `highlighted_name`, `highlighted_description`）を含む

---

# 🔧 バックエンド（Cloudflare Workers）

### 🔍 `endpoints/productSearch.ts`

```ts
import { Context } from "hono";

export async function productSearchHandler(c: Context) {
  const { q } = c.req.query();

  if (!q || q.trim() === "") {
    return c.json({ products: [] });
  }

  const keyword = `%${q.trim()}%`;

  const results = await c.env.DB.prepare(
    `
    SELECT 
      p.id,
      p.price,
      snippet(products_fts, 0, '<mark>', '</mark>', '...', 10) AS highlighted_name,
      snippet(products_fts, 1, '<mark>', '</mark>', '...', 10) AS highlighted_description
    FROM products_fts
    JOIN products p ON products_fts.rowid = p.id
    WHERE products_fts MATCH ?
    ORDER BY rank
    LIMIT 20
  `
  )
    .bind(q)
    .all();

  return c.json({ products: results.results });
}
```

### ✅ ルート追加（`routes/index.ts`）

```ts
import { productSearchHandler } from "../endpoints/productSearch";

app.get("/api/products/search", productSearchHandler);
```

---

# 💻 フロントエンド（Next.js）

### 📦 `lib/api/products.ts`

```ts
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8787";

export async function searchProducts(query: string) {
  const res = await axios.get(
    `${API_BASE}/api/products/search?q=${encodeURIComponent(query)}`
  );
  return res.data.products;
}
```

---

### 🔎 検索 UI コンポーネント（例：`components/SearchResults.tsx`）

```tsx
import { useState } from "react";
import { searchProducts } from "@/lib/api/products";

export default function SearchResults() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const res = await searchProducts(query);
    setResults(res);
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="商品を検索"
          className="border px-3 py-2 w-full rounded"
        />
      </form>

      <ul className="space-y-4">
        {results.map((item) => (
          <li key={item.id} className="p-4 border rounded shadow">
            <h2
              className="text-xl font-semibold"
              dangerouslySetInnerHTML={{ __html: item.highlighted_name }}
            />
            <p
              className="text-sm text-gray-600"
              dangerouslySetInnerHTML={{ __html: item.highlighted_description }}
            />
            <p className="mt-2 font-bold text-right">¥{item.price}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## ✅ 完成イメージ

- `GET /api/products/search?q=スニーカー`
  → FTS5 で部分一致し、`<mark>スニーカー</mark>` として返却
- フロントエンドでは `dangerouslySetInnerHTML` でハイライト表示

---

### 🔒 セキュリティ注意：

- SQLite FTS の `MATCH` に渡すキーワードはユーザー入力をそのまま使って OK ですが、SQL インジェクションは `.bind()` で防いでます。

---

## ✅ 次に進めること

- 検索結果に画像も表示する？
- ソート（価格順・新着順）やフィルタ（カテゴリなど）追加？
- 検索履歴の保存？

ご希望あれば続けて実装します！
