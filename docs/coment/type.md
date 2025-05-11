# 型定義

以下は、`types/types.ts` に定義されている各インターフェースの意味と、外部からどのように該当インターフェースを読み込むかについての詳細な説明です。

```ts
//backend/src/types/types.ts
import type { D1Database, R2Bucket } from "@cloudflare/workers-types";
import { z } from "zod";
import { productSchema } from "@/schemas/product";

//エラーコードを定義
export const INVALID_SESSION = "INVALID_SESSION";

/**
 * Cloudflare Worker にバインドされる環境変数
 * （wrangler.toml の [vars] や D1データベースなど）
 */
export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;
  ENVIRONMENT: "development" | "production" | "staging";
  R2_BUCKET: R2Bucket;
  R2_PUBLIC_DOMAIN: string;
}

/**
 * 後方互換のために保持している型エイリアス
 * 現在は Env と同一内容
 */
export interface Bindings extends Env {}

/**
 * JWT トークンから復号されるペイロード情報
 */
export interface JwtPayload {
  user_id: number;
  email: string;
  exp: number;
  iat?: number;
  iss?: string;
  aud?: string | string[];
}

/**
 * Hono コンテキストで使用する一時変数（リクエストごとのスコープ）
 * jwtMiddleware などでセットされる
 */
export interface Variables {
  jwtPayload?: JwtPayload; // 検証済みJWTペイロード（未認証なら undefined）
}

/**
 * カート内の商品1件のデータ型
 * API レスポンス用に追加情報フィールドを含む
 */
export interface CartItem {
  id: number;
  product_id: number;
  user_id: number | null;
  session_id: string | null;
  quantity: number;
  created_at: string;

  // ===== 計算・表示用フィールド（レスポンス用） =====
  subtotal?: number; // = price × quantity
  name?: string; // 商品名
  price?: number; // 単価
  image_url?: string; // 商品画像URL
}

/**
 * エラーレスポンスの統一フォーマット
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: z.typeToFlattenedError<z.infer<typeof productSchema>>; // Zodエラー
    meta?: {
      // 独自の情報
      errorMessage?: string;
      required?: string[];
      received?: Record<string, boolean>;
    };
    issues?: Array<{
      path: (string | number)[];
      message: string;
    }>;
    solution?: string;
  };
}

/**
 * 成功レスポンスの統一フォーマット（汎用ジェネリック）
 */
export interface SuccessResponse<T = unknown> {
  data: T;
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
}

export interface LoginResponseData {
  token: string;
  refreshToken?: string; // オプショナル追加
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

/**
 * Hono の Context に拡張変数を型として登録
 * ctx.get('jwtPayload') などの補完が効くようになる
 */
declare module "hono" {
  interface ContextVariableMap {
    jwtPayload?: JwtPayload; // 認証オプショナルに統一
  }
}

// ストレージ関連の型（必要に応じて拡張）
export interface StorageConfig {
  folder?: string;
  maxFileSize?: number;
}

export interface ProductCreateResponse {
  success: boolean;
  data: {
    id: number;
    name: string;
    price: number;
    stock: number;
    images: {
      main: string;
      additional: string[];
    };
    createdAt: string;
  };
}
```

---

### **1. `Env` インターフェース**

- **意味**:
  Cloudflare Worker にバインドされる環境変数を定義します。これには、D1 データベース、JWT のシークレットキー、R2 バケットなどが含まれます。

- **外部からの読み込み方法**:
  ```typescript
  import type { Env } from "@/types/types";
  ```

---

### **2. `Bindings` インターフェース**

- **意味**:
  後方互換のために保持されている型エイリアスで、現在は `Env` と同一内容です。

- **外部からの読み込み方法**:
  ```typescript
  import type { Bindings } from "@/types/types";
  ```

---

### **3. `JwtPayload` インターフェース**

- **意味**:
  JWT トークンから復号されるペイロード情報を定義します。これには、ユーザー ID、メールアドレス、有効期限などが含まれます。

- **外部からの読み込み方法**:
  ```typescript
  import type { JwtPayload } from "@/types/types";
  ```

