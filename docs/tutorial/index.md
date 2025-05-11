---
title: メモ帳
---

# メモをここに書きます。

以下の記事をどうぞ：

- [メモ](/tutorial/react-basics)
- [Next.js で買い物サイトを作る](/posts/hello-react)

商品画像を登録する方法は、主に **「ファイルアップロード機能」** の実装が必要です。Next.js（React）と API を使用した一般的な実装手順を解説します。

---

## **1. フロントエンド側の実装**

### **(1) ファイル入力フォームの作成**

```tsx
// React (Next.js) の例
const [image, setImage] = useState<File | null>(null);

const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    setImage(e.target.files[0]);
  }
};

return (
  <form onSubmit={handleSubmit}>
    <input type="file" accept="image/*" onChange={handleImageChange} />
    <button type="submit">登録</button>
  </form>
);
```

- `accept="image/*"` で画像ファイルのみ選択可能に
- `useState` で選択された画像ファイルを保持

---

### **(2) 画像プレビューの表示（オプション）**

```tsx
const [previewUrl, setPreviewUrl] = useState<string | null>(null);

// 画像選択時にプレビューを生成
useEffect(() => {
  if (image) {
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(image);
  } else {
    setPreviewUrl(null);
  }
}, [image]);

return (
  {previewUrl && <img src={previewUrl} alt="プレビュー" width={200} />}
);
```

- `FileReader` で画像の DataURL を生成し、`<img>` タグで表示

---

### **(3) 画像付きで API に送信**

#### **方法 A: FormData を使用（マルチパートフォームデータ）**

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("name", "商品名");
  formData.append("price", "1000");
  if (image) {
    formData.append("image", image); // 画像ファイルを追加
  }

  try {
    const response = await fetch("/api/products", {
      method: "POST",
      body: formData, // JSONではなくFormDataを送信
      // Content-Typeは自動で multipart/form-data になる
    });
    const result = await response.json();
    router.push(`/product/${result.id}`);
  } catch (err) {
    console.error("登録失敗:", err);
  }
};
```

- `FormData` を使うと、ファイルとテキストデータを同時に送信可能
- **`Content-Type` ヘッダーは不要**（ブラウザが自動設定）

---

#### **方法 B: Base64 エンコード（小さい画像向け）**

```tsx
if (image) {
  const base64Image = await convertToBase64(image);
  const response = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "商品名",
      image: base64Image, // 文字列として送信
    }),
  });
}

// FileをBase64に変換する関数
const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
};
```

- 小さい画像（例: サムネイル）向け
- データ量が約 33%増加するため、大きな画像には不向き

---

## **2. バックエンド側の実装例**

### **(1) Node.js (Next.js API Route) での処理**

```ts
// pages/api/products.ts
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false, // FormDataをパースするため無効化
  },
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") return res.status(405).end();

  // ファイルアップロードを処理
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "アップロード失敗" });

    const { name, price } = fields;
    const imageFile = files.image;

    // 画像を保存（例: /public/uploads/）
    const uploadPath = `./public/uploads/${imageFile.originalFilename}`;
    fs.renameSync(imageFile.filepath, uploadPath);

    // DBに商品データを保存（PrismaなどのORMを使用）
    const product = await prisma.product.create({
      data: {
        name,
        price: Number(price),
        imageUrl: `/uploads/${imageFile.originalFilename}`,
      },
    });

    res.status(201).json(product);
  });
};
```

- **`formidable`** ライブラリでファイルアップロードを処理
- 画像はサーバーの `public/uploads/` ディレクトリに保存
- DB には画像のパス (`imageUrl`) を保存

---

### **(2) 他のバックエンドの場合**

- **Cloud Storage (AWS S3, Firebase Storage 等) を使う場合**

  ```ts
  // AWS S3アップロード例
  import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

  const s3 = new S3Client({ region: "ap-northeast-1" });
  await s3.send(
    new PutObjectCommand({
      Bucket: "your-bucket",
      Key: `products/${Date.now()}_${imageFile.originalFilename}`,
      Body: fs.createReadStream(imageFile.filepath),
    })
  );
  ```

  - 本番環境ではサーバー直下に保存せず、クラウドストレージが推奨

---

## **3. 追加考慮事項**

### **(1) 画像のバリデーション**

```ts
// フロントエンドでチェック
if (image) {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (image.size > MAX_SIZE) {
    alert("画像サイズは5MB以下にしてください");
    return;
  }
  if (!["image/jpeg", "image/png"].includes(image.type)) {
    alert("JPEGまたはPNGのみ対応しています");
    return;
  }
}
```

### **(2) 画像の最適化**

- **クライアント側でリサイズ**: `react-image-file-resizer` などのライブラリ
- **サーバー側で変換**: Sharp (Node.js) などで WebP 形式に変換

### **(3) セキュリティ対策**

- ファイル名のサニタイズ（`../../../` などの攻撃防止）
- ウイルススキャン（クラウドサービスや ClamAV などの利用）

---

## **まとめ**

| ステップ            | 技術                     | 選択肢               |
| ------------------- | ------------------------ | -------------------- |
| **1. 画像選択**     | `<input type="file">`    | プレビュー機能追加可 |
| **2. データ送信**   | `FormData` または Base64 | ファイルサイズで選択 |
| **3. サーバー処理** | Formidable（Node.js）    | ローカル保存 or S3   |
| **4. DB 保存**      | 画像パスを保存           | フルパス or 相対パス |

**おすすめフロー**

1. フロントエンドで `FormData` を使用
2. バックエンドで AWS S3/Firebase Storage に保存
3. DB には画像 URL (`https://your-bucket.com/image.jpg`) を保存

これで商品画像を含めた登録システムが構築できます！
