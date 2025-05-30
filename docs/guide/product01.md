# 商品編集 0.1

React Hook Form を使用して、データベーススキーマに基づいた商品編集ページを段階的に構築していきましょう。まずは基本的なフォーム構造から始めます。

- フォーム構造はバックエンド API に厳密にあわせなければなりません！

`データベース`

```sql
-- 商品情報
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  stock INTEGER DEFAULT 0,
  category_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
-- 商品画像情報（メイン画像対応）
CREATE TABLE images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  is_main BOOLEAN NOT NULL DEFAULT 0, -- ✅ メイン画像フラグ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

`レスポンス構造`

```json
{
  "success": true,
  "data": {
    "id": 16,
    "name": "川",
    "price": 10000,
    "stock": 100000,
    "images": {
      "main": {
        "id": 79,
        "url": "https://pub-1713e92651fc463cba099b34f8bf5cb1.r2.dev/products/main/bus7lomnlxqklxh0h5hacjjt.jpg",
        "is_main": true,
        "uploaded_at": "2025-05-27T21:52:08.374Z"
      },
      "additional": [
        {
          "id": 80,
          "url": "https://pub-1713e92651fc463cba099b34f8bf5cb1.r2.dev/products/additional/a6l1k3p31fjusy9k2pwc64ts.jpg",
          "is_main": false,
          "uploaded_at": "2025-05-27T21:52:08.374Z"
        },
        {
          "id": 81,
          "url": "https://pub-1713e92651fc463cba099b34f8bf5cb1.r2.dev/products/additional/b49775kz9p0oe1ug90vk343r.jpg",
          "is_main": false,
          "uploaded_at": "2025-05-27T21:52:08.374Z"
        },
        {
          "id": 82,
          "url": "https://pub-1713e92651fc463cba099b34f8bf5cb1.r2.dev/products/additional/ybhljm3ehhmw06ymaxhdpcsv.jpg",
          "is_main": false,
          "uploaded_at": "2025-05-27T21:52:08.374Z"
        },
        {
          "id": 83,
          "url": "https://pub-1713e92651fc463cba099b34f8bf5cb1.r2.dev/products/additional/rm7lzifbu2z6dillf07fntc4.jpg",
          "is_main": false,
          "uploaded_at": "2025-05-27T21:52:08.374Z"
        },
        {
          "id": 84,
          "url": "https://pub-1713e92651fc463cba099b34f8bf5cb1.r2.dev/products/additional/xdc988uoi3oihtezfdaanvxr.jpg",
          "is_main": false,
          "uploaded_at": "2025-05-27T21:52:08.374Z"
        }
      ]
    },
    "createdAt": "2025-05-27T21:52:08.374Z"
  }
}
```

- バックエンド API をしっかり参照しなければならない

[productEditById.ts](/guide/product_edit)を参照して開発しなければならない

### ステップ 1: 親コンポーネント基本フォーム構造の作成

```typescript
// frontend/app/products/edit/[id]/page.tsx
"use client";