---

### **4. `Variables` インターフェース**

- **意味**:
  Hono コンテキストで使用する一時変数を定義します。これには、検証済みの JWT ペイロードなどが含まれます。

- **外部からの読み込み方法**:
  ```typescript
  import type { Variables } from "@/types/types";
  ```

---

### **5. `CartItem` インターフェース**

- **意味**:
  カート内の商品 1 件のデータ型を定義します。これには、商品 ID、ユーザー ID、セッション ID、数量、作成日時などが含まれます。また、商品名、単価、画像 URL などの追加情報も含まれます。

- **外部からの読み込み方法**:
  ```typescript
  import type { CartItem } from "@/types/types";
  ```

---

### **6. `ErrorResponse` インターフェース**

- **意味**:
  エラーレスポンスの統一フォーマットを定義します。これには、エラーコード、エラーメッセージ、詳細情報、メタデータなどが含まれます。

- **外部からの読み込み方法**:
  ```typescript
  import type { ErrorResponse } from "@/types/types";
  ```

---

### **7. `SuccessResponse` インターフェース**

- **意味**:
  成功レスポンスの統一フォーマットを定義します。これには、データとメタデータ（ページネーション情報など）が含まれます。

- **外部からの読み込み方法**:
  ```typescript
  import type { SuccessResponse } from "@/types/types";
  ```

---

### **8. `ContextVariableMap` インターフェース**

- **意味**:
  Hono のコンテキストに拡張変数を型として登録します。これにより、`ctx.get('jwtPayload')` などの補完が効くようになります。

- **外部からの読み込み方法**:
  ```typescript
  import type { ContextVariableMap } from "hono";
  ```

---

### **9. `StorageConfig` インターフェース**

- **意味**:
  ストレージ関連の設定を定義します。これには、フォルダ名、最大ファイルサイズなどが含まれます。

- **外部からの読み込み方法**:
  ```typescript
  import type { StorageConfig } from "@/types/types";
  ```

---

### **10. `ProductCreateResponse` インターフェース**

- **意味**:
  商品作成 API のレスポンス型を定義します。これには、作成された商品の ID、名前、価格、在庫数、画像 URL、作成日時などが含まれます。

- **外部からの読み込み方法**:
  ```typescript
  import type { ProductCreateResponse } from "@/types/types";
  ```

---

### **各インターフェースの使用例**

#### 1. **`Env` の使用例**

```typescript
const worker: ExportedHandler<Env> = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // 環境変数を使用
    const db = env.DB;
  },
};
```

#### 2. **`JwtPayload` の使用例**

```typescript
const payload: JwtPayload = {
  user_id: 1,
  email: "test@example.com",
  exp: 1234567890,
};
```

#### 3. **`ErrorResponse` の使用例**

```typescript
const errorResponse: ErrorResponse = {
  error: {
    code: "INVALID_SESSION",
    message: "セッションIDまたは認証が必要です",
  },
};
```

#### 4. **`SuccessResponse` の使用例**

```typescript
const successResponse: SuccessResponse<{ id: number }> = {
  data: {
    id: 1,
  },
};
```

#### 5. **`CartItem` の使用例**

```typescript
const cartItem: CartItem = {
  id: 1,
  product_id: 1,
  user_id: 1,
  session_id: "session123",
  quantity: 2,
  created_at: "2023-10-01T00:00:00.000Z",
  name: "Product 1",
  price: 1000,
  image_url:
    "https://example.com/products/main/cl1234567890abcdef1234567890abcdef.jpg",
  subtotal: 2000,
};
```

---

### **まとめ**

- **各インターフェースの役割**:
  各インターフェースは、アプリケーション内で使用されるデータの型を定義し、型安全性を向上させます。

- **外部からの読み込み方法**:
  各インターフェースは、`import type` を使用して外部から読み込むことができます。

- **拡張性**:
  必要に応じて、新しいインターフェースを追加したり、既存のインターフェースを拡張したりできます。

---

これで、`types/types.ts` に定義されている各インターフェースの意味と外部からの読み込み方法についての説明が完了しました。
