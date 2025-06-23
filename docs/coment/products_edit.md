## 商品詳細ページコンポーネント

### (frontend/app/products/edit/[id]/page.tsx)

```tsx
//frontend/app/products/edit/[id]/page.tsx
"use client";

import { FormProvider, useForm } from "react-hook-form";
// @ts-ignore
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useAuth } from "../../../../components/AuthProvider";
import ProductImageUpload from "../../../../components/ProductImageUpload";

type Category = {
  id: number;
  name: string;
};

type ProductImage = {
  id: number;
  url: string;
  is_main: boolean;
};

type ProductData = {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category_id: number | null;
  images: {
    main: ProductImage | null;
    additional: ProductImage[];
  };
};

const formSchema = z.object({
  name: z.string().min(1, "商品名は必須です"),
  description: z.string().optional(),
  price: z.number().min(0, "価格は0以上で入力してください"),
  stock: z.number().min(0, "在庫数は0以上で入力してください"),
  category_id: z.number().nullable().optional(),
  images: z.object({
    main: z
      .union([z.instanceof(File), z.string()])
      .optional()
      .nullable(),
    additional: z
      .array(
        z.object({
          url: z.union([z.string(), z.instanceof(File)]),
          is_main: z.boolean(),
        })
      )
      .optional(),
    keepImageIds: z.array(z.number()).default([]),
    deletedImageIds: z.array(z.number()).default([]),
  }),
});

export type ProductFormValues = z.infer<typeof formSchema>;

export default function ProductEditPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { currentUser, isLoggedIn, isLoading: authLoading } = useAuth();
  const [initialData, setInitialData] = useState<{ data: ProductData } | null>(
    null
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formInitialized, setFormInitialized] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8787";
  const traceId = useRef<string>(
    Math.random().toString(36).substring(2, 11)
  ).current;

  const methods = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock: 0,
      category_id: null,
      images: {
        main: null,
        additional: [],
        keepImageIds: [],
        deletedImageIds: [],
      },
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = methods;

  // メイン画像と追加画像をメモ化
  const mainImageProp = useMemo(() => {
    const mainImage = watch("images.main");
    if (!mainImage) return undefined;

    return typeof mainImage === "string"
      ? {
          id: initialData?.data.images.main?.id || -1,
          url: mainImage,
          is_main: true,
        }
      : mainImage instanceof File
      ? {
          id: -1,
          url: URL.createObjectURL(mainImage),
          is_main: true,
        }
      : undefined;
  }, [watch("images.main"), initialData?.data.images.main?.id]);

  const additionalImagesProp = useMemo(() => {
    const initialAdditional =
      initialData?.data.images.additional?.map((img) => ({
        id: img.id,
        url: img.url,
        is_main: false,
      })) || [];

    const newAdditional = (watch("images.additional") || [])
      .filter((img) => img.url instanceof File)
      .map((img, index) => ({
        id: -index - 1,
        url: URL.createObjectURL(img.url as File),
        is_main: false,
      }));

    return [...initialAdditional, ...newAdditional];
  }, [watch("images.additional"), initialData?.data.images.additional]);

  // データ取得
  useEffect(() => {
    if (authLoading) return;

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("jwtToken");
        if (!token) throw new Error("認証トークンがありません");

        const [productRes, categoriesRes] = await Promise.all([
          fetch(`${baseUrl}/api/products/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${baseUrl}/api/categories`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!productRes.ok) throw new Error("商品が見つかりません");
        const productData = await productRes.json();

        if (!categoriesRes.ok) {
          console.error("カテゴリ取得エラー:", categoriesRes.status);
          setCategories([]);
        } else {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData.data || []);
        }

        const additionalImageIds =
          productData.data.images.additional?.map(
            (img: ProductImage) => img.id
          ) ?? [];

        reset({
          name: productData.data.name,
          description: productData.data.description || "",
          price: productData.data.price,
          stock: productData.data.stock,
          category_id: productData.data.category_id
            ? Number(productData.data.category_id)
            : null,
          images: {
            main: productData.data.images.main?.url || undefined,
            additional:
              productData.data.images.additional?.map((img: ProductImage) => ({
                url: img.url,
                is_main: false,
              })) ?? [],
            keepImageIds: [
              productData.data.images.main?.id,
              ...additionalImageIds,
            ].filter((id): id is number => !!id),
            deletedImageIds: [],
          },
        });

        setInitialData(productData);
        setFormInitialized(true);
      } catch (error) {
        console.error("データ取得エラー:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, reset, authLoading]);

  const handleDelete = async () => {
    if (
      !confirm("この商品を削除しますか？関連する画像ファイルも削除されます。")
    ) {
      return;
    }

    if (!isLoggedIn || currentUser?.role !== "admin") {
      return;
    }

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) throw new Error("認証トークンがありません");

      const res = await fetch(`${baseUrl}/api/products/${params.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "削除に失敗しました");
      }

      alert("商品を削除しました");
      router.push("/products");
    } catch (error) {
      console.error("削除エラー:", error);
      alert(
        `商品の削除に失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const onSubmit = useCallback(
    async (data: ProductFormValues) => {
      if (!isLoggedIn || currentUser?.role !== "admin") {
        redirect("/");
        return;
      }

      try {
        if (!data.images.main) {
          alert("メイン画像を選択してください");
          return;
        }

        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("description", data.description || "");
        formData.append("price", data.price.toString());
        formData.append("stock", data.stock.toString());
        formData.append("category_id", data.category_id?.toString() || "");

        data.images.keepImageIds.forEach((id) => {
          formData.append("keepImageIds", id.toString());
        });

        data.images.deletedImageIds.forEach((id) => {
          formData.append("deleteImageIds", id.toString());
        });

        if (typeof data.images.main === "string") {
          formData.append("mainImage", data.images.main);
        } else {
          formData.append("mainImage", data.images.main);
        }

        data.images.additional?.forEach((img) => {
          if (img.url instanceof File) {
            formData.append("additionalImages", img.url);
          }
        });

        const token = localStorage.getItem("jwtToken");
        if (!token) throw new Error("認証トークンがありません");

        const res = await fetch(`${baseUrl}/api/products/edit/${params.id}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error?.message || "更新に失敗しました");
        }

        const result = await res.json();
        console.log("✅ 商品更新成功:", result);
        router.push(`/products/${params.id}`);
      } catch (error) {
        console.error("❌ 更新エラー:", error);
        alert(
          `商品の更新に失敗しました: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    },
    [isLoggedIn, currentUser?.role, params.id, router]
  );

  if (authLoading || loading || !formInitialized) {
    return <div className="text-center py-8">読み込み中...</div>;
  }
  if (!isLoggedIn) {
    return <div className="text-center py-8">ログインが必要です</div>;
  }
  if (currentUser?.role !== "admin") {
    return <div className="text-center py-8">管理者権限が必要です</div>;
  }
  if (!initialData) {
    return <div className="text-center py-8">商品が見つかりません</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">商品編集</h1>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block font-medium">商品名</label>
              <input
                {...register("name")}
                type="text"
                className="w-full p-2 border rounded"
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block font-medium">価格</label>
              <input
                {...register("price", { valueAsNumber: true })}
                type="number"
                min="0"
                className="w-full p-2 border rounded"
              />
              {errors.price && (
                <p className="text-red-500 text-sm">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block font-medium">カテゴリ</label>
              <select
                {...register("category_id", {
                  setValueAs: (value) => (value === "" ? null : Number(value)),
                })}
                className="w-full p-2 border rounded"
              >
                <option value="">選択なし</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="text-red-500 text-sm">
                  {errors.category_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block font-medium">在庫数</label>
              <input
                {...register("stock", { valueAsNumber: true })}
                type="number"
                min="0"
                className="w-full p-2 border rounded"
              />
              {errors.stock && (
                <p className="text-red-500 text-sm">{errors.stock.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-medium">商品説明</label>
            <textarea
              {...register("description")}
              rows={5}
              className="w-full p-2 border rounded"
            />
            {errors.description && (
              <p className="text-red-500 text-sm">
                {errors.description.message}
              </p>
            )}
          </div>

          <ProductImageUpload
            mainImage={mainImageProp}
            additionalImages={additionalImagesProp}
            onMainImageChange={(file) => setValue("images.main", file)}
            onAdditionalImageChange={(files, ids) => {
              setValue("images.additional", [
                ...(watch("images.additional") || []),
                ...files,
              ]);
              setValue("images.keepImageIds", ids);
            }}
            onDeleteMainImage={(id) => {
              if (id) {
                const currentIds = watch("images.deletedImageIds") || [];
                if (!currentIds.includes(id)) {
                  setValue("images.deletedImageIds", [...currentIds, id]);
                }
              }
              setValue("images.main", null);
            }}
            onDeleteAdditionalImage={(index, id) => {
              if (id) {
                const currentIds = watch("images.deletedImageIds") || [];
                if (!currentIds.includes(id)) {
                  setValue("images.deletedImageIds", [...currentIds, id]);
                }
              }
              setValue(
                "images.additional",
                (watch("images.additional") || []).filter((_, i) => i !== index)
              );
            }}
          />

          <div className="flex justify-end space-x-4 pt-4">
            <div>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting || isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-red-300"
              >
                {isDeleting ? "削除中..." : "商品を削除"}
              </button>
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border rounded"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
              >
                {isSubmitting ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
```

この `ProductEditPage` コンポーネントは、**既存の商品情報を編集する管理画面ページ**の実装です。以下のような技術と機能が使われています：

---

## ✅ 技術スタック

- **React / Next.js App Router**
- **react-hook-form**：フォーム管理
- **zod + zodResolver**：バリデーション
- **FormProvider**：`useFormContext`を子コンポーネントでも使えるように
- **useEffect / useMemo / useCallback**：パフォーマンス最適化
- **ProductImageUpload**：画像のアップロード・削除 UI
- **fetch API**：API 連携（商品情報取得・更新・削除）

---

## 🧠 機能概要

| 機能                      | 説明                                                                    |
| ------------------------- | ----------------------------------------------------------------------- |
| 商品情報の取得            | `useEffect`内で API から該当商品のデータとカテゴリ一覧を取得します      |
| 商品情報の初期表示・編集  | 取得したデータを`react-hook-form`で管理し、初期値としてフォームにセット |
| 画像のアップロード / 削除 | `ProductImageUpload`を通して画像の選択・削除・Form への反映を行います   |
| 商品の更新                | 送信ボタンで`onSubmit`実行、`FormData`に変換して PUT リクエスト送信     |
| 商品の削除                | 削除ボタン押下で`DELETE`リクエストを送信し、成功すれば商品一覧へ遷移    |
| 管理者チェック・認証制限  | `useAuth`を使ってログイン確認、管理者以外はフォームを表示しない         |

---

## 🔍 重要ポイントの解説

### 1. **フォームバリデーション（`zod` + `react-hook-form`）**

```ts
const formSchema = z.object({
  name: z.string().min(1, "商品名は必須です"),
  ...
});
const methods = useForm({
  resolver: zodResolver(formSchema),
  defaultValues: { ... },
});
```

- `zod`でスキーマを定義し、それを`zodResolver`でバリデーションに適用します。
- バリデーションエラーは`errors.xxx.message`で取得され、表示されます。

---

### 2. **画像の管理（ProductImageUpload 連携）**

```tsx
<ProductImageUpload
  mainImage={mainImageProp}
  additionalImages={additionalImagesProp}
  onMainImageChange={(file) => setValue("images.main", file)}
  onAdditionalImageChange={(files, ids) => {
    setValue("images.additional", [...(watch("images.additional") || []), ...files]);
    setValue("images.keepImageIds", ids);
  }}
  ...
/>
```

- `ProductImageUpload` はメイン画像と追加画像の状態をローカルで保持しつつ、`setValue()` を通じて `react-hook-form` に状態を伝えます。
- `mainImageProp` / `additionalImagesProp` は `useMemo` によって安定した参照として渡され、無限再レンダリングを防ぎます。

---

### 3. **商品情報取得（useEffect）**

```tsx
useEffect(() => {
  if (authLoading) return;
  const fetchData = async () => {
    const res = await fetch(`${baseUrl}/api/products/${params.id}`)
    ...
    reset({ ...商品データ... })
    setInitialData(productData);
    setFormInitialized(true);
  }
  fetchData();
}, [params.id, reset, authLoading]);
```

- 商品の詳細情報とカテゴリを API から取得。
- `reset()` を使ってフォームに初期値をセット。

---

### 4. **onSubmit の中身（更新処理）**

```ts
const onSubmit = async (data: ProductFormValues) => {
  const formData = new FormData();
  formData.append("name", data.name);
  ...
  formData.append("mainImage", data.images.main);
  data.images.additional?.forEach(img => {
    if (img.url instanceof File) formData.append("additionalImages", img.url);
  });

  const res = await fetch(..., { method: "PUT", body: formData });
};
```

- バリデーション済みのフォームデータを `FormData` に変換。
- 新しく追加された画像は `File` として追加されます。

---

### 5. **削除処理**

```tsx
const handleDelete = async () => {
  const res = await fetch(`${baseUrl}/api/products/${params.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  router.push("/products");
};
```

- `DELETE` リクエストで商品削除 → 商品一覧ページに遷移

---

### 6. **認証チェック**

```tsx
if (!isLoggedIn) return <div>ログインが必要です</div>;
if (currentUser?.role !== "admin") return <div>管理者権限が必要です</div>;
```

- 認証とロールを厳密にチェックして、非管理者の不正アクセスを防止。

---

## 📦 ファイル構成上の関係

```text
components/
├── ProductImageUpload.tsx ← 画像アップロードUI
├── AuthProvider.tsx ← ログインユーザー情報
app/
└── products/
    └── edit/[id]/page.tsx ← ★このファイル
```

---

## 💡 まとめ：このページがやってること

| ステップ | 処理内容                                     |
| -------- | -------------------------------------------- |
| 1        | `useAuth()` で認証ユーザー確認               |
| 2        | `useEffect()` で商品情報・カテゴリを取得     |
| 3        | `react-hook-form` でフォーム管理             |
| 4        | `ProductImageUpload` で画像アップロード      |
| 5        | `onSubmit` で `PUT` API へ更新リクエスト送信 |
| 6        | `handleDelete` で商品削除                    |

---

必要であれば「画像処理部分だけ解説してほしい」や「zod と react-hook-form の連携だけ詳しく知りたい」などのフォーカスした解説もできます。お気軽にどうぞ！
