# storage

以下は、`storage.ts` の実装流れについての詳細な説明です。このファイルは、Cloudflare R2 ストレージへのファイルアップロードと取得を行うためのユーティリティを提供します。

---

### **ストレージユーティリティの実装流れ**

```ts
//backend/src/lib/storage.ts
import { createId } from "@paralleldrive/cuid2";
import type { R2Bucket } from "@cloudflare/workers-types";

export interface StorageResult {
  url: string;
  key: string;
}

export const uploadToR2 = async (
  bucket: R2Bucket,
  file: File,
  publicDomain: string,
  options: { folder?: string } = {}
): Promise<StorageResult> => {
  const { folder = "uploads" } = options;
  const fileExt = file.name.split(".").pop();
  const key = `${folder}/${createId()}.${fileExt}`;

  await bucket.put(key, file, {
    httpMetadata: {
      contentType: file.type,
    },
  });

  return {
    url: `https://${publicDomain}/${key}`,
    key,
  };
};

// 簡易版取得関数
export const getFromR2 = async (
  bucket: R2Bucket,
  key: string
): Promise<ReadableStream | null> => {
  const object = await bucket.get(key);
  return object?.body ?? null;
};
```

#### 1. **ファイルのアップロード**

- `uploadToR2` 関数は、指定されたファイルを Cloudflare R2 バケットにアップロードします。

  ```typescript
  export const uploadToR2 = async (
    bucket: R2Bucket,
    file: File,
    publicDomain: string,
    options: { folder?: string } = {}
  ): Promise<StorageResult> => {
    const { folder = "uploads" } = options;
    const fileExt = file.name.split(".").pop();
    const key = `${folder}/${createId()}.${fileExt}`;

    await bucket.put(key, file, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    return {
      url: `https://${publicDomain}/${key}`,
      key,
    };
  };
  ```

  - **引数**:

    - `bucket`: Cloudflare R2 バケットのインスタンス。
    - `file`: アップロードするファイル。
    - `publicDomain`: ファイルにアクセスするための公開ドメイン。
    - `options`: オプション設定（例: フォルダ名）。

  - **処理**:
    - ファイル名の拡張子を取得し、一意のキーを生成します。
    - ファイルを指定されたフォルダにアップロードします。
    - アップロードされたファイルの URL とキーを返します。

#### 2. **ファイルの取得**

- `getFromR2` 関数は、指定されたキーに対応するファイルを Cloudflare R2 バケットから取得します。

  ```typescript
  export const getFromR2 = async (
    bucket: R2Bucket,
    key: string
  ): Promise<ReadableStream | null> => {
    const object = await bucket.get(key);
    return object?.body ?? null;
  };
  ```

  - **引数**:

    - `bucket`: Cloudflare R2 バケットのインスタンス。
    - `key`: 取得するファイルのキー。

  - **処理**:
    - 指定されたキーに対応するファイルを取得します。
    - ファイルのストリームを返します。ファイルが存在しない場合は `null` を返します。

---

### **動作の流れ**

1. **ファイルのアップロード**:

   - クライアントがファイルをアップロードするリクエストを送信します。
   - `uploadToR2` 関数がファイルを Cloudflare R2 バケットにアップロードします。
   - アップロードされたファイルの URL とキーがクライアントに返されます。

2. **ファイルの取得**:
   - クライアントがファイルを取得するリクエストを送信します。
   - `getFromR2` 関数が指定されたキーに対応するファイルを Cloudflare R2 バケットから取得します。
   - ファイルのストリームがクライアントに返されます。

---

### **レスポンス例**

#### ファイルのアップロード

```typescript
const result = await uploadToR2(bucket, file, "example.com", {
  folder: "images",
});
console.log(result);
// {
//   url: "https://example.com/images/cl1234567890abcdef1234567890abcdef.jpg",
//   key: "images/cl1234567890abcdef1234567890abcdef.jpg"
// }
```

#### ファイルの取得

```typescript
const stream = await getFromR2(
  bucket,
  "images/cl1234567890abcdef1234567890abcdef.jpg"
);
if (stream) {
  // ストリームを処理する
} else {
  console.log("File not found");
}
```

---

### **テスト方法**

1. **ファイルのアップロード**:

   - 有効なファイルをアップロードし、正しい URL とキーが返されるか確認します。
   - 無効なファイルをアップロードし、エラーが発生するか確認します。

2. **ファイルの取得**:
   - 有効なキーでファイルを取得し、正しいストリームが返されるか確認します。
   - 無効なキーでファイルを取得し、`null` が返されるか確認します。

---

### **補足**

- **セキュリティ**:

  - ファイルのキーは一意の ID を使用して生成されるため、セキュリティが強化されます。
  - ファイルのコンテンツタイプが正しく設定されるため、ブラウザでの表示が適切に行われます。

- **柔軟性**:

  - フォルダ名を指定することで、ファイルを整理して保存できます。
  - 公開ドメインを指定することで、ファイルにアクセスするための URL を生成できます。

- **再利用性**:
  - `uploadToR2` と `getFromR2` 関数は、任意の Cloudflare R2 バケットで再利用できます。

---

これで、ストレージユーティリティの実装流れ、動作の流れ、レスポンス例、テスト方法についての説明が完了しました。
