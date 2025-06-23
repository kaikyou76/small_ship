## 商品画像のアップロードコンポーネント

### (frontend/components/ProductImageUpload.tsx)

```tsx
// frontend/components/ProductImageUpload.tsx
"use client";

import { useFormContext } from "react-hook-form";
import { useEffect, useState, memo, useCallback, useMemo } from "react";
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

  // propMainImageの変更を効率的に検知
  useEffect(() => {
    const shouldUpdate =
      (!propMainImage && localMainImage) ||
      (propMainImage &&
        (!localMainImage ||
          propMainImage.id !== localMainImage.id ||
          propMainImage.url !== localMainImage.url));

    if (shouldUpdate) {
      setLocalMainImage(propMainImage);
    }
  }, [propMainImage?.id, propMainImage?.url]);

  // propAdditionalImagesの変更を効率的に検知
  useEffect(() => {
    const propImagesKey = propAdditionalImages
      .map((img) => `${img.id}-${img.url}`)
      .join();
    const localImagesKey = localAdditionalImages
      .map((img) => `${img.id}-${img.url}`)
      .join();

    if (propImagesKey !== localImagesKey) {
      setLocalAdditionalImages(propAdditionalImages);
    }
  }, [propAdditionalImages.map((img) => `${img.id}-${img.url}`).join()]);

  // フォーム値の更新
  useEffect(() => {
    const currentValues = getValues();
    const keepIds = [
      ...(localMainImage?.id && localMainImage.id > 0
        ? [localMainImage.id]
        : []),
      ...localAdditionalImages.filter((img) => img.id > 0).map((img) => img.id),
    ];

    setValue("images.keepImageIds", keepIds);
    setValue(
      "images.deletedImageIds",
      currentValues.images.deletedImageIds || []
    );
  }, [
    localMainImage?.id,
    localAdditionalImages.map((img) => img.id).join(),
    setValue,
    getValues,
  ]);

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
        const currentIds = watch("images.deletedImageIds") || [];
        setValue("images.deletedImageIds", [...currentIds, localMainImage.id]);
      }

      setLocalMainImage(newImage);
      onMainImageChange(file);
      setError(null);
    },
    [validateFile, localMainImage, watch, setValue, onMainImageChange]
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

      const combinedImages = [...localAdditionalImages, ...newImages];
      setLocalAdditionalImages(combinedImages);

      onAdditionalImageChange(
        validFiles.map((file) => ({ url: file, is_main: false })),
        localAdditionalImages.filter((img) => img.id > 0).map((img) => img.id)
      );
      setError(null);
    },
    [validateFile, localAdditionalImages, onAdditionalImageChange]
  );

  const removeMainImage = useCallback(() => {
    if (localMainImage) {
      if (localMainImage.id > 0) {
        const currentIds = watch("images.deletedImageIds") || [];
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
        if (target.id > 0) {
          const currentIds = watch("images.deletedImageIds") || [];
          if (!currentIds.includes(target.id)) {
            setValue("images.deletedImageIds", [...currentIds, target.id]);
          }
        }

        onDeleteAdditionalImage(index, target.id);

        if (target.url.startsWith("blob:")) {
          URL.revokeObjectURL(target.url);
        }
      }
      setLocalAdditionalImages((prev) => prev.filter((_, i) => i !== index));
    },
    [localAdditionalImages, watch, setValue, onDeleteAdditionalImage]
  );

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (localMainImage?.url?.startsWith("blob:")) {
        URL.revokeObjectURL(localMainImage.url);
      }
      localAdditionalImages.forEach((img) => {
        if (img.url?.startsWith("blob:")) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, [localMainImage?.url, localAdditionalImages]);

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

この `ProductImageUpload` コンポーネントは、**商品編集画面**で使われる **画像アップロード・削除 UI 専用のコンポーネント**です。主に以下のような機能を担っています：

---

## 🎯 **コンポーネントの目的**

| 機能                         | 説明                                                   |
| ---------------------------- | ------------------------------------------------------ |
| メイン画像の表示・変更・削除 | 商品の主画像（1 枚）の更新や削除操作が可能             |
| 追加画像の表示・追加・削除   | 商品に付随する複数画像の追加・削除が可能               |
| フォーム状態への反映         | `react-hook-form` を使い、親フォームに画像データを渡す |
| プレビュー機能               | `URL.createObjectURL()` を使って即時表示               |

---

## 📦 使用している技術要素

| ライブラリ            | 用途                         |
| --------------------- | ---------------------------- |
| `react-hook-form`     | フォームとの状態連携         |
| `next/image`          | 最適化された画像表示         |
| `memo + areEqual`     | 不必要な再レンダリングの防止 |
| `URL.createObjectURL` | アップロード前の画像表示     |
| `useEffect`           | prop と local state の同期   |

---

## 🔍 構成要素と解説

### 1. **props の構造**

```ts
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
```

- このコンポーネントは **画像の状態とイベントハンドラを親コンポーネントから受け取る**。
- `mainImage`/`additionalImages` は表示用、`onMainImageChange`/`onAdditionalImageChange` はアップロード時の処理用。

---

### 2. **内部 state 管理と同期**

```tsx
const [localMainImage, setLocalMainImage] = useState(propMainImage);
const [localAdditionalImages, setLocalAdditionalImages] =
  useState(propAdditionalImages);