import { FormProvider, useForm } from "react-hook-form";
// @ts-ignore
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../../components/AuthProvider";
import ProductImageUpload from "../../../../components/ProductImageUpload";

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
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (authLoading) return;

    const fetchData = async () => {
      try {
        const productRes = await fetch(`${baseUrl}/api/products/${params.id}`);
        if (!productRes.ok) throw new Error("商品が見つかりません");
        const productData = await productRes.json();

        // カテゴリデータ取得
        // const categoriesRes = await fetch(`${baseUrl}/api/categories`, {
        //   method: "GET",
        //   headers: { Authorization: `Bearer ${token}` },
        // });
        //const categoriesData = await categoriesRes.json();
        // setCategories(categoriesData);
        // keepImageIdsに既存の追加画像IDを設定

        const additionalImageIds =
          productData.data.images.additional?.map(
            (img: ProductImage) => img.id
          ) ?? [];
        reset({
          name: productData.data.name,
          description: productData.data.description || "",
          price: productData.data.price,
          stock: productData.data.stock,
          category_id: productData.data.category_id || null,
          images: {
            main: productData.data.images.main?.url || undefined,
            additional:
              productData.data.images.additional.map((img: ProductImage) => ({
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
      } catch (error) {
        console.error("データ取得エラー:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id, reset, authLoading]);

  const onSubmit = async (data: ProductFormValues) => {
    if (!isLoggedIn || currentUser?.role !== "admin") {
      redirect("/");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description || "");
      formData.append("price", data.price.toString());
      formData.append("stock", data.stock.toString());

      if (data.category_id) {
        formData.append("category_id", data.category_id.toString());
      }

      data.images.keepImageIds.forEach((id) => {
        formData.append("keepImageIds", id.toString());
      });

      data.images.deletedImageIds.forEach((id) => {
        formData.append("deleteImageIds", id.toString());
      });

      if (data.images.main && typeof data.images.main !== "string") {
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

      if (!res.ok) throw new Error("更新に失敗しました");
      router.push(`/products/${params.id}`);
    } catch (error) {
      console.error("更新エラー:", error);
      alert("商品の更新に失敗しました");
    }
  };

  if (authLoading || loading)
    return <div className="text-center py-8">読み込み中...</div>;
  if (!isLoggedIn)
    return <div className="text-center py-8">ログインが必要です</div>;
  if (currentUser?.role !== "admin")
    return <div className="text-center py-8">管理者権限が必要です</div>;
  if (!initialData)
    return <div className="text-center py-8">商品が見つかりません</div>;

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

            {/* カテゴリ */}
            {/* {...register("category_id")} 将来でelectの下に追加*/}
            <div className="space-y-2">
              <label className="block font-medium">カテゴリ</label>
              <select className="w-full p-2 border rounded">
                <option value="">選択してください</option>
                {/*categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))*/}
              </select>
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
            mainImage={
              watch("images.main") && typeof watch("images.main") === "string"
                ? {
                    id: initialData.data.images.main?.id || -1,
                    url: watch("images.main") as string,
                    is_main: true,
                  }
                : undefined
            }
            additionalImages={
              initialData.data.images.additional?.map((img) => ({
                id: img.id,
                url: img.url,
                is_main: img.is_main,
              })) || []
            }
            onMainImageChange={(file) => setValue("images.main", file)}
            onAdditionalImageChange={(files) => {
              setValue("images.additional", [
                ...(watch("images.additional") || []),
                ...files,
              ]);
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
        </form>
      </FormProvider>
    </div>
  );
}
```

### ステップ 2: 子コンポーネント画像アップロード機能の追加

```typescript
// frontend/components/ProductImageUpload.tsx
"use client";

import { useFormContext } from "react-hook-form";
import { useEffect, useState, memo, useCallback } from "react";
import Image from "next/image";

type ProductImage = {
  id: number;
  url: string;
  is_main: boolean;
};

type ProductImageUploadProps = {
  mainImage: ProductImage | undefined;
  additionalImages: ProductImage[];
  onMainImageChange: (file: File) => void;
  onAdditionalImageChange: (
    files: Array<{ url: File; is_main: boolean }>,
    ids: number[]
  ) => void;
  onDeleteMainImage: (id: number | null) => void;
  onDeleteAdditionalImage: (index: number, id: number | null) => void;
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// 画像データの比較関数
const areEqual = (
  prevProps: ProductImageUploadProps,
  nextProps: ProductImageUploadProps
) => {
  return (
    prevProps.mainImage?.id === nextProps.mainImage?.id &&
    prevProps.mainImage?.url === nextProps.mainImage?.url &&
    prevProps.additionalImages.length === nextProps.additionalImages.length &&
    prevProps.additionalImages.every(
      (img, i) =>
        img.id === nextProps.additionalImages[i]?.id &&
        img.url === nextProps.additionalImages[i]?.url
    )
  );
};

const ProductImageUpload = memo(function ProductImageUpload({
  mainImage: propMainImage,
  additionalImages: propAdditionalImages,
  onMainImageChange,
  onAdditionalImageChange,
  onDeleteMainImage,
  onDeleteAdditionalImage,
}: ProductImageUploadProps) {
  const { setValue, watch, getValues } = useFormContext();
  const [localMainImage, setLocalMainImage] = useState(propMainImage);
  const [localAdditionalImages, setLocalAdditionalImages] =
    useState(propAdditionalImages);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalMainImage(propMainImage);
  }, [propMainImage]);

  useEffect(() => {
    setLocalAdditionalImages(propAdditionalImages);
  }, [propAdditionalImages]);

  useEffect(() => {
    const currentValues = getValues();
    const keepIds = [
      ...(localMainImage?.id && localMainImage.id > 0
        ? [localMainImage.id]
        : []),
      ...localAdditionalImages.filter((img) => img.id > 0).map((img) => img.id),
    ];
    setValue("images.keepImageIds", keepIds);

    const deletedIds = currentValues.images.deletedImageIds || [];
    setValue("images.deletedImageIds", deletedIds);
  }, [localMainImage, localAdditionalImages, setValue, getValues]);

  const validateFile = useCallback((file: File): boolean => {
    if (file.size > MAX_IMAGE_SIZE) {
      setError(`${file.name} は5MBを超えています`);
      return false;
    }
    if (!file.type.startsWith("image/")) {
      setError(`${file.name} は画像ファイルではありません`);
      return false;
    }
    return true;
  }, []);

  const handleMainImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!validateFile(file)) return;

      const newImage = {
        id: -1,
        url: URL.createObjectURL(file),
        is_main: true,
      };

      if (localMainImage?.id && localMainImage.id > 0) {
        setValue("images.deletedImageIds", [
          ...watch("images.deletedImageIds"),
          localMainImage.id,
        ]);
      }

      setLocalMainImage(newImage);
      onMainImageChange(file);
      setError(null);
    },
    [validateFile, localMainImage, setValue, watch, onMainImageChange]
  );

  const handleAdditionalImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const validFiles = files.filter(validateFile);

      if (validFiles.length === 0) return;

      const newImages = validFiles.map((file) => ({
        id: -1,
        url: URL.createObjectURL(file),
        is_main: false,
      }));

      setLocalAdditionalImages((prev) => [...prev, ...newImages]);

      // 親コンポーネントへのデータ渡し（型エラー解消）
      onAdditionalImageChange(
        validFiles.map((file) => ({
          url: file, // 実際のFileオブジェクト
          is_main: false,
        })),
        [] // IDリスト（不要なため空配列）
      );
      setError(null);
    },
    [validateFile, onAdditionalImageChange]
  );

  const removeMainImage = useCallback(() => {
    if (localMainImage) {
      if (localMainImage.id > 0) {
        const currentIds = (watch("images.deletedImageIds") ?? []) as number[];
        if (!currentIds.includes(localMainImage.id)) {
          setValue("images.deletedImageIds", [
            ...currentIds,
            localMainImage.id,
          ]);
        }
      }

      onDeleteMainImage(localMainImage.id);

      if (localMainImage.url.startsWith("blob:")) {
        URL.revokeObjectURL(localMainImage.url);
      }
      setLocalMainImage(undefined);
    }
  }, [localMainImage, watch, setValue, onDeleteMainImage]);

  const removeAdditionalImage = useCallback(
    (index: number) => {
      const target = localAdditionalImages[index];
      if (target) {
        // 既存画像のみ削除リストに追加
        if (target.id > 0) {
          const currentIds = watch("images.deletedImageIds") || [];
          if (!currentIds.includes(target.id)) {
            setValue("images.deletedImageIds", [...currentIds, target.id]);
          }
        }

        onDeleteAdditionalImage(index, target.id);
        // オブジェクトURLの解放
        if (target.url.startsWith("blob:")) {
          URL.revokeObjectURL(target.url);
        }
      }
      setLocalAdditionalImages((prev) => prev.filter((_, i) => i !== index));
    },
    [localAdditionalImages, watch, setValue, onDeleteAdditionalImage]
  );

  useEffect(() => {
    return () => {
      if (localMainImage?.url.startsWith("blob:"))
        URL.revokeObjectURL(localMainImage.url);
      localAdditionalImages.forEach((img) => {
        if (img.url.startsWith("blob:")) URL.revokeObjectURL(img.url);
      });
    };
  }, [localMainImage, localAdditionalImages]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
          {error}
        </div>
      )}
      <div>
        <label className="block font-medium mb-2">メイン画像</label>
        {localMainImage && (
          <div className="relative w-full max-w-[400px] h-auto aspect-square border rounded-md overflow-hidden">
            <Image
              src={localMainImage.url}
              alt="メイン商品画像"
              width={600}
              height={600}
              className="object-cover w-full h-full"
              priority
            />
            <button
              type="button"
              onClick={removeMainImage}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
              aria-label="メイン画像を削除"
            >
              ×
            </button>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleMainImageChange}
          className="mt-2 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>
      <div>
        <label className="block font-medium mb-2">追加画像</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
          {localAdditionalImages.map((img, index) => (
            <div
              key={`${img.id}-${index}`}
              className="relative aspect-square border rounded-md overflow-hidden group"
            >
              <Image
                src={img.url}
                alt={`追加商品画像 ${index + 1}`}
                width={300}
                height={300}
                className="object-cover w-full h-full"
              />
              <button
                type="button"
                onClick={() => removeAdditionalImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                aria-label={`追加画像 ${index + 1} を削除`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleAdditionalImageChange}
          className="mt-2 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>
    </div>
  );
},
areEqual);

export default ProductImageUpload;
```
