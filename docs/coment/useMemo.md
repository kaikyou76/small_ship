# useMemo フック関数

```tsx
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
```

`useMemo` は、React の **メモ化フック** で、**計算コストの高い処理を最適化** するために使われます。このコードでは、`mainImageProp` と `additionalImagesProp` の計算結果をキャッシュし、依存配列（`dependencies`）が変更された時だけ再計算します。

---

## **`useMemo` の役割**

### 1. **パフォーマンス最適化**

- **不要な再計算を防ぐ**  
  `useMemo` は、依存配列（`[watch("images.main"), initialData?.data.images.main?.id]` など）の値が変わらない限り、前回の計算結果をそのまま返します。  
  → 再レンダリング時に同じ計算を繰り返さず、パフォーマンスを向上させます。

### 例:

```ts
const mainImageProp = useMemo(() => {
  // 依存配列の値が変わらない限り、この計算はスキップされる
}, [watch("images.main"), initialData?.data.images.main?.id]);
```

### 2. **参照の安定性（Referential Equality）**

- **オブジェクトや配列の再生成を防ぐ**、`memo` や `useEffect` などで不要な再レンダリングを抑制します。  
  → 例えば、`additionalImagesProp` が子コンポーネントに渡される場合、`useMemo` を使わないと毎回新しい配列が生成され、`React.memo` が効かなくなる可能性があります。

### 例:

```ts
const additionalImagesProp = useMemo(() => {
  return [...initialAdditional, ...newAdditional]; // 同じ依存配列なら同じ参照を返す
}, [watch("images.additional"), initialData?.data.images.additional]);
```

---

## **このコードの具体的な動作**

### **1. `mainImageProp` の計算**

- `watch("images.main")` でフォームのメイン画像を監視。
- **`string` の場合**（既存の画像 URL）→ `{ id, url, is_main }` 形式で返す。
- **`File` の場合**（新規アップロード）→ `URL.createObjectURL()` で一時 URL を生成。
- **`undefined` の場合** → `undefined` を返す。

### **2. `additionalImagesProp` の計算**

- **既存の追加画像**（`initialData` から取得）と **新規追加画像**（`watch("images.additional")` から取得）を結合。
- 新規画像は `File` オブジェクトを `URL.createObjectURL()` で一時 URL に変換。
- 最終的に `[...initialAdditional, ...newAdditional]` を返す。

---

## **`useMemo` を使うべきケース**

✅ **高コストな計算**（フィルタリング、マッピングなど）  
✅ **参照の安定性が必要な場合**（`React.memo` や `useEffect` の依存配列で使うオブジェクト/配列）  
✅ **フォーム入力のリアルタイム処理**（`watch` で監視した値の変換）

## **`useMemo` を使わなくてもいいケース**

❌ **単純なプリミティブ値（`string`, `number`, `boolean`）の計算**  
❌ **毎回異なる値を返す必要がある場合**

---

## **`useCallback` との違い**

|            | `useMemo`                                              | `useCallback`                                 |
| ---------- | ------------------------------------------------------ | --------------------------------------------- |
| **返す値** | 計算結果（任意の値）                                   | メモ化された関数                              |
| **用途**   | 重い計算のキャッシュ                                   | 関数の再生成防止                              |
| **例**     | `const value = useMemo(() => heavyCalc(a, b), [a, b])` | `const fn = useCallback(() => {...}, [deps])` |

---

### **まとめ**

このコードでは、`useMemo` を使って **画像データの変換処理を最適化** しています。

- `watch()` で監視しているフォームの状態に基づいて、`mainImageProp` と `additionalImagesProp` を効率的に計算。
- 依存配列が変更された時だけ再計算し、パフォーマンスを向上させています。
