# useForm コアフック関数

```tsx
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

        if (data.images.main) {
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

# `useForm` の解説

`useForm` は React Hook Form ライブラリのコアフックで、フォームの状態管理、バリデーション、送信処理などを簡単に実装できるようにします。このコードでは商品編集フォームを実装するために使用されています。

## 主な機能と役割

### 1. **フォームの初期化**

```typescript
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
```

- **`resolver`**: Zod スキーマを使用したバリデーションを設定
- **`defaultValues`**: フォームの初期値を設定
- 型安全にフォームを管理するために `ProductFormValues` 型をジェネリックで指定

### 2. **フォームコントロールの取得**

```typescript
const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
  reset,
  setValue,
  watch,
} = methods;
```

- **`register`**: 入力要素をフォームに登録
- **`handleSubmit`**: フォーム送信ハンドラー
- **`formState`**: フォームの状態（エラー、送信中状態など）
- **`reset`**: フォームをリセット
- **`setValue`**: プログラムでフォーム値を設定
- **`watch`**: フォーム値を監視

### 3. **バリデーション**

Zod スキーマ (`formSchema`) を使用してバリデーションを定義:

```typescript
const formSchema = z.object({
  name: z.string().min(1, "商品名は必須です"),
  description: z.string().optional(),
  price: z.number().min(0, "価格は0以上で入力してください"),
  stock: z.number().min(0, "在庫数は0以上で入力してください"),
  // ...その他のフィールド
});
```

- 各フィールドにバリデーションルールを設定
- エラーメッセージをカスタマイズ可能
- 型安全なフォームデータを保証

### 4. **フォーム値の監視と操作**

```typescript
// 値の監視
const mainImage = watch("images.main");

// 値の設定
setValue("name", "新しい商品名");

// フォームリセット
reset({
  name: "初期値",
  // ...
});
```

### 5. **フォーム送信処理**

```typescript
const onSubmit = useCallback(
  async (data: ProductFormValues) => {
    // 送信処理
  },
  [dependencies]
);

// フォームに接続
<form onSubmit={handleSubmit(onSubmit)}>
```

- `handleSubmit` がバリデーションを実行
- バリデーション通過後、`onSubmit` が実行
- エラーがあれば自動的にハンドリング

## この実装の特徴

1. **型安全**:

   - TypeScript と Zod を組み合わせて完全な型安全性を実現
   - フォーム値、バリデーション、イベントハンドラーの型が全て整合

2. **パフォーマンス最適化**:

   - `useCallback` や `useMemo` で不必要な再レンダリングを防止
   - フォームの状態更新が効率的

3. **複雑なデータ構造の処理**:

   - 画像アップロード（メイン画像、追加画像）
   - 画像の削除管理（`deletedImageIds`）
   - 既存画像の保持（`keepImageIds`）

4. **UI 統合**:

   - `ProductImageUpload` コンポーネントと連携
   - フォーム状態を子コンポーネントと共有（`FormProvider` 使用）

5. **エラーハンドリング**:
   - バリデーションエラーを UI に表示
   - API エラーをキャッチしてユーザーに通知

## 使用されている主要な React Hook Form API

| API            | 説明                                      |
| -------------- | ----------------------------------------- |
| `useForm`      | フォームのコアフック                      |
| `FormProvider` | フォーム状態を子コンポーネントと共有      |
| `register`     | 入力要素をフォームに登録                  |
| `handleSubmit` | フォーム送信ハンドラー                    |
| `watch`        | フォーム値の監視                          |
| `setValue`     | プログラムで値を設定                      |
| `reset`        | フォームをリセット                        |
| `formState`    | フォーム状態（errors, isSubmitting など） |

この実装は、React Hook Form のほぼ全ての主要機能を活用した、実践的なフォーム管理の良い例です。複雑なフォームでもパフォーマンスを維持しつつ、開発者体験とユーザー体験の両方を向上させる設計になります。
