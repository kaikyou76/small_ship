# ルート集約

以下は、ルート集約の実装流れについての詳細な説明です。このファイル (`routes/index.ts`) は、アプリケーションのすべてのルートとミドルウェアを集約し、Hono アプリケーションのエントリーポイントとして機能します。

---

### **ルート集約の実装流れ**

#### 1. **Hono アプリケーションの初期化**

- `Hono` インスタンスを作成し、`Bindings` と `Variables` の型を指定します。
  ```typescript
  const app = new Hono<{
    Bindings: Bindings;
    Variables: Variables;
  }>();
  ```

#### 2. **グローバルミドルウェアの設定**

- `cors` ミドルウェアを適用し、すべてのルートで CORS を有効にします。
  ```typescript
  app.use(
    "*",
    cors({
      origin: "*",
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization", "X-Session-ID"],
      exposeHeaders: ["Content-Length"],
      maxAge: 86400,
    })
  );
  ```

#### 3. **認証ミドルウェアの設定**

- 特定のルートに対して `jwtMiddleware` を適用し、認証を必須にします。
  ```typescript
  app.use("/api/cart/*", jwtMiddleware);
  app.use("/api/products/*", async (c, next) => {
    if (["POST", "PUT", "DELETE"].includes(c.req.method)) {
      return jwtMiddleware(c, next);
    }
    await next();
  });
  ```

#### 4. **API ルートの定義**

- 各エンドポイントに対応するハンドラをルートに紐付けます。

  - **ユーザー API**:

    ```typescript
    app
      .post("/api/register", registerHandler)
      .post("/api/login", loginHandler)
      .post("/api/logout", logoutHandler)
      .get("/api/users/me", jwtMiddleware, getUserHandler);
    ```

  - **商品 API**:

    ```typescript
    app
      .post("/api/products", productPostHandler)
      .get("/api/products", productGetHandler)
      .get("/api/products/:id", productGetByIdHandler)
      .options("/api/products", (c) => {
        return c.body(null, 204); // 204 No Contentを返す
      });
    ```

  - **カート API**:
    ```typescript
    app
      .get("/api/cart", getCartHandler)
      .post("/api/cart" /* cartPostHandler */)
      .delete("/api/cart/:productId" /* cartDeleteHandler */);
    ```

#### 5. **システムルートの定義**

- ヘルスチェック用のルートを定義します。
  ```typescript
  app.get("/health", (c) =>
    c.json({
      status: "healthy",
      environment: c.env.ENVIRONMENT,
    })
  );
  ```

#### 6. **エラーハンドリングの設定**

- 404 エラーと 500 エラーに対するハンドラを設定します。

  - **404 エラー**:

    ```typescript
    app.notFound((c) => {
      return c.json({ message: "Route Not Found" }, 404);
    });
    ```

  - **500 エラー**:
    ```typescript
    app.onError((err, c) => {
      console.error(`[${new Date().toISOString()}] Error:`, err);
      return c.json(
        {
          error: {
            message: "Internal Server Error",
            details:
              c.env.ENVIRONMENT === "development"
                ? {
                    error: err.message,
                    stack: err.stack,
                  }
                : undefined,
          },
        },
        500
      );
    });
    ```

#### 7. **アプリケーションのエクスポート**

- ルート集約が完了したアプリケーションをエクスポートします。
  ```typescript
  export default app;
  ```

---

### **動作の流れ**

1. **リクエストの受信**:

   - クライアントが特定のエンドポイントにリクエストを送信します。

2. **ミドルウェアの適用**:

   - グローバルミドルウェア（例: CORS）が適用されます。
   - 特定のルートに対して認証ミドルウェアが適用されます。

3. **ルートハンドラの実行**:

   - リクエストされたエンドポイントに対応するハンドラが実行されます。

4. **レスポンスの返却**:

   - ハンドラが処理した結果がクライアントに返されます。

5. **エラーハンドリング**:
   - ルートが見つからない場合や内部エラーが発生した場合、適切なエラーレスポンスが返されます。

---

### **レスポンス例**

#### 成功時

- **ユーザー登録**:

  ```json
  {
    "data": {
      "id": 1,
      "name": "Test User",
      "email": "test@example.com",
      "role": "user"
    }
  }
  ```

- **商品取得**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "name": "Product 1",
        "price": 1000
      }
    ]
  }
  ```

#### エラー時

- **404 エラー**:

  ```json
  {
    "message": "Route Not Found"
  }
  ```

- **500 エラー**:
  ```json
  {
    "error": {
      "message": "Internal Server Error",
      "details": {
        "error": "Some error message",
        "stack": "Error stack trace"
      }
    }
  }
  ```

---

### **テスト方法**

1. **各エンドポイントへのリクエスト**:

   - 各エンドポイントに正しいリクエストを送信し、期待されるレスポンスが返されるか確認します。

2. **エラーパターンのテスト**:

   - 無効なリクエストを送信して、適切なエラーレスポンスが返されるか確認します。
   - 認証が必要なエンドポイントに認証情報なしでリクエストを送信し、認証エラーのレスポンスを確認します。

3. **ヘルスチェックの確認**:
   - `/health` エンドポイントにリクエストを送信し、アプリケーションの状態が返されるか確認します。

---

### **補足**

- **モジュール化**:
  各ハンドラやミドルウェアは別ファイルに分割されており、`routes/index.ts` で集約されています。これにより、コードの可読性と保守性が向上します。

- **柔軟なミドルウェア適用**:
  特定のルートや HTTP メソッドに対してミドルウェアを柔軟に適用できます。

- **エラーハンドリング**:
  開発環境と本番環境で異なるエラーメッセージを返すことで、セキュリティとデバッグの両方を考慮しています。

---

これで、ルート集約の実装流れ、動作の流れ、レスポンス例、テスト方法についての説明が完了しました。
