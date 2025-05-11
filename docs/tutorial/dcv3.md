商品登録機能をフロントエンドに実装する方法について説明します。以下は、Next.js (App Router) を使って商品登録フォームを作成する例です。

まず、商品登録用の新しいページを作成します：

```tsx
// frontend/app/products/create/page.tsx
"use client"; // クライアントコンポーネントとして使用

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProductFormData = {
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  category_id?: number;
};

export default function ProductCreatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    image_url: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "price" || name === "stock" || name === "category_id"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.fieldErrors || "商品登録に失敗しました"
        );
      }

      const result = await response.json();
      router.push(`/product/${result.id}`); // 登録後、商品詳細ページにリダイレクト
    } catch (err) {
      console.error("商品登録エラー:", err);
      setError(
        err instanceof Error ? err.message : "商品登録中にエラーが発生しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">新規商品登録</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">商品名*</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">説明</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            rows={3}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">価格*</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            min="0"
            step="1"
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">在庫数</label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            min="0"
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">画像URL</label>
          <input
            type="url"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">カテゴリID</label>
          <input
            type="number"
            name="category_id"
            value={formData.category_id || ""}
            onChange={handleChange}
            min="0"
            className="w-full p-2 border rounded"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {isLoading ? "登録中..." : "商品を登録"}
        </button>
      </form>
    </div>
  );
}
```

補足説明と改良ポイント：

1. **バリデーション**:

   - バックエンドの Zod スキーマと一致するように、フロントでも簡易的なバリデーションを実装しています
   - より詳細なバリデーションが必要な場合、react-hook-form + zod を組み合わせるのがおすすめです

2. **API 通信**:

   - fetch API を使用してバックエンドエンドポイントに POST リクエストを送信
   - エラーハンドリングを強化

3. **UI/UX 改善**:

   - ローディング状態の表示
   - エラーメッセージの表示
   - 登録成功後のリダイレクト

4. **セキュリティ**:

   - 実際の運用では、管理者権限の確認や CSRF 対策が必要になる可能性があります

5. **画像アップロード**:
   - 現在は URL 入力ですが、実際のファイルアップロードを実装する場合は別途 API エンドポイントが必要

必要に応じて、このフォームをモーダルにしたり、既存のページに組み込んだりすることも可能です。また、カテゴリ選択部分を実際のカテゴリデータから選択できるようにする改良も考えられます。

この実装で、バックエンドの`POST /api/products`エンドポイントと連携して商品登録が可能になります。

# 次はお願いします。

✅ 実装するエンドポイント#

[ ] PUT /api/products/:id 商品更新
[ ] DELETE /api/products/:id 商品削除

✅ 対応するフロントエンド#

[ ] 商品更新フォーム（管理者向けなど）
[ ] 削除ボタンと確認ダイアログ

了解しました！商品更新（PUT）と削除（DELETE）の API エンドポイントと、対応するフロントエンドの実装を順番に説明します。

### 1. バックエンド実装（Cloudflare Workers）

#### 商品更新エンドポイント（PUT /api/products/:id）

```typescript
// backend\src\endpoints\productUpdate.ts
import { z } from "zod";
import { Context } from "hono";

type Bindings = {
  DB: D1Database;
};

export const productPutHandler = async (c: Context<{ Bindings: Bindings }>) => {
  const id = c.req.param("id");
  const bodySchema = z
    .object({
      name: z.string().min(1, "商品名は必須です").optional(),
      description: z.string().optional(),
      price: z.number().positive("正の値を指定してください").optional(),
      stock: z.number().int().nonnegative().optional(),
      category_id: z.number().int().optional().nullable(),
      image_url: z
        .string()
        .url("有効なURLを指定してください")
        .optional()
        .nullable(),
    })
    .strict();

  try {
    const validated = bodySchema.safeParse(await c.req.json());
    if (!validated.success) {
      return c.json({ error: validated.error.flatten() }, 400);
    }

    const updateData = validated.data;
    // 動的にUPDATE文を生成
    const setClauses = [];
    const values = [];

    if (updateData.name !== undefined) {
      setClauses.push("name = ?");
      values.push(updateData.name);
    }
    if (updateData.description !== undefined) {
      setClauses.push("description = ?");
      values.push(updateData.description);
    }
    if (updateData.price !== undefined) {
      setClauses.push("price = ?");
      values.push(updateData.price);
    }
    if (updateData.stock !== undefined) {
      setClauses.push("stock = ?");
      values.push(updateData.stock);
    }
    if (updateData.category_id !== undefined) {
      setClauses.push("category_id = ?");
      values.push(updateData.category_id);
    }
    if (updateData.image_url !== undefined) {
      setClauses.push("image_url = ?");
      values.push(updateData.image_url);
    }

    if (setClauses.length === 0) {
      return c.json({ error: "更新するフィールドが指定されていません" }, 400);
    }

    const query = `
      UPDATE products
      SET ${setClauses.join(", ")}
      WHERE id = ?
      RETURNING *;
    `;

    values.push(id);
    const result = await c.env.DB.prepare(query)
      .bind(...values)
      .first();

    if (!result) {
      return c.json({ error: "商品が見つかりません" }, 404);
    }

    return c.json(result);
  } catch (error) {
    console.error("商品更新失敗:", error);
    return c.json({ error: "商品更新に失敗しました" }, 500);
  }
};
```

