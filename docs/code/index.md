了解しました！  
「すべての背景色」ではなく、**特定の言語（tsx, sh, sql, typescript, js）だけ**切り替えたいんですね。

では、**限定対応版の完全コピペコード**を用意しました！

---

# ✅ コピペするコード（特定言語だけ切り替え）

### 1. `/docs/.vitepress/theme/custom.css`

```css
/* デフォルト（黒背景） */
:root {
  --vp-c-bg-code: #1e1e1e;
}

/* グレー背景モード（特定言語だけ変える） */
.gray-mode pre code.language-tsx,
.gray-mode pre code.language-sh,
.gray-mode pre code.language-sql,
.gray-mode pre code.language-typescript,
.gray-mode pre code.language-js {
  background-color: #f5f5f5 !important;
  color: #333 !important;
}

/* トグルボタンのスタイル */
.toggle-background {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: #666;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  z-index: 999;
  font-size: 0.9rem;
}
```

---

### 2. `/docs/.vitepress/theme/Layout.vue`

```vue
<script setup>
import DefaultTheme from "vitepress/theme";
import { onMounted } from "vue";

onMounted(() => {
  const button = document.createElement("button");
  button.innerText = "背景切り替え";
  button.className = "toggle-background";
  button.onclick = () => {
    document.documentElement.classList.toggle("gray-mode");
  };
  document.body.appendChild(button);
});
</script>

<template>
  <DefaultTheme.Layout />
</template>

<style scoped>
/* ここは空でOK（スタイルは custom.cssに書いたので） */
</style>
```

---

# ✅ 操作手順

| 手順 | 内容                                                                              |
| :--- | :-------------------------------------------------------------------------------- |
| ①    | `docs/.vitepress/theme/custom.css` を上記内容で作る                               |
| ②    | `docs/.vitepress/theme/Layout.vue` を上記内容で作る                               |
| ③    | VitePress を再起動する (`pnpm docs:dev`など)                                      |
| ④    | 右上に「背景切り替え」ボタンが出る                                                |
| ⑤    | ボタンを押すと、**tsx, sh, sql, typescript, js** のコードだけ背景がグレーになる！ |
| ⑥    | もう一度押すと黒背景に戻る！                                                      |

---

# ✅ 仕組み解説（かんたんに）

- **黒背景**はそのまま（ダークモード）
- **グレー背景**は `.gray-mode` クラスが `<html>` に付いたとき、  
  しかも**特定の言語だけ** `background-color` を上書き！
- 他の言語（例：css, html, python など）は変わりません。

---

# 🎯 これを使うと

- 黒背景とグレー背景を **自由に切り替え可能**
- グレーに変わるのは「tsx, sh, sql, typescript, js」だけ
- デザインも崩れない！

---

次にもし希望あれば、

- 「ボタンをもっと小さくする」
- 「ボタンの位置を変える」
- 「切り替えた状態を記憶する（ローカルストレージ対応）」

などさらに便利版も作れます！

👉 続きを希望しますか？（すぐ作れます！）