```

- prop で渡ってきた画像は `useEffect` を使って `localState` にコピーし、状態管理。
- なぜ？ → 画像の即時削除や変更をこのコンポーネントだけで完結させるため。

```tsx
useEffect(() => {
  if (変更されていたら) {
    setLocalMainImage(propMainImage);
  }
}, [propMainImage?.id, propMainImage?.url]);
```

---

### 3. **バリデーション処理**

```ts
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const validateFile = (file: File): boolean => {
  if (file.size > MAX_IMAGE_SIZE) return false;
  if (!file.type.startsWith("image/")) return false;
};
```

- **5MB 以上または画像でないファイルは拒否**。
- エラーメッセージは状態に保存して画面に表示。

---

### 4. **画像のアップロード処理**

#### ✅ メイン画像の追加

```tsx
<input type="file" onChange={handleMainImageChange} />;

handleMainImageChange = (e) => {
  const file = e.target.files?.[0];
  setLocalMainImage({ id: -1, url: createObjectURL(file), is_main: true });
  onMainImageChange(file);
};
```

- 既存画像があれば削除対象リスト（`deletedImageIds`）に追加。
- 新しい画像は `onMainImageChange()` を通じて親へ通知。

#### ✅ 追加画像の追加

```tsx
<input multiple type="file" onChange={handleAdditionalImageChange} />
```

- 複数画像を受け取り、ローカルステートと親フォームに反映。
- `File` オブジェクトをそのまま渡しているので、親側で `FormData` に追加可能。

---

### 5. **画像の削除処理**

#### 🗑️ メイン画像の削除

```tsx
const removeMainImage = () => {
  if (localMainImage.id > 0) {
    deletedImageIds に追加;
  }
  onDeleteMainImage(localMainImage.id);
  revokeObjectURL(blob);
  setLocalMainImage(undefined);
};
```

- 表示を即時消し、親にも通知。
- 一時的な画像(`blob:`)は `URL.revokeObjectURL()` でメモリ解放。

#### 🗑️ 追加画像の削除

```tsx
const removeAdditionalImage = (index: number) => {
  onDeleteAdditionalImage(index, id);
  revokeObjectURL(blob);
  setLocalAdditionalImages((prev) => prev.filter((_, i) => i !== index));
};
```

---

### 6. **フォーム連携 (`setValue`, `watch`, `getValues`)**

```tsx
const keepIds = [
  ...(localMainImage?.id > 0 ? [localMainImage.id] : []),
  ...localAdditionalImages.filter((img) => img.id > 0).map((img) => img.id),
];
setValue("images.keepImageIds", keepIds);
```

- **削除しない画像の ID をフォームに渡す**（これを使って API 側で画像の保持・削除を判別）。
- フォームの `images.deletedImageIds` も補完。

---

### 7. **画像の表示 (`next/image`)**

```tsx
<Image src={localMainImage.url} alt="..." width={600} height={600} />
```

- `object-cover` や `aspect-square` で正方形プレビューを維持。
- 削除ボタンは右上にオーバーレイ。

---

### 8. **パフォーマンス最適化（`memo` + `areEqual`）**

```tsx
const areEqual = (prev, next) => {
  return 画像のIDとURLが同じであればtrue;
};

const ProductImageUpload = memo(function ..., areEqual);
```

- 不必要な再レンダリング（特に画像の再生成）を防ぐ。
- `useMemo`, `useCallback` も積極活用。

---

## ✅ 最後にまとめると

| 機能                 | 説明                                                                                |
| -------------------- | ----------------------------------------------------------------------------------- |
| 画像の表示           | メイン画像、複数の追加画像を表示                                                    |
| 画像の追加・削除     | input 要素経由でファイル選択、即時プレビュー                                        |
| フォームとの連携     | `react-hook-form`を介して、保持する画像 ID や削除画像 ID をフォームに反映           |
| ユーザー体験の工夫   | `blob:` URL で即時プレビュー、削除時のアニメーション、エラーメッセージなど          |
| パフォーマンス最適化 | `memo`, `useEffect`, `useCallback`, `useMemo`の適切な使い分けで最小限の再描画を実現 |

---

さらに詳しい解説（例：`deletedImageIds`と`keepImageIds`の活用例、メモリ管理、画像圧縮など）が必要であれば、お気軽に聞いてください。