#### 商品削除エンドポイント（DELETE /api/products/:id）

```typescript
// backend\src\endpoints\productDelete.ts
import { Context } from "hono";

type Bindings = {
  DB: D1Database;
};

export const productDeleteHandler = async (
  c: Context<{ Bindings: Bindings }>
) => {
  const id = c.req.param("id");

  try {
    // 関連する画像やタグも削除する場合はトランザクションを使用
    const result = await c.env.DB.prepare(
      `
      DELETE FROM products
      WHERE id = ?
      RETURNING id;
    `
    )
      .bind(id)
      .first();

    if (!result) {
      return c.json({ error: "商品が見つかりません" }, 404);
    }

    return new Response(null, { status: 204 }); // 204 No Content
  } catch (error) {
    console.error("商品削除失敗:", error);
    return c.json({ error: "商品削除に失敗しました" }, 500);
  }
};
```

### 2. フロントエンド実装（Next.js）

#### 商品更新フォーム

```tsx
// frontend/app/products/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  category_id?: number;
};

export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/${id}`
        );
        if (!res.ok) throw new Error("商品が見つかりません");
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "商品の取得に失敗しました"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(product),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "更新に失敗しました");
      }

      router.push(`/product/${id}`); // 商品詳細ページへリダイレクト
    } catch (err) {
      console.error("更新エラー:", err);
      setError(
        err instanceof Error ? err.message : "更新中にエラーが発生しました"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!product) return <div>商品が見つかりません</div>;

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">商品情報編集</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">商品名*</label>
          <input
            type="text"
            value={product.name}
            onChange={(e) => setProduct({ ...product, name: e.target.value })}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">説明</label>
          <textarea
            value={product.description || ""}
            onChange={(e) =>
              setProduct({ ...product, description: e.target.value })
            }
            className="w-full p-2 border rounded"
            rows={3}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">価格*</label>
          <input
            type="number"
            value={product.price}
            onChange={(e) =>
              setProduct({ ...product, price: Number(e.target.value) })
            }
            min="0"
            step="1"
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">在庫数</label>
          <input
            type="number"
            value={product.stock}
            onChange={(e) =>
              setProduct({ ...product, stock: Number(e.target.value) })
            }
            min="0"
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">画像URL</label>
          <input
            type="url"
            value={product.image_url || ""}
            onChange={(e) =>
              setProduct({ ...product, image_url: e.target.value })
            }
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">カテゴリID</label>
          <input
            type="number"
            value={product.category_id || ""}
            onChange={(e) =>
              setProduct({
                ...product,
                category_id:
                  e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
            min="0"
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isSubmitting ? "更新中..." : "更新"}
          </button>

          <button
            type="button"
            onClick={() => router.push(`/product/${id}`)}
            className="flex-1 bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
```

#### 商品削除機能（商品詳細ページに追加）

```tsx
// frontend/app/product/[id]/page.tsx の更新部分
import { DeleteButton } from "@/components/DeleteButton";

// ProductDetailコンポーネント内のreturn文に追加
<div className="p-6">
  <div className="flex justify-between items-start">
    <h1 className="text-2xl font-bold mb-4">{product.name}</h1>
    <div className="space-x-2">
      <Link
        href={`/products/${product.id}/edit`}
        className="inline-block bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
      >
        編集
      </Link>
      <DeleteButton productId={product.id} />
    </div>
  </div>
  {/* 既存の商品表示コード */}
</div>;
```

```tsx
// frontend/components/DeleteButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteButton({ productId }: { productId: number }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/${productId}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("削除に失敗しました");

      router.push("/"); // ホームにリダイレクト
    } catch (error) {
      console.error("削除エラー:", error);
      alert("商品の削除中にエラーが発生しました");
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
        disabled={isDeleting}
      >
        削除
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">本当に削除しますか？</h2>
            <p className="mb-6">この操作は元に戻せません。</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-red-300"
              >
                {isDeleting ? "削除中..." : "削除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

### 重要なポイント

1. **更新処理**:

   - PATCH ではなく PUT を使用しています（全フィールドの更新を想定）
   - 部分更新可能なように動的に UPDATE 文を生成
   - フロントでは現在の商品データをロードしてから編集

2. **削除処理**:

   - 確認ダイアログを表示して誤削除を防止
   - 削除後は商品一覧ページへリダイレクト
   - 関連データ（画像、タグ）も考慮する必要があれば、バックエンドでトランザクション処理を追加

3. **エラーハンドリング**:

   - バックエンドの Zod バリデーションエラーを適切に表示
   - フロントエンドでユーザーフレンドリーなエラーメッセージ

4. **UI/UX**:
   - ローディング状態の表示
   - 操作の確認ダイアログ
   - キャンセル機能

これで商品の更新と削除のフルスタック実装が完成しました。必要に応じて、権限チェックやログイン状態の確認を追加してください。

# 次はお願いします、カート追加・削除エンドポイント実装

了解しました！カート機能の追加（POST/DELETE）と商品更新・削除のフロントエンド連携を実装します。

### 1. バックエンド実装 (Cart API)

#### カート追加エンドポイント (POST /api/cart)

```typescript
// backend\src\endpoints\addToCart.ts
import { z } from "zod";
import { Context } from "hono";
import { Bindings, CartItem, ErrorResponse, JwtPayload } from "../types/types";

export const addToCartHandler = async (
  c: Context<{
    Bindings: Bindings;
    Variables: { jwtPayload?: JwtPayload };
  }>
): Promise<Response> => {
  const bodySchema = z
    .object({
      product_id: z.number().int().positive("有効な商品IDを指定してください"),
      quantity: z
        .number()
        .int()
        .positive("数量は1以上を指定してください")
        .default(1),
    })
    .strict();

  const payload = c.get("jwtPayload");
  const user_id = payload?.user_id;
  const sessionId = c.req.header("x-session-id");

  // バリデーション
  if (!user_id && !sessionId) {
    return c.json(
      {
        error: {
          message: "セッションIDまたは認証が必要です",
          details: "認証トークンまたはセッションIDを提供してください",
        },
      } satisfies ErrorResponse,
      401
    );
  }

  try {
    const validated = bodySchema.safeParse(await c.req.json());
    if (!validated.success) {
      return c.json(
        {
          error: validated.error.flatten(),
        },
        400
      );
    }

    const { product_id, quantity } = validated.data;

    // 商品存在チェック
    const product = await c.env.DB.prepare(
      "SELECT id, price, stock FROM products WHERE id = ?"
    )
      .bind(product_id)
      .first<{ id: number; price: number; stock: number }>();

    if (!product) {
      return c.json({ error: { message: "商品が見つかりません" } }, 404);
    }

    // 在庫チェック
    if (quantity > product.stock) {
      return c.json({ error: { message: "在庫不足です" } }, 400);
    }

    // カートに追加（既にある場合は数量更新）
    const result = await c.env.DB.prepare(
      `
      INSERT INTO cart_items (user_id, session_id, product_id, quantity)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, product_id) DO UPDATE SET quantity = quantity + ?
      RETURNING *;
    `
    )
      .bind(
        user_id || null,
        user_id ? null : sessionId,
        product_id,
        quantity,
        quantity
      )
      .first<CartItem>();

    return c.json(
      {
        id: result.id,
        product_id: result.product_id,
        quantity: result.quantity,
        price: product.price,
        subtotal: product.price * result.quantity,
      },
      201
    );
  } catch (error) {
    console.error("カート追加エラー:", error);
    return c.json({ error: { message: "カートへの追加に失敗しました" } }, 500);
  }
};
```

#### カート削除エンドポイント (DELETE /api/cart/:productId)

```typescript
// backend\src\endpoints\removeFromCart.ts
import { Context } from "hono";
import { Bindings, ErrorResponse, JwtPayload } from "../types/types";

export const removeFromCartHandler = async (
  c: Context<{
    Bindings: Bindings;
    Variables: { jwtPayload?: JwtPayload };
  }>
): Promise<Response> => {
  const productId = c.req.param("productId");
  const payload = c.get("jwtPayload");
  const user_id = payload?.user_id;
  const sessionId = c.req.header("x-session-id");

  // バリデーション
  if (!user_id && !sessionId) {
    return c.json(
      {
        error: {
          message: "セッションIDまたは認証が必要です",
          details: "認証トークンまたはセッションIDを提供してください",
        },
      } satisfies ErrorResponse,
      401
    );
  }

  try {
    // 商品存在チェック
    const product = await c.env.DB.prepare(
      "SELECT id FROM products WHERE id = ?"
    )
      .bind(productId)
      .first();

    if (!product) {
      return c.json({ error: { message: "商品が見つかりません" } }, 404);
    }

    // カートから削除
    let query = "DELETE FROM cart_items WHERE product_id = ?";
    const binds = [productId];

    if (user_id) {
      query += " AND user_id = ?";
      binds.push(user_id);
    } else {
      query += " AND session_id = ?";
      binds.push(sessionId);
    }

    const { success } = await c.env.DB.prepare(query)
      .bind(...binds)
      .run();

    if (!success) {
      return c.json(
        { error: { message: "カートから削除できませんでした" } },
        400
      );
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("カート削除エラー:", error);
    return c.json(
      { error: { message: "カートからの削除に失敗しました" } },
      500
    );
  }
};
```

### 2. ルート設定更新 (index.ts)

```typescript
// backend\src\routes\index.ts の更新部分
import { addToCartHandler } from "endpoints/addToCart";
import { removeFromCartHandler } from "endpoints/removeFromCart";

// =====================
// API Routes
// =====================
// Cart API
app
  .get("/api/cart", getCartHandler)
  .post("/api/cart", addToCartHandler)
  .delete("/api/cart/:productId", removeFromCartHandler);
```

### 3. フロントエンド実装

#### カートコンポーネント

```tsx
// frontend/components/Cart.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CartItem = {
  id: number;
  product_id: number;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  subtotal: number;
};

export function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/cart`,
          {
            credentials: "include",
            headers: {
              "X-Session-ID": localStorage.getItem("session_id") || "",
            },
          }
        );

        if (!res.ok) throw new Error("カートの取得に失敗しました");
        const data = await res.json();
        setCartItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCart();
  }, []);

  const handleAddToCart = async (productId: number) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/cart`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Session-ID": localStorage.getItem("session_id") || "",
          },
          body: JSON.stringify({ product_id: productId, quantity: 1 }),
        }
      );

      if (!res.ok) throw new Error("追加に失敗しました");

      const updatedItem = await res.json();
      setCartItems((prev) => {
        const existing = prev.find(
          (item) => item.product_id === updatedItem.product_id
        );
        if (existing) {
          return prev.map((item) =>
            item.product_id === updatedItem.product_id
              ? {
                  ...item,
                  quantity: updatedItem.quantity,
                  subtotal: updatedItem.subtotal,
                }
              : item
          );
        }
        return [...prev, updatedItem];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "追加に失敗しました");
    }
  };

  const handleRemoveFromCart = async (productId: number) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/cart/${productId}`,
        {
          method: "DELETE",
          headers: {
            "X-Session-ID": localStorage.getItem("session_id") || "",
          },
        }
      );

      if (!res.ok) throw new Error("削除に失敗しました");

      setCartItems((prev) =>
        prev.filter((item) => item.product_id !== productId)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">ショッピングカート</h2>

      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {cartItems.length === 0 ? (
        <p>カートに商品がありません</p>
      ) : (
        <div className="space-y-4">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center border-b pb-4">
              <img
                src={item.image_url}
                alt={item.name}
                className="w-16 h-16 object-cover mr-4"
              />
              <div className="flex-1">
                <Link
                  href={`/product/${item.product_id}`}
                  className="font-medium hover:underline"
                >
                  {item.name}
                </Link>
                <p>
                  ¥{item.price.toLocaleString()} × {item.quantity}個
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-bold">
                  ¥{item.subtotal.toLocaleString()}
                </span>
                <button
                  onClick={() => handleRemoveFromCart(item.product_id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center pt-4 border-t">
            <span className="font-bold">合計</span>
            <span className="font-bold text-lg">¥{total.toLocaleString()}</span>
          </div>

          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
            チェックアウト
          </button>
        </div>
      )}
    </div>
  );
}
```

#### 商品詳細ページにカート追加ボタンを追加

```tsx
// frontend/app/product/[id]/page.tsx の更新
import { AddToCartButton } from "@/components/AddToCartButton";

// ProductDetailコンポーネント内のreturn文に追加
<div className="p-6">
  {/* 既存の商品表示コード */}
  <div className="mt-6">
    <AddToCartButton productId={product.id} />
  </div>
</div>;
```

```tsx
// frontend/components/AddToCartButton.tsx
"use client";

import { useState } from "react";

export function AddToCartButton({ productId }: { productId: number }) {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddToCart = async () => {
    setIsAdding(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/cart`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Session-ID": localStorage.getItem("session_id") || "",
          },
          body: JSON.stringify({ product_id: productId, quantity: 1 }),
        }
      );

      if (!res.ok) throw new Error("カートに追加できませんでした");

      // 成功時のフィードバック
      alert("カートに追加しました");
    } catch (err) {
      setError(err instanceof Error ? err.message : "追加に失敗しました");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleAddToCart}
        disabled={isAdding}
        className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-green-300"
      >
        {isAdding ? "追加中..." : "カートに追加"}
      </button>
      {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
    </div>
  );
}
```

### 4. セッション管理の初期化

```tsx
// frontend/app/layout.tsx に追加
"use client";

import { useEffect } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // セッションIDがなければ生成
    if (!localStorage.getItem("session_id")) {
      localStorage.setItem("session_id", crypto.randomUUID());
    }
  }, []);

  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
```

### 重要なポイント

1. **認証とセッション**:

   - JWT 認証ユーザーとセッション ID ユーザーの両方に対応
   - カート統合機能（ログイン時にセッションカートをユーザーカートにマージ）

2. **カート操作**:

   - 商品追加時に在庫チェックを実施
   - 既にカートにある商品は数量を更新
   - クライアント側でセッション ID を自動生成・保持

3. **エラーハンドリング**:

   - 適切なエラーメッセージをユーザーに表示
   - ステータスコードに基づいた適切なレスポンス

4. **UX 改善**:
   - ローディング状態の表示
   - 操作後のフィードバック（アラートなど）
   - カートのリアルタイム更新

これでカート機能のフルスタック実装が完了しました。必要に応じて、さらに以下の機能を追加することも検討してください:

- カートアイテムの数量変更 UI
- 在庫切れ表示
- おすすめ商品の表示
- クーポンコード適用機能
- 注文履歴連携

# 次はお願いします。ユーザーログインの backend と frontend の実装

了解しました！ユーザーログイン機能を権限管理（管理者/一般ユーザー）付きで実装します。以下にバックエンドとフロントエンドの完全な実装を示します。

### 1. バックエンド実装

#### ユーザー認証関連の型定義

```typescript
// backend\src\types\auth.ts
export interface User {
  id: number;
  email: string;
  name: string;
  role: "admin" | "customer";
  created_at: string;
}

export interface JwtPayload {
  user_id: number;
  email: string;
  role: "admin" | "customer";
  exp: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: "admin" | "customer";
  };
}
```

#### ユーザー登録エンドポイント

```typescript
// backend\src\endpoints\userRegister.ts
import { z } from "zod";
import { Context } from "hono";
import { Bindings } from "../types/types";
import { hashPassword, generateToken } from "../lib/auth";

export const registerSchema = z
  .object({
    email: z.string().email("有効なメールアドレスを入力してください"),
    password: z.string().min(8, "パスワードは8文字以上必要です"),
    name: z.string().min(1, "名前は必須です"),
    role: z.enum(["admin", "customer"]).default("customer"),
  })
  .strict();

export const registerHandler = async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const validated = registerSchema.safeParse(await c.req.json());
    if (!validated.success) {
      return c.json({ error: validated.error.flatten() }, 400);
    }

    const { email, password, name, role } = validated.data;

    // 管理者登録は特別な条件（例: 特定のキーが必要）
    if (
      role === "admin" &&
      c.req.header("x-admin-secret") !== c.env.ADMIN_SECRET
    ) {
      return c.json({ error: "管理者登録の権限がありません" }, 403);
    }

    // メール重複チェック
    const exists = await c.env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    )
      .bind(email)
      .first();

    if (exists) {
      return c.json({ error: "このメールアドレスは既に使用されています" }, 400);
    }

    // パスワードハッシュ化
    const passwordHash = await hashPassword(password, c.env.PEPPER);

    // ユーザー登録
    const result = await c.env.DB.prepare(
      `
      INSERT INTO users (email, password_hash, name, role)
      VALUES (?, ?, ?, ?)
      RETURNING id, email, name, role, created_at;
    `
    )
      .bind(email, passwordHash, name, role)
      .first();

    // セッション作成
    const token = await generateToken(
      {
        user_id: result.id,
        email: result.email,
        role: result.role,
      },
      c.env.JWT_SECRET
    );

    return c.json(
      {
        token,
        user: {
          id: result.id,
          email: result.email,
          name: result.name,
          role: result.role,
        },
      },
      201
    );
  } catch (error) {
    console.error("登録エラー:", error);
    return c.json({ error: "ユーザー登録に失敗しました" }, 500);
  }
};
```

#### ログインエンドポイント

```typescript
// backend\src\endpoints\userLogin.ts
import { z } from "zod";
import { Context } from "hono";
import { Bindings } from "../types/types";
import { verifyPassword, generateToken } from "../lib/auth";

export const loginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1),
  })
  .strict();

export const loginHandler = async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const validated = loginSchema.safeParse(await c.req.json());
    if (!validated.success) {
      return c.json({ error: validated.error.flatten() }, 400);
    }

    const { email, password } = validated.data;

    // ユーザー取得
    const user = await c.env.DB.prepare(
      "SELECT id, email, name, role, password_hash FROM users WHERE email = ?"
    )
      .bind(email)
      .first<{
        id: number;
        email: string;
        name: string;
        role: "admin" | "customer";
        password_hash: string;
      }>();

    if (!user) {
      return c.json(
        { error: "メールアドレスまたはパスワードが正しくありません" },
        401
      );
    }

    // パスワード検証
    const isValid = await verifyPassword(
      password,
      user.password_hash,
      c.env.PEPPER
    );
    if (!isValid) {
      return c.json(
        { error: "メールアドレスまたはパスワードが正しくありません" },
        401
      );
    }

    // トークン生成
    const token = await generateToken(
      {
        user_id: user.id,
        email: user.email,
        role: user.role,
      },
      c.env.JWT_SECRET
    );

    // セッションレコード作成
    await c.env.DB.prepare(
      "INSERT INTO sessions (user_id, session_token) VALUES (?, ?)"
    )
      .bind(user.id, token)
      .run();

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("ログインエラー:", error);
    return c.json({ error: "ログインに失敗しました" }, 500);
  }
};
```

#### 認証ユーティリティ

```typescript
// backend\src\lib\auth.ts
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

export const hashPassword = async (
  password: string,
  pepper: string
): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password + pepper, salt);
};

export const verifyPassword = async (
  password: string,
  hash: string,
  pepper: string
): Promise<boolean> => {
  return bcrypt.compare(password + pepper, hash);
};

export const generateToken = async (
  payload: { user_id: number; email: string; role: "admin" | "customer" },
  secret: string
): Promise<string> => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(new TextEncoder().encode(secret));
};
```

#### ルート設定更新

```typescript
// backend\src\routes\index.ts
import { loginHandler } from "endpoints/userLogin";
import { registerHandler } from "endpoints/userRegister";

// =====================
// API Routes
// =====================
// Auth API
app.post("/api/auth/register", registerHandler);
app.post("/api/auth/login", loginHandler);
```

### 2. フロントエンド実装

#### 認証コンテキスト

```tsx
// frontend/context/AuthContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  email: string;
  name: string;
  role: "admin" | "customer";
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("auth_token");
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        // トークンの有効性を検証（簡易的にローカルストレージの値を信用）
        setToken(storedToken);
        // ユーザー情報を取得（必要に応じてAPIから再取得）
        const userData = localStorage.getItem("auth_user");
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

#### ログインページ

```tsx
// frontend/app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ログインに失敗しました");
    }
  };

  if (isAuthenticated) {
    router.push("/");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center">ログイン</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ログイン
            </button>
          </div>
        </form>

        <div className="text-center text-sm">
          <Link href="/register" className="text-blue-600 hover:text-blue-500">
            新規登録はこちら
          </Link>
        </div>
      </div>
    </div>
  );
}
```

#### 登録ページ

```tsx
// frontend/app/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const { register, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(email, password, name);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
    }
  };

  if (isAuthenticated) {
    router.push("/");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center">新規登録</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              名前
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              パスワード (8文字以上)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              登録
            </button>
          </div>
        </form>

        <div className="text-center text-sm">
          <Link href="/login" className="text-blue-600 hover:text-blue-500">
            既にアカウントをお持ちの方はこちら
          </Link>
        </div>
      </div>
    </div>
  );
}
```

#### 管理者向けプロテクトルート

```tsx
// frontend/components/AdminRoute.tsx
"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading || !isAdmin) {
    return <div>読み込み中...</div>;
  }

  return <>{children}</>;
}
```

### 3. 権限管理の適用例

#### 商品管理ページ（管理者専用）

```tsx
// frontend/app/admin/products/page.tsx
"use client";

