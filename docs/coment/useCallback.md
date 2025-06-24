# useCallback フック関数

```tsx
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
```

この `useCallback` は、React のフックで、関数のメモ化（キャッシュ）を行うためのものです。具体的には以下のような役割を持っています：

### 1. **パフォーマンス最適化**

- この `onSubmit` 関数は、依存配列 `[isLoggedIn, currentUser?.role, params.id, router]` の値が変更されない限り、再作成されません。
- これにより、不要な再レンダリングを防ぎ、パフォーマンスを向上させます。

### 2. **依存関係の管理**

- 依存配列に指定された値（`isLoggedIn`, `currentUser.role`, `params.id`, `router`）のいずれかが変更された場合にのみ、関数が再作成されます。
- これにより、常に最新の状態を参照しながら、不必要な再生成を防ぎます。

### 3. **関数の安定性の確保**

- `useCallback` でラップされた関数は、同じ参照を保持するため、子コンポーネントに props として渡す場合などに、不必要な再レンダリングを引き起こしません。

### このコードの具体的な動作

- 商品編集フォームの送信時に実行される非同期関数で、以下の処理を行います：
  1. 管理者権限のチェック
  2. フォームデータのバリデーション
  3. FormData を使用して画像やテキストデータを組み立て
  4. API に PUT リクエストを送信
  5. 成功時は商品ページにリダイレクト、失敗時はエラー表示

`useCallback` を使うことで、この複雑な処理を含む関数が不必要に再生成されるのを防ぎ、アプリケーションの効率を上げます。
