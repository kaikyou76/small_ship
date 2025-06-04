# メモリリーク対策

React コンポーネントに fetch 機能を実装したい。かつ、任意のタイミングでキャンセルできるようにしたい。

```typescript
import { useCallback, useEffect, useRef, useState } from "react";

export const Sample = () => {
  const [data, setData] = useState("");
  const [isLoading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null); // … ①

  /**
   * データフェッチ関数
   */
  const fetchData = useCallback(async (url: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // … ②
    }

    const controller = new AbortController();
    abortControllerRef.current = controller; // … ③

    setLoading(true);

    await fetch(url, { signal: controller.signal }) // … ④
      .then(async (response) => {
        return await response.json();
      })
      .then((result) => {
        setData(JSON.stringify(result));
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  /**
   * データフェッチをキャンセルする関数
   */
  const cancelFetch = useCallback(() => {
    // … ⑤
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  /**
   * コンポーネントを破棄する際に、データフェッチを実行中であればキャンセルする
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <>
      <div>{isLoading ? "Loading…" : data}</div>
      <button
        type="button"
        onClick={() => {
          fetchData("https://jsonplaceholder.typicode.com/todos/1");
        }}
      >
        fetch data
      </button>
      <button type="button" onClick={cancelFetch}>
        cancel fetch
      </button>
    </>
  );
};
```

解説
ソースコードを見ての通り、ではありますが、少しだけ解説します。

①：AbortController を入れるための枠を useRef で用意します。

②：データフェッチ関数 fetchData の中身を見ていきます。
まず ② のところで、直前に実行していた fetch があれば、キャンセルします。これで常に 1 本だけの fetch が実行できるようになりますね。

③：abortControllerRef に、新規の AbortController を入れ直します。新しく実行する fetch 用のコントローラーになりますね。

④：fetch のパラメータの signal に controller.signal を設定します。このあとは通常通り、fetch が実行されていきます。

⑤：fetch が実行中に、データフェッチをキャンセルする関数 cancelFetch を任意のタイミングで呼び出せば、fetch をキャンセルできます。
データフェッチをキャンセルする関数 cancelFetch の中身は、単に abort()を実行しているだけですね。

まとめ
以上、React + fetch + AbortController の最小構成でした。
fetch 系ライブラリを使えば、一発で実装できる機能かと思いますが、ライブラリを使わずにライトに作りたい時に重宝しそうです。

こちらの React コンポーネント `Sample` は、**AbortController** を用いて非同期データフェッチのキャンセルを安全に管理する非常に良いサンプルです。以下、コードの各部分を丁寧に解説します。

---

## ✅ 目的概要

- ボタンをクリックすると API からデータを取得（`fetchData()`）
- 読み込み中は "Loading…" を表示
- 別のボタンで**フェッチをキャンセル**できる
- **コンポーネントのアンマウント時にもキャンセル**されるように設計

---

## 🔍 詳細解説

### ① `abortControllerRef` の定義

```ts
const abortControllerRef = useRef<AbortController | null>(null);
```

- `useRef` を使って、**AbortController のインスタンス**を永続的に保持します。
- この ref は `fetchData` 関数内や、アンマウント時にも参照されます。
- `useRef` は re-render をトリガーしないため、副作用の制御に最適です。

---

### ② フェッチ前に前のリクエストをキャンセル

```ts
if (abortControllerRef.current) {
  abortControllerRef.current.abort();
}
```

- 新しいリクエストを送る前に、**前回のリクエストを中断**します。
- これにより、ユーザーが連打した場合でも最新のリクエストのみが反映されるようになります（**レースコンディション回避**）。

---

### ③ 新しい AbortController を作成・保持

```ts
const controller = new AbortController();
abortControllerRef.current = controller;
```

- 新しい `AbortController` を作って、Ref に格納します。
- この controller の `signal` を fetch に渡すことで、中断可能なリクエストになります。

---

### ④ データ取得処理（fetch）

```ts
await fetch(url, { signal: controller.signal })
  .then(async (response) => await response.json())
  .then((result) => {
    setData(JSON.stringify(result));
  })
  .catch((error) => {
    console.error(error);
  })
  .finally(() => {
    setLoading(false);
  });
```

- 通常の fetch に加えて、**AbortController の signal** を使って「中断可能な fetch」を実現。
- 中断された場合は `AbortError` が発生します（ただし現在はその識別はしていない）。

---

### ⑤ 明示的にキャンセルするボタン（cancelFetch）

```ts
const cancelFetch = useCallback(() => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }
}, []);
```

- ユーザーが自分で「キャンセル」できるように、ボタンで明示的に abort を呼び出す関数。
- 状況によっては「確認ダイアログ → キャンセル」のような UI にも応用可能です。

---

### 🧹 アンマウント時のクリーンアップ

```ts
useEffect(() => {
  return () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
}, []);
```

- コンポーネントがアンマウントされる時（例：ページ遷移や再描画の中止など）に、未完了の fetch があれば**自動的に中断**。
- これにより **メモリリーク** や **"Can't perform a React state update on an unmounted component" 警告** を防ぎます。

---

## 🧠 まとめ

| ポイント           | 説明                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| **堅牢性**         | 中断機構により不要な fetch や state 更新を防ぐ                                                            |
| **パフォーマンス** | 最新の fetch のみが有効になるため、処理効率が良い                                                         |
| **拡張性**         | `abortControllerRef` を使ったこの設計は、複数 API 同時フェッチ、GraphQL、SWR/React Query などにも応用可能 |
| **ユーザー体験**   | キャンセルボタンや「読み込み中」表示により、UX が向上                                                     |

---

必要であれば、以下のような発展も可能です：

- 複数の API を同時に fetch & 管理する
- `error.name === 'AbortError'` をチェックして中断時の処理と通常エラーを分離
- `React Query` や `SWR` を使って同様の Abort 処理を自動化

---

ご希望があれば、Next.js の App Router との組み合わせ例や、API Routes を使った実装にもアレンジできます。