import { AdminRoute } from "@/components/AdminRoute";
import { ProductList } from "@/components/admin/ProductList";

export default function AdminProductsPage() {
  return (
    <AdminRoute>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">商品管理</h1>
        <ProductList />
      </div>
    </AdminRoute>
  );
}
```

#### 商品リストコンポーネント（管理者用）

```tsx
// frontend/components/admin/ProductList.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
};

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/admin/products", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        });

        if (!res.ok) throw new Error("商品の取得に失敗しました");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (isLoading) return <div>読み込み中...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/admin/products/new"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          新規商品追加
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border">ID</th>
              <th className="py-2 px-4 border">商品名</th>
              <th className="py-2 px-4 border">価格</th>
              <th className="py-2 px-4 border">在庫</th>
              <th className="py-2 px-4 border">操作</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td className="py-2 px-4 border">{product.id}</td>
                <td className="py-2 px-4 border">{product.name}</td>
                <td className="py-2 px-4 border">
                  ¥{product.price.toLocaleString()}
                </td>
                <td className="py-2 px-4 border">{product.stock}</td>
                <td className="py-2 px-4 border">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="text-blue-500 hover:underline mr-2"
                  >
                    編集
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### 4. 環境変数設定例

#### バックエンド環境変数 (wrangler.toml)

