import { defineConfig } from "vitepress";

// https://vitepress.vuejs.org/config/app-configs
export default defineConfig({
  base: "/kaikyou-vitepress/",
  title: "Kaikyou の開発ノート",
  description: "React / Next.js / Cloudflare D1 を中心にした開発ブログ",
  lang: "ja-JP",
  cleanUrls: false,

  markdown: {
    theme: {
      light: "github-light", // 白背景テーマ
      dark: "material-theme-darker", // ダークテーマ（黒ではない）
    },
  },

  head: [
    [
      "style",
      {},
      `
        :root {
          --vp-code-block-bg:rgb(236, 251, 221) !important; /* ライトモード背景色 */
        }
        
        .dark {
          --vp-code-block-bg:rgb(38, 7, 38) !important; /* ダークモード背景色（濃いグレー） */
        }
                /* 🌕 全ページ共通の背景色をグレーに設定 */
      body {
        background-color:rgb(248, 227, 152) !important;
      }
              /* 🌙 ダークモード時は黒に */
      .dark body {
        background-color: #000000 !important;
      }
      `,
    ],
  ],

  vite: {
    css: {
      postcss: {
        plugins: [],
      },
    },
  },

  themeConfig: {
    nav: [
      { text: "🏠 ホーム", link: "/" },
      { text: "📚 ガイド", link: "/guide/" },
      { text: "🛠️ チュートリアル", link: "/tutorial/" },
      { text: "📒 記事一覧", link: "/posts/" },
      { text: "👤 私について", link: "/about/me" },
      { text: "📒 設定について", link: "/code/" },
      { text: "📒 説明", link: "/coment/" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "要件定義",
          collapsed: false,
          items: [
            { text: "001-プロジェクトセットアップ", link: "/guide/kekaku1" },
            { text: "推奨パッケージ一覧", link: "/guide/tools" },
          ],
        },
        {
          text: "設計",
          collapsed: false,
          items: [
            { text: "003-1_設計-要件", link: "/guide/keikaku3_1" },
            { text: "003-2_設計-基本", link: "/guide/keikaku3" },
          ],
        },
        {
          text: "frontend開発",
          collapsed: false,
          items: [
            { text: "商品一覧", link: "/guide/pr_list" },
            { text: "ナビゲーション", link: "/guide/nb" },
            { text: "登録", link: "/guide/register" },
            { text: "ログイン", link: "/guide/login" },
            { text: "グローバル状態管理", link: "/guide/groball" },
            { text: "ダッシュボード（管理画面）", link: "/guide/dashboard" },
          ],
        },
        {
          text: "backend開発",
          collapsed: false,
          items: [
            { text: "004-D1データベース作成", link: "/guide/keikaku4" },
            {
              text: "005-フロントとバックエンドの連携",
              link: "/guide/keikaku5",
            },
            { text: "1. 🔐 認証系API開発", link: "/guide/api1" },
            { text: "api作成", link: "/guide/api2" },
            { text: "api作成", link: "/guide/api3" },
            { text: "api作成", link: "/guide/api4" },
            { text: "api作成", link: "/guide/api5" },
            { text: "api作成", link: "/guide/api6" },
            { text: "api作成", link: "/guide/api7" },
            { text: "api作成", link: "/guide/api8" },
            { text: "api作成", link: "/guide/api9" },
            { text: "api作成", link: "/guide/api10" },
            { text: "api作成", link: "/guide/api11" },
          ],
        },
        {
          text: "単体テスト",
          collapsed: false,
          items: [
            { text: "0. 🔐 APIテスト設計簡略版", link: "/guide/api1_sekei" },
            { text: "0. 🔐 APIテストコピペ", link: "/guide/api1_copi" },
            { text: "1. 🔐 認証系API_登録・ログイン", link: "/guide/api1plan" },
            { text: "1. 🔐 認証系API_ログアウト", link: "/guide/api1test" },
            { text: "api作成", link: "/guide/api2" },
            { text: "api作成", link: "/guide/api3" },
            { text: "api作成", link: "/guide/api4" },
            { text: "api作成", link: "/guide/api5" },
            { text: "api作成", link: "/guide/api6" },
            { text: "api作成", link: "/guide/api7" },
            { text: "api作成", link: "/guide/api8" },
            { text: "api作成", link: "/guide/api9" },
            { text: "api作成", link: "/guide/api10" },
            { text: "api作成", link: "/guide/api11" },
          ],
        },
        {
          text: "その他",
          collapsed: true,
          items: [
            { text: "使い方ガイド", link: "/guide/" },
            { text: "破棄予定002-基本ページの作成", link: "/guide/keikaku2" },
            { text: "006-RestAPIの開発", link: "/guide/keikaku6" },
            { text: "007-RestAPIのバージョンアップ", link: "/guide/keikaku7" },
            { text: "工作目标", link: "/posts/memo" },
            { text: "Next.js购物网站开发", link: "/posts/hello-react" },
          ],
        },
      ],
      "/tutorial/": [
        {
          text: "チュートリアル",
          collapsed: true,
          items: [
            { text: "DC-001", link: "/tutorial/react-basics" },
            { text: "CG-001", link: "/tutorial/nextjs-project" },
            { text: "DC-002", link: "/tutorial/dc2" },
            { text: "cg-002", link: "/tutorial/cg2" },
            { text: "メモ―", link: "/tutorial/memeomeimo" },
            { text: "メモ―2", link: "/tutorial/memo2" },
            { text: "メモ―3", link: "/tutorial/memo3" },
            { text: "メモ―3追加女神", link: "/tutorial/memo3_2" },
            { text: "メモ―4", link: "/tutorial/memo4" },
            { text: "天坑水库监狱", link: "/tutorial/memo5" },
            { text: "DeekSeek-R1", link: "/tutorial/dcr1" },
            { text: "DeekSeek-V3", link: "/tutorial/dcv3" },
            { text: "chatGPT-Zo", link: "/tutorial/cgzo" },
          ],
        },
      ],
      "/posts/": [
        {
          text: "記事",
          collapsed: true,
          items: [
            { text: "ゴール", link: "/posts/memo" },
            {
              text: "Next.js で買い物サイトを作る",
              link: "/posts/hello-react",
            },
          ],
        },
        {
          text: "映画",
          collapsed: true,
          items: [
            { text: "ゴール", link: "/posts/memo" },
            { text: "Tailwind CSSセットアップ", link: "/posts/css" },
          ],
        },
      ],
      "/about/": [
        {
          text: "私について",
          collapsed: true,
          items: [
            { text: "プロフィール", link: "/about/me" },
            { text: "ブログの歴史", link: "/about/history" },
            { text: "Cloudflare本番D1作成", link: "/about/cd1" },
            { text: "中レベルAPI設計", link: "/about/tes1" },
            { text: "高レベルAPI設計", link: "/about/tes2" },
            { text: "中高レベルAPI設計の採点", link: "/about/tes3" },
            { text: "chatGPT開発流れ説明", link: "/about/tes4" },
            { text: "DeepSeek V3 テーブル説明", link: "/about/tes6" },
            { text: "DeepSeek R1 テーブル説明", link: "/about/tes5" },
            { text: "ローカル開発とクラウド同期", link: "/about/douki" },
            { text: "1. 🔐 認証系API開発", link: "/about/api1" },
            { text: "2. 👤 ユーザー管理API開発", link: "/about/api2" },
            { text: "3. 🛒 商品（Products）API開発", link: "/about/api3" },
            { text: "4. 🖼️ 商品画像API開発", link: "/about/api4" },
            { text: "5. 🏷️ タグAPI開発", link: "/about/api5" },
            { text: "6. 📂 カテゴリAPI開発", link: "/about/api6" },
            { text: "7. 🛍️ カートAPI開発", link: "/about/api7" },
            { text: "8. 📦 注文API開発", link: "/about/api8" },
            { text: "9. ✍️ レビューAPI開発", link: "/about/api9" },
            { text: "10. 💖 お気に入りAPI開発", link: "/about/api10" },
            {
              text: "11. 📝 管理ログ（Admin Logs）API開発",
              link: "/about/api11",
            },
          ],
        },
      ],
      "/code/": [
        {
          text: "フロントエンド設定",
          collapsed: false,
          items: [
            { text: "環境変数設定ファイル", link: "/code/kankyou" },
            { text: "Tailwind CSSセットアップ", link: "/code/css" },
          ],
        },
        {
          text: "バックエンド設定",
          collapsed: false,
          items: [
            {
              text: "（Cloudflare Workers）設定",
              link: "/code/setting",
            },
            { text: "環境変数設定", link: "/code/bk_kankyou" },
            { text: "バックエンドルート設定", link: "/code/route" },
            { text: "テスト環境の設定", link: "/code/jesttest" },
            { text: "Vitestテスト環境の設定", link: "/code/vitest" },
          ],
        },
        {
          text: "プロジェクト設定",
          collapsed: false,
          items: [
            { text: ".gitignore設定", link: "/code/anzen" },
            { text: "修正内容デプロイ手順", link: "/code/deburoi" },
            { text: "Vercel環境変数設定", link: "/code/v_kankyou" },
            { text: "githubセットアップ", link: "/code/github_set" },
            { text: "壊れた環境の復元", link: "/code/github" },
          ],
        },
      ],
      "/coment/": [
        {
          text: "バックエンド説明",
          collapsed: false,
          items: [
            { text: "型定義 ", link: "/coment/type" },
            { text: "ミドルウェア ", link: "/coment/jwtmiddleware" },
            { text: "認証関連ユーティリティ", link: "/coment/auth" },
            { text: "storage ", link: "/coment/storage" },
            { text: "worker", link: "/coment/worker" },
            { text: "ルート集約", link: "/coment/routes" },
            { text: "registerHandler", link: "/coment/001" },
            { text: "loginHandler★★★★★", link: "/coment/002" },
            { text: "getUserHandler", link: "/coment/003" },
            { text: "logoutHandler", link: "/coment/004" },
            { text: "meHandler", link: "/coment/005" },
            { text: "productPostHandler", link: "/coment/006" },
            { text: "productGetHandler", link: "/coment/007" },
            { text: "productGetByIdHandler", link: "/coment/008" },
            { text: "getCartHandler", link: "/coment/009" },
          ],
        },
        {
          text: "フロントエンド説明",
          collapsed: false,
          items: [
            { text: "NavBar.tsx", link: "/coment/navber" },
            { text: "グローバル状態管理", link: "/coment/groball_c" },
          ],
        },
        {
          text: "プロジェクト設定",
          collapsed: false,
          items: [{ text: "vercel.json", link: "/coment/vercel_json" }],
        },
      ],
    },

    socialLinks: [{ icon: "github", link: "https://github.com/your-account" }],
  },
});
