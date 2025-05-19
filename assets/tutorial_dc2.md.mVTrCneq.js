import{_ as i,c as a,o as n,ae as l}from"./chunks/framework.4ukD4ZLJ.js";const d=JSON.parse('{"title":"最終的なプロジェクト構成図 (推奨版)","description":"","frontmatter":{},"headers":[],"relativePath":"tutorial/dc2.md","filePath":"tutorial/dc2.md"}'),p={name:"tutorial/dc2.md"};function t(F,s,e,h,k,E){return n(),a("div",null,s[0]||(s[0]=[l(`<h1 id="最終的なプロジェクト構成図-推奨版" tabindex="-1">最終的なプロジェクト構成図 (推奨版) <a class="header-anchor" href="#最終的なプロジェクト構成図-推奨版" aria-label="Permalink to &quot;最終的なプロジェクト構成図 (推奨版)&quot;">​</a></h1><div class="language-markdown vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">markdown</span><pre class="shiki shiki-themes github-light material-theme-darker vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">kaikyou-shop/</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">├── frontend/                          # Next.js フロントエンド (App Router)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   ├── app/</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   ├── (public)/                  # 認証不要ルートグループ</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   ├── layout.tsx</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   ├── page.tsx               # トップページ</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   ├── products/</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   │   ├── page.tsx           # 商品一覧</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   │   └── </span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">[</span><span style="--shiki-light:#032F62;--shiki-light-text-decoration:underline;--shiki-dark:#C3E88D;--shiki-dark-text-decoration:inherit;">id</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">]</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">/page.tsx      # 商品詳細</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   ├── (protected)/               # 認証必要ルートグループ</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   ├── cart/</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   │   └── page.tsx           # カート</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   ├── checkout/</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   │   └── page.tsx           # 決済</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   └── account/</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │       └── page.tsx           # アカウント管理</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   ├── components/</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   ├── ui/                        # Shadcn/ui ベースのプリミティブ</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   ├── products/                  # 商品関連</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   ├── cart/                      # カート関連</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   └── shared/                    # 共通コンポーネント</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   ├── lib/</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   ├── api/                       # APIクライアント</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   ├── cart.ts</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   ├── products.ts</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   └── index.ts</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   └── constants.ts               # 定数管理</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   ├── public/</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   └── images/</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   ├── styles/</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   └── next.config.js</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">├── backend/                           # Hono + Cloudflare Workers</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   ├── src/</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   ├── app.ts                     # Honoアプリ初期化</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   ├── routes/</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   ├── index.ts               # ルート集約</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   ├── products/</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   │   ├── index.ts           # /products ルーティング</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   │   ├── </span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">[</span><span style="--shiki-light:#032F62;--shiki-light-text-decoration:underline;--shiki-dark:#C3E88D;--shiki-dark-text-decoration:inherit;">id</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">]</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">.ts            # /products/:id</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   │   └── schema.ts          # 商品スキーマバリデーション</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   ├── cart/</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   │   ├── index.ts           # /cart ルーティング</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   │   └── schema.ts          # カートスキーマ</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   └── auth/</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │       └── index.ts           # 認証関連</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   ├── controllers/               # ビジネスロジック</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   ├── products.ts</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   └── cart.ts</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   ├── middleware/</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   ├── auth.ts                # JWT認証</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   └── validation.ts          # リクエスト検証</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   ├── models/                    # DB操作層</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   ├── product.ts</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   └── cart.ts</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   ├── types/</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   ├── http.ts                # HTTP関連型</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   ├── models.ts              # DBモデル型</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   └── index.ts               # 再エクスポート</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   ├── utils/</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   ├── response.ts            # レスポンスヘルパー</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   │   └── error.ts               # エラーハンドリング</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   └── worker.ts                  # Workersエントリ</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   ├── db/</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   ├── migrations/                # D1マイグレーション</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   │   └── seed.ts                    # テストデータ</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   ├── tests/                         # Vitest</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   ├── wrangler.toml                  # メイン設定</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   ├── wrangler.dev.toml              # 開発環境</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   └── wrangler.prod.toml             # 本番環境</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">├── packages/                          # 共有コード (オプショナル)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   ├── database/                      # DBスキーマ共有</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│   └── config/                        # ESLint等設定</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">│</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">├── docker-compose.yml                 # ローカル開発</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">├── README.md</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">└── package.json                       # Turborepo 構成</span></span></code></pre></div><h3 id="主な改善ポイント" tabindex="-1">主な改善ポイント <a class="header-anchor" href="#主な改善ポイント" aria-label="Permalink to &quot;主な改善ポイント&quot;">​</a></h3><ol><li><p><strong>フロントエンド</strong>:</p><ul><li>Route Groupsを導入し認証状態を明確化</li><li>APIクライアントを機能別に分割</li><li>UIコンポーネントの分類を細分化</li></ul></li><li><p><strong>バックエンド</strong>:</p><ul><li>レイヤードアーキテクチャを明確化</li><li>コントローラー/モデル層を分離</li><li>スキーマバリデーションを専用ファイルに集約</li><li>環境別Wrangler設定を分割</li></ul></li><li><p><strong>開発体験</strong>:</p><ul><li>テストディレクトリを明確化 (Vitest推奨)</li><li>DBマイグレーション管理を強化</li><li>共有コードをpackages配下に集約可能に</li></ul></li><li><p><strong>スケーラビリティ</strong>:</p><ul><li>商品/カート以外の機能追加を見越した構造</li><li>型定義をカテゴリ別に分割管理</li><li>エラーハンドリングを一元化</li></ul></li></ol><p>この構成は、Cloudflare WorkersのベストプラクティスとNext.jsのApp Router特性を考慮したものです。特にバックエンド側は、D1データベースとの連携やJWT認証の実装が容易になるよう設計しています。</p>`,5)]))}const c=i(p,[["render",t]]);export{d as __pageData,c as default};