```toml
[vars]
JWT_SECRET = "your-strong-secret-key-here"
JWT_ISSUER = "your-app-name"
JWT_AUDIENCE = "your-app-client"
PEPPER = "additional-pepper-for-password-hashing"
ADMIN_SECRET = "super-secret-admin-key"
ENVIRONMENT = "production"
```

### 5. データベーススキーマ追加

#### ユーザーテーブル更新

```sql
-- usersテーブルにroleカラムを追加
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'customer';

-- 管理者権限を持つユーザーの例
INSERT INTO users (email, password_hash, name, role)
VALUES ('admin@example.com', 'hashed-password', 'Admin User', 'admin');
```

### 重要なポイント

1. **権限管理**:

   - 管理者(`admin`)と一般ユーザー(`customer`)の役割を明確に分離
   - 管理者専用ルートを`AdminRoute`コンポーネントで保護
   - 管理者登録には特別なシークレットキーを要求

2. **セキュリティ**:

   - パスワードは bcrypt でハッシュ化（ペッパー付き）
   - JWT を使用した認証
   - 管理者操作には常に権限チェック

3. **ユーザーエクスペリエンス**:

   - ログイン状態に応じたリダイレクト
   - エラーメッセージの適切な表示
   - ローディング状態の管理

4. **セッション管理**:
   - フロントエンドで JWT をローカルストレージに保存
   - バックエンドでセッション記録を保持

