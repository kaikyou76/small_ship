以下に、各履歴を「**仕事内容**」「**仕事の流れ**」という構成で書き換えました。形式を統一しつつ、読みやすさ・伝わりやすさにも配慮しています。

---

### 🔸 既存システムの保守・運用（React による画面改善含む）

- **仕事内容**
  既存の社内システムの保守・運用をチームと一緒に担当しています。エンドユーザーの希望による仕様調整、機能改修（設計・実装・テスト）、影響調査、バグ修正などに対応しております。React 未経験メンバーへの技術サポートも担当しています。

- **仕事の流れ**
  まずユーザーや関係部署からの問い合わせ・要望を受け、影響調査・仕様確認を行った上で、改修・障害対応の方針を決定。React を使った画面改善では、業務画面（注文管理、ユーザー管理、口座情報編集）を対象に、設計・状態管理方針のレクチャーとコンポーネント再構成を主導。特に口座情報編集画面では React Hook Form によるバリデーション付きフォームを導入し、UX と保守性を向上。

---

### 🔸 バッチシステム開発（Java + Spring Batch）

- **仕事内容**
  某証券会社の IP 電話メンテナンスシステムにおける、データ集計バッチの設計・開発を担当。業務要件に基づいた詳細設計書の作成と、Spring Batch を用いたバッチプログラムの実装。

- **仕事の流れ**
  要件ヒアリング後、現行業務フローを踏まえて処理仕様を整理。詳細設計書を作成し、日次・月次処理の要件を満たすよう、Java + Spring Batch でデータの集計・加工・出力処理を実装。テスト・運用を通じて安定稼働を確保。

---

### 🔸 新規システム導入に伴う要件定義・業務整理

- **仕事内容**
  新規システム導入に向けた業務整理、要件定義、及びシステム構成方針の策定を担当。

- **仕事の流れ**
  現場部門とのヒアリングを通じて既存業務を可視化し、業務フローを整理。課題抽出を行い、それに基づくシステム要件を文書化。ツールや技術スタックの選定にも関与し、開発フェーズにスムーズに移行できる体制を整備。

---

### 🔸 EC サイト注文管理システム刷新（React + Spring Boot）

- **仕事内容**
  大手 EC サイトにおける注文管理システム刷新プロジェクトで、要件調整から設計・フロントエンド（React）・バックエンド（Spring Boot）開発までを担当。

- **仕事の流れ**
  プロダクトオーナーとの要件確認を行い、REST API 仕様を設計。フロントエンドは React によるログイン・メニュー・データ取込・結果確認などの各画面を構築し、Axios による非同期通信、JWT 認証も実装。バックエンドは Spring Boot で REST API を開発し、フロント〜バック間の整合性を重視した設計・実装を実施。

---

### 🔸 レガシーシステム保守開発（Angular4 + Node.js）

- **仕事内容**
  既存のレガシーシステムに対して、Angular4 を使ったフロントエンドの改善、Node.js (Express) を使ったバックエンド処理の改修を担当。

- **仕事の流れ**
  画面 UI の改善においては、デザイン・動作性のレビューを元に Angular 側をリファクタリング。バックエンド側では API 処理の構造見直しを行い、共通化・バリデーション統一などを実施。結果としてレスポンス速度の 30%以上向上と保守性の改善に貢献。

---

### 🔸 予約管理システムの新規開発（Vue.js + Spring Boot）

- **仕事内容**
  予約管理システムの新規構築において、基本設計・詳細設計、Spring Boot による REST API 実装、Vue.js によるフロントエンド開発、テスト整備を担当。

- **仕事の流れ**
  要件確認後に基本設計・詳細設計を行い、バックエンド（Spring Boot）で API 実装、フロントエンドは Vue.js を用いて管理画面の UI を構築。Jest / Vue Test Utils による単体テストの整備、さらに Cypress による E2E 自動テストも実施し、リリース前の品質担保に貢献。

---

必要であれば、職務経歴書やポートフォリオ形式への整形も可能です。ご希望あればお知らせください。

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