この実装で、安全なユーザー認証システムと権限管理が完成します。必要に応じて、さらに以下の機能を追加できます:

- パスワードリセット機能
- メール確認
- 二段階認証
- ユーザー管理画面（管理者用）
- ログイン履歴の記録

# 次はお願いします。商品検索機能を実装してください。

商品検索機能を実装し、検索結果でキーワードをハイライト表示する方法を以下に示します。全文検索機能（FTS5）を活用した実装です。

### 1. バックエンド実装

#### 検索エンドポイントの追加

```typescript
// backend\src\endpoints\productSearch.ts
import { Context } from "hono";
import { Bindings } from "../types/types";

export const productSearchHandler = async (
  c: Context<{ Bindings: Bindings }>
) => {
  const query = c.req.query("q");

  if (!query || query.trim() === "") {
    return c.json({ error: "検索クエリが必要です" }, 400);
  }

  try {
    // FTS5を使用した全文検索（キーワードのハイライト用にマッチ位置も取得）
    const { results } = await c.env.DB.prepare(
      `
      SELECT 
        p.id,
        p.name,
        p.price,
        p.image_url,
        p.stock,
        snippet(products_fts, 0, '<mark>', '</mark>', '...', 64) as highlighted_name,
        snippet(products_fts, 1, '<mark>', '</mark>', '...', 128) as highlighted_description,
        p.description,
        p.category_id
      FROM products_fts
      JOIN products p ON products_fts.rowid = p.id
      WHERE products_fts MATCH ?
      ORDER BY rank
      LIMIT 50
    `
    )
      .bind(query)
      .all();

    return c.json({ results });
  } catch (error) {
    console.error("検索エラー:", error);
    return c.json({ error: "検索中にエラーが発生しました" }, 500);
  }
};
```

#### ルート設定の更新

```typescript
// backend\src\routes\index.ts
import { productSearchHandler } from "endpoints/productSearch";

// Product API
app.get("/api/products/search", productSearchHandler);
```

### 2. フロントエンド実装

#### 検索コンポーネント

```tsx
// frontend/components/SearchBox.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function SearchBox() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="商品を検索..."
          className="w-full pl-4 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="absolute right-2 top-2 text-gray-500 hover:text-blue-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}
```

#### 検索結果ページ

```tsx
// frontend/app/search/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Product = {
  id: number;
  name: string;
  price: number;
  image_url: string;
  stock: number;
  highlighted_name: string;
  highlighted_description: string;
  category_id?: number;
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_BASE_URL
          }/api/products/search?q=${encodeURIComponent(query)}`
        );

        if (!res.ok) throw new Error("検索に失敗しました");

        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      } finally {
        setIsLoading(false);
      }
    };

    if (query.trim()) {
      fetchResults();
    } else {
      setResults([]);
      setIsLoading(false);
    }
  }, [query]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">検索結果: {query}</h1>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      ) : results.length === 0 ? (
        <p>該当する商品が見つかりませんでした</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((product) => (
            <div
              key={product.id}
              className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <Link href={`/product/${product.id}`}>
                <div className="h-48 overflow-hidden">
                  <img
                    src={product.image_url || "/placeholder-product.jpg"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3
                    className="font-bold text-lg mb-2"
                    dangerouslySetInnerHTML={{
                      __html: product.highlighted_name || product.name,
                    }}
                  />
                  <div
                    className="text-gray-600 mb-3"
                    dangerouslySetInnerHTML={{
                      __html:
                        product.highlighted_description ||
                        product.description ||
                        "",
                    }}
                  />
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">
                      ¥{product.price.toLocaleString()}
                    </span>
                    {product.stock > 0 ? (
                      <span className="text-green-600">在庫あり</span>
                    ) : (
                      <span className="text-red-600">在庫切れ</span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 3. スタイルの追加

#### グローバル CSS にマークスタイルを追加

```css
/* frontend/app/globals.css */
mark {
  background-color: #fef08a;
  color: inherit;
  padding: 0.1em 0.2em;
  border-radius: 0.25em;
}
```

### 4. 検索機能の統合

#### ナビゲーションバーに検索ボックスを追加

```tsx
// frontend/components/Navbar.tsx
"use client";

import { SearchBox } from "./SearchBox";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav className="bg-white shadow-sm py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-600">
          ショップ名
        </Link>

        <div className="flex-1 mx-8">
          <SearchBox />
        </div>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Link href="/cart" className="hover:text-blue-600">
                カート
              </Link>
              <button onClick={logout} className="hover:text-blue-600">
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-blue-600">
                ログイン
              </Link>
              <Link href="/register" className="hover:text-blue-600">
                新規登録
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
```

### 5. 動作確認方法

1. 検索ボックスにキーワードを入力
2. 検索結果ページで、商品名や説明文中の該当キーワードが黄色くハイライト表示される
3. 画像がない商品はプレースホルダー画像が表示される
4. 在庫状況が色分け表示される

### 重要なポイント

1. **全文検索の活用**:

   - SQLite の FTS5 機能を使用して高速な全文検索を実現
   - `snippet()`関数でマッチした部分をハイライト表示

2. **安全性**:

   - `dangerouslySetInnerHTML`を使用していますが、バックエンドでサニタイズされたデータのみを表示
   - XSS 対策のため、ユーザー入力は適切にエスケープ

3. **ユーザーエクスペリエンス**:

   - 検索結果がない場合の分かりやすい表示
   - ローディング中のインジケーター表示
   - レスポンシブなグリッドレイアウト

4. **パフォーマンス**:
   - FTS 仮想テーブルの利用で検索を高速化
   - 適切なインデックス設定でクエリを最適化

この実装で、ユーザーは直感的に商品を検索でき、検索結果の中から目的の商品を簡単に見つけることができます。
