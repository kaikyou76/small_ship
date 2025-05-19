import{_ as n,c as a,o as i,ae as p}from"./chunks/framework.Bt0T77vy.js";const r=JSON.parse('{"title":"状態管理 AuthProvider コンポーネント 2.0","description":"","frontmatter":{},"headers":[],"relativePath":"guide/auth_provider2.md","filePath":"guide/auth_provider2.md"}'),t={name:"guide/auth_provider2.md"};function l(e,s,h,o,u,k){return i(),a("div",null,s[0]||(s[0]=[p(`<h1 id="状態管理-authprovider-コンポーネント-2-0" tabindex="-1">状態管理 AuthProvider コンポーネント 2.0 <a class="header-anchor" href="#状態管理-authprovider-コンポーネント-2-0" aria-label="Permalink to &quot;状態管理 AuthProvider コンポーネント 2.0&quot;">​</a></h1><p>ログイン後の JWT 認証は正常に動作しているものの、フロントエンド側で過剰な API リクエストが発生</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light material-theme-darker vp-code" tabindex="0"><code><span class="line"><span>[wrangler:inf] GET /api/sessions 200 OK (100ms)</span></span>
<span class="line"><span>{&quot;timestamp&quot;:&quot;2025-05-17T04:25:17.404Z&quot;,&quot;method&quot;:&quot;OPTIONS&quot;,&quot;path&quot;:&quot;/api/users/me&quot;,&quot;normalizedPath&quot;:&quot;/api/users/me&quot;,&quot;phase&quot;:&quot;request-start&quot;,&quot;environment&quot;:&quot;development&quot;}</span></span>
<span class="line"><span>{&quot;timestamp&quot;:&quot;2025-05-17T04:25:17.406Z&quot;,&quot;method&quot;:&quot;GET&quot;,&quot;path&quot;:&quot;/api/sessions&quot;,&quot;normalizedPath&quot;:&quot;/api/sessions&quot;,&quot;phase&quot;:&quot;request-start&quot;,&quot;environment&quot;:&quot;development&quot;}</span></span>
<span class="line"><span>[wrangler:inf] OPTIONS /api/users/me 204 No Content (4ms)</span></span>
<span class="line"><span>[2025-05-17T04:25:17.407Z] [JWT] ミドルウェア開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;lci9wq&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/sessions&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.407Z] [JWT] 認証ヘッダー確認 {</span></span>
<span class="line"><span>  &quot;header&quot;: &quot;Bearer eyJ...&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.407Z] [JWT] トークン正規化完了 {</span></span>
<span class="line"><span>  &quot;original&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;,</span></span>
<span class="line"><span>  &quot;normalized&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.408Z] [JWT] トークン検証開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;lci9wq&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/sessions&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.408Z] [JWT] 認証成功 {</span></span>
<span class="line"><span>  &quot;user_id&quot;: 6,</span></span>
<span class="line"><span>  &quot;type&quot;: &quot;number&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[SESSION] 処理開始 { user_id: 6, method: &#39;GET&#39;, path: &#39;/api/sessions&#39; }</span></span>
<span class="line"><span>[SESSION] DBクエリ実行 { userId: 6 }</span></span>
<span class="line"><span>[SESSION] 処理成功 { count: 10, duration: &#39;31ms&#39; }</span></span>
<span class="line"><span>[2025-05-17T04:25:17.439Z] [JWT] ミドルウェア完了 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;lci9wq&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/sessions&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[wrangler:inf] GET /api/sessions 200 OK (37ms)</span></span>
<span class="line"><span>{&quot;timestamp&quot;:&quot;2025-05-17T04:25:17.444Z&quot;,&quot;method&quot;:&quot;GET&quot;,&quot;path&quot;:&quot;/api/users/me&quot;,&quot;normalizedPath&quot;:&quot;/api/users/me&quot;,&quot;phase&quot;:&quot;request-start&quot;,&quot;environment&quot;:&quot;development&quot;}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.445Z] [JWT] ミドルウェア開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;orleez&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/users/me&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.445Z] [JWT] 認証ヘッダー確認 {</span></span>
<span class="line"><span>  &quot;header&quot;: &quot;Bearer eyJ...&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.445Z] [JWT] トークン正規化完了 {</span></span>
<span class="line"><span>  &quot;original&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;,</span></span>
<span class="line"><span>  &quot;normalized&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.446Z] [JWT] トークン検証開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;orleez&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/users/me&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.446Z] [JWT] 認証成功 {</span></span>
<span class="line"><span>  &quot;user_id&quot;: 6,</span></span>
<span class="line"><span>  &quot;type&quot;: &quot;number&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.455Z] [JWT] ミドルウェア完了 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;orleez&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/users/me&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[wrangler:inf] GET /api/users/me 200 OK (47ms)</span></span>
<span class="line"><span>{&quot;timestamp&quot;:&quot;2025-05-17T04:25:17.467Z&quot;,&quot;method&quot;:&quot;OPTIONS&quot;,&quot;path&quot;:&quot;/api/users/me&quot;,&quot;normalizedPath&quot;:&quot;/api/users/me&quot;,&quot;phase&quot;:&quot;request-start&quot;,&quot;environment&quot;:&quot;development&quot;}</span></span>
<span class="line"><span>{&quot;timestamp&quot;:&quot;2025-05-17T04:25:17.468Z&quot;,&quot;method&quot;:&quot;GET&quot;,&quot;path&quot;:&quot;/api/sessions&quot;,&quot;normalizedPath&quot;:&quot;/api/sessions&quot;,&quot;phase&quot;:&quot;request-start&quot;,&quot;environment&quot;:&quot;development&quot;}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.469Z] [JWT] ミドルウェア開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;84ytv1&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/sessions&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.469Z] [JWT] 認証ヘッダー確認 {</span></span>
<span class="line"><span>  &quot;header&quot;: &quot;Bearer eyJ...&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.469Z] [JWT] トークン正規化完了 {</span></span>
<span class="line"><span>  &quot;original&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;,</span></span>
<span class="line"><span>  &quot;normalized&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.470Z] [JWT] トークン検証開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;84ytv1&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/sessions&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[wrangler:inf] OPTIONS /api/users/me 204 No Content (4ms)</span></span>
<span class="line"><span>[2025-05-17T04:25:17.470Z] [JWT] 認証成功 {</span></span>
<span class="line"><span>  &quot;user_id&quot;: 6,</span></span>
<span class="line"><span>  &quot;type&quot;: &quot;number&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[SESSION] 処理開始 { user_id: 6, method: &#39;GET&#39;, path: &#39;/api/sessions&#39; }</span></span>
<span class="line"><span>[SESSION] DBクエリ実行 { userId: 6 }</span></span>
<span class="line"><span>[SESSION] 処理成功 { count: 10, duration: &#39;67ms&#39; }</span></span>
<span class="line"><span>[2025-05-17T04:25:17.538Z] [JWT] ミドルウェア完了 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;84ytv1&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/sessions&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[wrangler:inf] GET /api/sessions 200 OK (78ms)</span></span>
<span class="line"><span>{&quot;timestamp&quot;:&quot;2025-05-17T04:25:17.545Z&quot;,&quot;method&quot;:&quot;GET&quot;,&quot;path&quot;:&quot;/api/users/me&quot;,&quot;normalizedPath&quot;:&quot;/api/users/me&quot;,&quot;phase&quot;:&quot;request-start&quot;,&quot;environment&quot;:&quot;development&quot;}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.545Z] [JWT] ミドルウェア開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;gajacn&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/users/me&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.546Z] [JWT] 認証ヘッダー確認 {</span></span>
<span class="line"><span>  &quot;header&quot;: &quot;Bearer eyJ...&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.547Z] [JWT] トークン正規化完了 {</span></span>
<span class="line"><span>  &quot;original&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;,</span></span>
<span class="line"><span>  &quot;normalized&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.548Z] [JWT] トークン検証開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;gajacn&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/users/me&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.550Z] [JWT] 認証成功 {</span></span>
<span class="line"><span>  &quot;user_id&quot;: 6,</span></span>
<span class="line"><span>  &quot;type&quot;: &quot;number&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.595Z] [JWT] ミドルウェア完了 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;gajacn&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/users/me&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[wrangler:inf] GET /api/users/me 200 OK (126ms)</span></span>
<span class="line"><span>{&quot;timestamp&quot;:&quot;2025-05-17T04:25:17.618Z&quot;,&quot;method&quot;:&quot;OPTIONS&quot;,&quot;path&quot;:&quot;/api/users/me&quot;,&quot;normalizedPath&quot;:&quot;/api/users/me&quot;,&quot;phase&quot;:&quot;request-start&quot;,&quot;environment&quot;:&quot;development&quot;}</span></span>
<span class="line"><span>{&quot;timestamp&quot;:&quot;2025-05-17T04:25:17.621Z&quot;,&quot;method&quot;:&quot;GET&quot;,&quot;path&quot;:&quot;/api/sessions&quot;,&quot;normalizedPath&quot;:&quot;/api/sessions&quot;,&quot;phase&quot;:&quot;request-start&quot;,&quot;environment&quot;:&quot;development&quot;}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.622Z] [JWT] ミドルウェア開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;c8dwqx&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/sessions&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.623Z] [JWT] 認証ヘッダー確認 {</span></span>
<span class="line"><span>  &quot;header&quot;: &quot;Bearer eyJ...&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.623Z] [JWT] トークン正規化完了 {</span></span>
<span class="line"><span>  &quot;original&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;,</span></span>
<span class="line"><span>  &quot;normalized&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.624Z] [JWT] トークン検証開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;c8dwqx&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/sessions&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[wrangler:inf] OPTIONS /api/users/me 204 No Content (7ms)</span></span>
<span class="line"><span>[2025-05-17T04:25:17.626Z] [JWT] 認証成功 {</span></span>
<span class="line"><span>  &quot;user_id&quot;: 6,</span></span>
<span class="line"><span>  &quot;type&quot;: &quot;number&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[SESSION] 処理開始 { user_id: 6, method: &#39;GET&#39;, path: &#39;/api/sessions&#39; }</span></span>
<span class="line"><span>[SESSION] DBクエリ実行 { userId: 6 }</span></span>
<span class="line"><span>[SESSION] 処理成功 { count: 10, duration: &#39;66ms&#39; }</span></span>
<span class="line"><span>[2025-05-17T04:25:17.692Z] [JWT] ミドルウェア完了 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;c8dwqx&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/sessions&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>{&quot;timestamp&quot;:&quot;2025-05-17T04:25:17.694Z&quot;,&quot;method&quot;:&quot;GET&quot;,&quot;path&quot;:&quot;/api/users/me&quot;,&quot;normalizedPath&quot;:&quot;/api/users/me&quot;,&quot;phase&quot;:&quot;request-start&quot;,&quot;environment&quot;:&quot;development&quot;}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.695Z] [JWT] ミドルウェア開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;45e2m2&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/users/me&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.696Z] [JWT] 認証ヘッダー確認 {</span></span>
<span class="line"><span>  &quot;header&quot;: &quot;Bearer eyJ...&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.696Z] [JWT] トークン正規化完了 {</span></span>
<span class="line"><span>  &quot;original&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;,</span></span>
<span class="line"><span>  &quot;normalized&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[wrangler:inf] GET /api/sessions 200 OK (78ms)</span></span>
<span class="line"><span>[2025-05-17T04:25:17.696Z] [JWT] トークン検証開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;45e2m2&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/users/me&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.697Z] [JWT] 認証成功 {</span></span>
<span class="line"><span>  &quot;user_id&quot;: 6,</span></span>
<span class="line"><span>  &quot;type&quot;: &quot;number&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.755Z] [JWT] ミドルウェア完了 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;45e2m2&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/users/me&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[wrangler:inf] GET /api/users/me 200 OK (127ms)</span></span>
<span class="line"><span>{&quot;timestamp&quot;:&quot;2025-05-17T04:25:17.769Z&quot;,&quot;method&quot;:&quot;GET&quot;,&quot;path&quot;:&quot;/api/sessions&quot;,&quot;normalizedPath&quot;:&quot;/api/sessions&quot;,&quot;phase&quot;:&quot;request-start&quot;,&quot;environment&quot;:&quot;development&quot;}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.769Z] [JWT] ミドルウェア開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;gs00j4&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/sessions&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.770Z] [JWT] 認証ヘッダー確認 {</span></span>
<span class="line"><span>  &quot;header&quot;: &quot;Bearer eyJ...&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.770Z] [JWT] トークン正規化完了 {</span></span>
<span class="line"><span>  &quot;original&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;,</span></span>
<span class="line"><span>  &quot;normalized&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.770Z] [JWT] トークン検証開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;gs00j4&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/sessions&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.771Z] [JWT] 認証成功 {</span></span>
<span class="line"><span>  &quot;user_id&quot;: 6,</span></span>
<span class="line"><span>  &quot;type&quot;: &quot;number&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[SESSION] 処理開始 { user_id: 6, method: &#39;GET&#39;, path: &#39;/api/sessions&#39; }</span></span>
<span class="line"><span>[SESSION] DBクエリ実行 { userId: 6 }</span></span>
<span class="line"><span>[SESSION] 処理成功 { count: 10, duration: &#39;68ms&#39; }</span></span>
<span class="line"><span>[2025-05-17T04:25:17.839Z] [JWT] ミドルウェア完了 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;gs00j4&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/sessions&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>{&quot;timestamp&quot;:&quot;2025-05-17T04:25:17.841Z&quot;,&quot;method&quot;:&quot;OPTIONS&quot;,&quot;path&quot;:&quot;/api/users/me&quot;,&quot;normalizedPath&quot;:&quot;/api/users/me&quot;,&quot;phase&quot;:&quot;request-start&quot;,&quot;environment&quot;:&quot;development&quot;}</span></span>
<span class="line"><span>[wrangler:inf] GET /api/sessions 200 OK (75ms)</span></span>
<span class="line"><span>[wrangler:inf] OPTIONS /api/users/me 204 No Content (69ms)</span></span>
<span class="line"><span>{&quot;timestamp&quot;:&quot;2025-05-17T04:25:17.852Z&quot;,&quot;method&quot;:&quot;GET&quot;,&quot;path&quot;:&quot;/api/users/me&quot;,&quot;normalizedPath&quot;:&quot;/api/users/me&quot;,&quot;phase&quot;:&quot;request-start&quot;,&quot;environment&quot;:&quot;development&quot;}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.852Z] [JWT] ミドルウェア開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;a47b78&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/users/me&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.852Z] [JWT] 認証ヘッダー確認 {</span></span>
<span class="line"><span>  &quot;header&quot;: &quot;Bearer eyJ...&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.853Z] [JWT] トークン正規化完了 {</span></span>
<span class="line"><span>  &quot;original&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;,</span></span>
<span class="line"><span>  &quot;normalized&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.853Z] [JWT] トークン検証開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;a47b78&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/users/me&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.854Z] [JWT] 認証成功 {</span></span>
<span class="line"><span>  &quot;user_id&quot;: 6,</span></span>
<span class="line"><span>  &quot;type&quot;: &quot;number&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.916Z] [JWT] ミドルウェア完了 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;a47b78&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/users/me&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[wrangler:inf] GET /api/users/me 200 OK (69ms)</span></span>
<span class="line"><span>{&quot;timestamp&quot;:&quot;2025-05-17T04:25:17.926Z&quot;,&quot;method&quot;:&quot;OPTIONS&quot;,&quot;path&quot;:&quot;/api/users/me&quot;,&quot;normalizedPath&quot;:&quot;/api/users/me&quot;,&quot;phase&quot;:&quot;request-start&quot;,&quot;environment&quot;:&quot;development&quot;}</span></span>
<span class="line"><span>{&quot;timestamp&quot;:&quot;2025-05-17T04:25:17.927Z&quot;,&quot;method&quot;:&quot;GET&quot;,&quot;path&quot;:&quot;/api/sessions&quot;,&quot;normalizedPath&quot;:&quot;/api/sessions&quot;,&quot;phase&quot;:&quot;request-start&quot;,&quot;environment&quot;:&quot;development&quot;}</span></span>
<span class="line"><span>[wrangler:inf] OPTIONS /api/users/me 204 No Content (4ms)</span></span>
<span class="line"><span>[2025-05-17T04:25:17.928Z] [JWT] ミドルウェア開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;2f0wms&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/sessions&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.928Z] [JWT] 認証ヘッダー確認 {</span></span>
<span class="line"><span>  &quot;header&quot;: &quot;Bearer eyJ...&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.929Z] [JWT] トークン正規化完了 {</span></span>
<span class="line"><span>  &quot;original&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;,</span></span>
<span class="line"><span>  &quot;normalized&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.929Z] [JWT] トークン検証開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;2f0wms&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/sessions&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.930Z] [JWT] 認証成功 {</span></span>
<span class="line"><span>  &quot;user_id&quot;: 6,</span></span>
<span class="line"><span>  &quot;type&quot;: &quot;number&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[SESSION] 処理開始 { user_id: 6, method: &#39;GET&#39;, path: &#39;/api/sessions&#39; }</span></span>
<span class="line"><span>[SESSION] DBクエリ実行 { userId: 6 }</span></span>
<span class="line"><span>[SESSION] 処理成功 { count: 10, duration: &#39;39ms&#39; }</span></span>
<span class="line"><span>[2025-05-17T04:25:17.969Z] [JWT] ミドルウェア完了 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;2f0wms&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/sessions&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>{&quot;timestamp&quot;:&quot;2025-05-17T04:25:17.970Z&quot;,&quot;method&quot;:&quot;GET&quot;,&quot;path&quot;:&quot;/api/users/me&quot;,&quot;normalizedPath&quot;:&quot;/api/users/me&quot;,&quot;phase&quot;:&quot;request-start&quot;,&quot;environment&quot;:&quot;development&quot;}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.970Z] [JWT] ミドルウェア開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;6d3r6n&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/users/me&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.971Z] [JWT] 認証ヘッダー確認 {</span></span>
<span class="line"><span>  &quot;header&quot;: &quot;Bearer eyJ...&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.971Z] [JWT] トークン正規化完了 {</span></span>
<span class="line"><span>  &quot;original&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;,</span></span>
<span class="line"><span>  &quot;normalized&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[wrangler:inf] GET /api/sessions 200 OK (45ms)</span></span>
<span class="line"><span>[2025-05-17T04:25:17.971Z] [JWT] トークン検証開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;6d3r6n&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/users/me&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.971Z] [JWT] 認証成功 {</span></span>
<span class="line"><span>  &quot;user_id&quot;: 6,</span></span>
<span class="line"><span>  &quot;type&quot;: &quot;number&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:17.988Z] [JWT] ミドルウェア完了 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;6d3r6n&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/users/me&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[wrangler:inf] GET /api/users/me 200 OK (59ms)</span></span>
<span class="line"><span>{&quot;timestamp&quot;:&quot;2025-05-17T04:25:17.998Z&quot;,&quot;method&quot;:&quot;OPTIONS&quot;,&quot;path&quot;:&quot;/api/users/me&quot;,&quot;normalizedPath&quot;:&quot;/api/users/me&quot;,&quot;phase&quot;:&quot;request-start&quot;,&quot;environment&quot;:&quot;development&quot;}</span></span>
<span class="line"><span>{&quot;timestamp&quot;:&quot;2025-05-17T04:25:18.000Z&quot;,&quot;method&quot;:&quot;GET&quot;,&quot;path&quot;:&quot;/api/sessions&quot;,&quot;normalizedPath&quot;:&quot;/api/sessions&quot;,&quot;phase&quot;:&quot;request-start&quot;,&quot;environment&quot;:&quot;development&quot;}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.000Z] [JWT] ミドルウェア開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;gkz32l&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/sessions&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.000Z] [JWT] 認証ヘッダー確認 {</span></span>
<span class="line"><span>  &quot;header&quot;: &quot;Bearer eyJ...&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.001Z] [JWT] トークン正規化完了 {</span></span>
<span class="line"><span>  &quot;original&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;,</span></span>
<span class="line"><span>  &quot;normalized&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[wrangler:inf] OPTIONS /api/users/me 204 No Content (3ms)</span></span>
<span class="line"><span>[2025-05-17T04:25:18.001Z] [JWT] トークン検証開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;gkz32l&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/sessions&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.002Z] [JWT] 認証成功 {</span></span>
<span class="line"><span>  &quot;user_id&quot;: 6,</span></span>
<span class="line"><span>  &quot;type&quot;: &quot;number&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[SESSION] 処理開始 { user_id: 6, method: &#39;GET&#39;, path: &#39;/api/sessions&#39; }</span></span>
<span class="line"><span>[SESSION] DBクエリ実行 { userId: 6 }</span></span>
<span class="line"><span>[SESSION] 処理成功 { count: 10, duration: &#39;18ms&#39; }</span></span>
<span class="line"><span>[2025-05-17T04:25:18.021Z] [JWT] ミドルウェア完了 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;gkz32l&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/sessions&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>{&quot;timestamp&quot;:&quot;2025-05-17T04:25:18.021Z&quot;,&quot;method&quot;:&quot;GET&quot;,&quot;path&quot;:&quot;/api/users/me&quot;,&quot;normalizedPath&quot;:&quot;/api/users/me&quot;,&quot;phase&quot;:&quot;request-start&quot;,&quot;environment&quot;:&quot;development&quot;}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.022Z] [JWT] ミドルウェア開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;1htnxu&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/users/me&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.022Z] [JWT] 認証ヘッダー確認 {</span></span>
<span class="line"><span>  &quot;header&quot;: &quot;Bearer eyJ...&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.022Z] [JWT] トークン正規化完了 {</span></span>
<span class="line"><span>  &quot;original&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;,</span></span>
<span class="line"><span>  &quot;normalized&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.022Z] [JWT] トークン検証開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;1htnxu&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/users/me&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[wrangler:inf] GET /api/sessions 200 OK (24ms)</span></span>
<span class="line"><span>[2025-05-17T04:25:18.023Z] [JWT] 認証成功 {</span></span>
<span class="line"><span>  &quot;user_id&quot;: 6,</span></span>
<span class="line"><span>  &quot;type&quot;: &quot;number&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.044Z] [JWT] ミドルウェア完了 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;1htnxu&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/users/me&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[wrangler:inf] GET /api/users/me 200 OK (44ms)</span></span>
<span class="line"><span>{&quot;timestamp&quot;:&quot;2025-05-17T04:25:18.056Z&quot;,&quot;method&quot;:&quot;OPTIONS&quot;,&quot;path&quot;:&quot;/api/users/me&quot;,&quot;normalizedPath&quot;:&quot;/api/users/me&quot;,&quot;phase&quot;:&quot;request-start&quot;,&quot;environment&quot;:&quot;development&quot;}</span></span>
<span class="line"><span>{&quot;timestamp&quot;:&quot;2025-05-17T04:25:18.058Z&quot;,&quot;method&quot;:&quot;GET&quot;,&quot;path&quot;:&quot;/api/sessions&quot;,&quot;normalizedPath&quot;:&quot;/api/sessions&quot;,&quot;phase&quot;:&quot;request-start&quot;,&quot;environment&quot;:&quot;development&quot;}</span></span>
<span class="line"><span>[wrangler:inf] OPTIONS /api/users/me 204 No Content (3ms)</span></span>
<span class="line"><span>[2025-05-17T04:25:18.058Z] [JWT] ミドルウェア開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;mrn8h0&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/sessions&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.058Z] [JWT] 認証ヘッダー確認 {</span></span>
<span class="line"><span>  &quot;header&quot;: &quot;Bearer eyJ...&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.059Z] [JWT] トークン正規化完了 {</span></span>
<span class="line"><span>  &quot;original&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;,</span></span>
<span class="line"><span>  &quot;normalized&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.059Z] [JWT] トークン検証開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;mrn8h0&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/sessions&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.059Z] [JWT] 認証成功 {</span></span>
<span class="line"><span>  &quot;user_id&quot;: 6,</span></span>
<span class="line"><span>  &quot;type&quot;: &quot;number&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[SESSION] 処理開始 { user_id: 6, method: &#39;GET&#39;, path: &#39;/api/sessions&#39; }</span></span>
<span class="line"><span>[SESSION] DBクエリ実行 { userId: 6 }</span></span>
<span class="line"><span>[SESSION] 処理成功 { count: 10, duration: &#39;28ms&#39; }</span></span>
<span class="line"><span>[2025-05-17T04:25:18.087Z] [JWT] ミドルウェア完了 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;mrn8h0&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/sessions&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>{&quot;timestamp&quot;:&quot;2025-05-17T04:25:18.088Z&quot;,&quot;method&quot;:&quot;GET&quot;,&quot;path&quot;:&quot;/api/users/me&quot;,&quot;normalizedPath&quot;:&quot;/api/users/me&quot;,&quot;phase&quot;:&quot;request-start&quot;,&quot;environment&quot;:&quot;development&quot;}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.088Z] [JWT] ミドルウェア開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;247jq5&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/users/me&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.089Z] [JWT] 認証ヘッダー確認 {</span></span>
<span class="line"><span>  &quot;header&quot;: &quot;Bearer eyJ...&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.089Z] [JWT] トークン正規化完了 {</span></span>
<span class="line"><span>  &quot;original&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;,</span></span>
<span class="line"><span>  &quot;normalized&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.089Z] [JWT] トークン検証開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;247jq5&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/users/me&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[wrangler:inf] GET /api/sessions 200 OK (32ms)</span></span>
<span class="line"><span>[2025-05-17T04:25:18.090Z] [JWT] 認証成功 {</span></span>
<span class="line"><span>  &quot;user_id&quot;: 6,</span></span>
<span class="line"><span>  &quot;type&quot;: &quot;number&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.096Z] [JWT] ミドルウェア完了 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;247jq5&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/users/me&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[wrangler:inf] GET /api/users/me 200 OK (37ms)</span></span>
<span class="line"><span>{&quot;timestamp&quot;:&quot;2025-05-17T04:25:18.140Z&quot;,&quot;method&quot;:&quot;OPTIONS&quot;,&quot;path&quot;:&quot;/api/users/me&quot;,&quot;normalizedPath&quot;:&quot;/api/users/me&quot;,&quot;phase&quot;:&quot;request-start&quot;,&quot;environment&quot;:&quot;development&quot;}</span></span>
<span class="line"><span>{&quot;timestamp&quot;:&quot;2025-05-17T04:25:18.142Z&quot;,&quot;method&quot;:&quot;GET&quot;,&quot;path&quot;:&quot;/api/sessions&quot;,&quot;normalizedPath&quot;:&quot;/api/sessions&quot;,&quot;phase&quot;:&quot;request-start&quot;,&quot;environment&quot;:&quot;development&quot;}</span></span>
<span class="line"><span>[wrangler:inf] OPTIONS /api/users/me 204 No Content (4ms)</span></span>
<span class="line"><span>[2025-05-17T04:25:18.142Z] [JWT] ミドルウェア開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;rfscyo&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/sessions&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.143Z] [JWT] 認証ヘッダー確認 {</span></span>
<span class="line"><span>  &quot;header&quot;: &quot;Bearer eyJ...&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.143Z] [JWT] トークン正規化完了 {</span></span>
<span class="line"><span>  &quot;original&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;,</span></span>
<span class="line"><span>  &quot;normalized&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.143Z] [JWT] トークン検証開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;rfscyo&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/sessions&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.144Z] [JWT] 認証成功 {</span></span>
<span class="line"><span>  &quot;user_id&quot;: 6,</span></span>
<span class="line"><span>  &quot;type&quot;: &quot;number&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[SESSION] 処理開始 { user_id: 6, method: &#39;GET&#39;, path: &#39;/api/sessions&#39; }</span></span>
<span class="line"><span>[SESSION] DBクエリ実行 { userId: 6 }</span></span>
<span class="line"><span>[SESSION] 処理成功 { count: 10, duration: &#39;50ms&#39; }</span></span>
<span class="line"><span>[2025-05-17T04:25:18.195Z] [JWT] ミドルウェア完了 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;rfscyo&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/sessions&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>{&quot;timestamp&quot;:&quot;2025-05-17T04:25:18.195Z&quot;,&quot;method&quot;:&quot;GET&quot;,&quot;path&quot;:&quot;/api/users/me&quot;,&quot;normalizedPath&quot;:&quot;/api/users/me&quot;,&quot;phase&quot;:&quot;request-start&quot;,&quot;environment&quot;:&quot;development&quot;}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.196Z] [JWT] ミドルウェア開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;qm4lm0&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/users/me&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.196Z] [JWT] 認証ヘッダー確認 {</span></span>
<span class="line"><span>  &quot;header&quot;: &quot;Bearer eyJ...&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[wrangler:inf] GET /api/sessions 200 OK (56ms)</span></span>
<span class="line"><span>[2025-05-17T04:25:18.196Z] [JWT] トークン正規化完了 {</span></span>
<span class="line"><span>  &quot;original&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;,</span></span>
<span class="line"><span>  &quot;normalized&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.196Z] [JWT] トークン検証開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;qm4lm0&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/users/me&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.197Z] [JWT] 認証成功 {</span></span>
<span class="line"><span>  &quot;user_id&quot;: 6,</span></span>
<span class="line"><span>  &quot;type&quot;: &quot;number&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.248Z] [JWT] ミドルウェア完了 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;qm4lm0&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/users/me&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[wrangler:inf] GET /api/users/me 200 OK (106ms)</span></span>
<span class="line"><span>{&quot;timestamp&quot;:&quot;2025-05-17T04:25:18.269Z&quot;,&quot;method&quot;:&quot;OPTIONS&quot;,&quot;path&quot;:&quot;/api/users/me&quot;,&quot;normalizedPath&quot;:&quot;/api/users/me&quot;,&quot;phase&quot;:&quot;request-start&quot;,&quot;environment&quot;:&quot;development&quot;}</span></span>
<span class="line"><span>{&quot;timestamp&quot;:&quot;2025-05-17T04:25:18.273Z&quot;,&quot;method&quot;:&quot;GET&quot;,&quot;path&quot;:&quot;/api/sessions&quot;,&quot;normalizedPath&quot;:&quot;/api/sessions&quot;,&quot;phase&quot;:&quot;request-start&quot;,&quot;environment&quot;:&quot;development&quot;}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.273Z] [JWT] ミドルウェア開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;sbq6b2&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/sessions&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.274Z] [JWT] 認証ヘッダー確認 {</span></span>
<span class="line"><span>  &quot;header&quot;: &quot;Bearer eyJ...&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.275Z] [JWT] トークン正規化完了 {</span></span>
<span class="line"><span>  &quot;original&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;,</span></span>
<span class="line"><span>  &quot;normalized&quot;: &quot;eyJhbGciOi...pUC7CpsugY&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[wrangler:inf] OPTIONS /api/users/me 204 No Content (7ms)</span></span>
<span class="line"><span>[2025-05-17T04:25:18.275Z] [JWT] トークン検証開始 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;sbq6b2&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/sessions&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[2025-05-17T04:25:18.276Z] [JWT] 認証成功 {</span></span>
<span class="line"><span>  &quot;user_id&quot;: 6,</span></span>
<span class="line"><span>  &quot;type&quot;: &quot;number&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>[SESSION] 処理開始 { user_id: 6, method: &#39;GET&#39;, path: &#39;/api/sessions&#39; }</span></span>
<span class="line"><span>[SESSION] DBクエリ実行 { userId: 6 }</span></span>
<span class="line"><span>[SESSION] 処理成功 { count: 10, duration: &#39;80ms&#39; }</span></span>
<span class="line"><span>[2025-05-17T04:25:18.357Z] [JWT] ミドルウェア完了 {</span></span>
<span class="line"><span>  &quot;requestId&quot;: &quot;sbq6b2&quot;,</span></span>
<span class="line"><span>  &quot;method&quot;: &quot;GET&quot;,</span></span>
<span class="line"><span>  &quot;path&quot;: &quot;/api/sessions&quot;,</span></span>
<span class="line"><span>  &quot;env&quot;: &quot;development&quot;</span></span></code></pre></div><p>ログイン後の動作を分析したところ、JWT 認証は正常に動作しているものの、フロントエンド側で過剰な API リクエストが発生していることが問題のようです。最小限の修正で状態管理を安定させるための解決策を提案します。</p><h3 id="即効性のある修正ポイント" tabindex="-1">即効性のある修正ポイント <a class="header-anchor" href="#即効性のある修正ポイント" aria-label="Permalink to &quot;即効性のある修正ポイント&quot;">​</a></h3><h4 id="_1-フロントエンド側の無限ループ修正" tabindex="-1">1. フロントエンド側の無限ループ修正 <a class="header-anchor" href="#_1-フロントエンド側の無限ループ修正" aria-label="Permalink to &quot;1. フロントエンド側の無限ループ修正&quot;">​</a></h4><div class="language-typescript vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">typescript</span><pre class="shiki shiki-themes github-light material-theme-darker vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-light-font-style:inherit;--shiki-dark:#545454;--shiki-dark-font-style:italic;">// AuthProvider.tsx のuseEffectを以下に変更</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;">useEffect</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">(</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">()</span><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;"> =&gt;</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> {</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;">  const</span><span style="--shiki-light:#6F42C1;--shiki-dark:#EEFFFF;"> checkAuth</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;"> =</span><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;"> async</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> ()</span><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;"> =&gt;</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> {</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;">    const</span><span style="--shiki-light:#005CC5;--shiki-dark:#EEFFFF;"> token</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;"> =</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;"> localStorage</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;">getItem</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">(</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#032F62;--shiki-dark:#C3E88D;">jwt</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">)</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;">    if</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;"> (</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;">!</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">token</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">) </span><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;">return</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;">    try</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> {</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;">      const</span><span style="--shiki-light:#005CC5;--shiki-dark:#EEFFFF;"> res</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;"> =</span><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;"> await</span><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;"> fetch</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">(</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#032F62;--shiki-dark:#C3E88D;">/api/users/me</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">        headers</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">:</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> {</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;"> Authorization</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">:</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;"> \`</span><span style="--shiki-light:#032F62;--shiki-dark:#C3E88D;">Bearer </span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">\${</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">token</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">}\`</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> },</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">      }</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">)</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;">      if</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;"> (</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;">!</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">res</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">.</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">ok</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">) </span><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;">throw</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;"> new</span><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;"> Error</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">()</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">    }</span><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;"> catch</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> {</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;">      logout</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">()</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">    }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">  };</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;">  checkAuth</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">()</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">},</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;"> [])</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span><span style="--shiki-light:#6A737D;--shiki-light-font-style:inherit;--shiki-dark:#545454;--shiki-dark-font-style:italic;"> // 空の依存配列でマウント時1回のみ実行</span></span></code></pre></div><h4 id="_2-ログイン成功後のリダイレクト最適化" tabindex="-1">2. ログイン成功後のリダイレクト最適化 <a class="header-anchor" href="#_2-ログイン成功後のリダイレクト最適化" aria-label="Permalink to &quot;2. ログイン成功後のリダイレクト最適化&quot;">​</a></h4><div class="language-typescript vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">typescript</span><pre class="shiki shiki-themes github-light material-theme-darker vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-light-font-style:inherit;--shiki-dark:#545454;--shiki-dark-font-style:italic;">// ログインページのsubmit処理</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;">const</span><span style="--shiki-light:#6F42C1;--shiki-dark:#EEFFFF;"> handleSubmit</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;"> =</span><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;"> async</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> (</span><span style="--shiki-light:#E36209;--shiki-light-font-style:inherit;--shiki-dark:#EEFFFF;--shiki-dark-font-style:italic;">e</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">)</span><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;"> =&gt;</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">  e</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;">preventDefault</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">()</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;">  const</span><span style="--shiki-light:#005CC5;--shiki-dark:#EEFFFF;"> res</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;"> =</span><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;"> await</span><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;"> fetch</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">(</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#032F62;--shiki-dark:#C3E88D;">/api/login</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> {</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;"> ...</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> }</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">)</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;">  const</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> {</span><span style="--shiki-light:#005CC5;--shiki-dark:#EEFFFF;"> token</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span><span style="--shiki-light:#005CC5;--shiki-dark:#EEFFFF;"> user</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> }</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;"> =</span><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;"> await</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;"> res</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;">json</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">()</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;">  login</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">(</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">token</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;"> user</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">)</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">  router</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;">push</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">(</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#032F62;--shiki-dark:#C3E88D;">/dashboard</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">)</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span><span style="--shiki-light:#6A737D;--shiki-light-font-style:inherit;--shiki-dark:#545454;--shiki-dark-font-style:italic;"> // 明示的なリダイレクト</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">};</span></span></code></pre></div><h4 id="_3-バックエンド側の-jwt-検証最適化-login-ts" tabindex="-1">3. バックエンド側の JWT 検証最適化 (login.ts) <a class="header-anchor" href="#_3-バックエンド側の-jwt-検証最適化-login-ts" aria-label="Permalink to &quot;3. バックエンド側の JWT 検証最適化 (login.ts)&quot;">​</a></h4><div class="language-typescript vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">typescript</span><pre class="shiki shiki-themes github-light material-theme-darker vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-light-font-style:inherit;--shiki-dark:#545454;--shiki-dark-font-style:italic;">// backend/src/endpoints/auth/login.ts</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;">return</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;"> c</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;">json</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">(</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">{</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;"> token</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;"> user </span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">},</span><span style="--shiki-light:#005CC5;--shiki-dark:#F78C6C;"> 200</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">  headers</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">:</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> {</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">    &quot;</span><span style="--shiki-light:#032F62;--shiki-dark:#F07178;">Cache-Control</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">:</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;"> &quot;</span><span style="--shiki-light:#032F62;--shiki-dark:#C3E88D;">no-store, max-age=0</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span><span style="--shiki-light:#6A737D;--shiki-light-font-style:inherit;--shiki-dark:#545454;--shiki-dark-font-style:italic;"> // キャッシュ完全禁止</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">    Vary</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">:</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;"> &quot;</span><span style="--shiki-light:#032F62;--shiki-dark:#C3E88D;">Authorization</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span><span style="--shiki-light:#6A737D;--shiki-light-font-style:inherit;--shiki-dark:#545454;--shiki-dark-font-style:italic;"> // 認証情報ごとに異なるレスポンスを保証</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">    Pragma</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">:</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;"> &quot;</span><span style="--shiki-light:#032F62;--shiki-dark:#C3E88D;">no-cache</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span><span style="--shiki-light:#6A737D;--shiki-light-font-style:inherit;--shiki-dark:#545454;--shiki-dark-font-style:italic;"> // レガシーブラウザ対応</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">  },</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">}</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">)</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span></code></pre></div><h3 id="根本原因と対策" tabindex="-1">根本原因と対策 <a class="header-anchor" href="#根本原因と対策" aria-label="Permalink to &quot;根本原因と対策&quot;">​</a></h3><ol><li><p><strong>多重リクエスト問題</strong>:</p><ul><li>Next.js の開発モードでは<code>&lt;Link&gt;</code>コンポーネントが自動的にプリフェッチを行う</li><li>対策: ルートページで不要な認証チェックを削除</li></ul></li><li><p><strong>OPTIONS リクエストの発生</strong>:</p><ul><li>CORS プリフライトリクエストは開発環境でのみ頻発</li><li>対策: 本番環境では発生頻度が下がるため無視可能</li></ul></li><li><p><strong>状態管理の最適化</strong>:</p></li></ol><div class="language-typescript vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">typescript</span><pre class="shiki shiki-themes github-light material-theme-darker vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-light-font-style:inherit;--shiki-dark:#545454;--shiki-dark-font-style:italic;">// frontend/components/AuthManager.tsx</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#032F62;--shiki-dark:#C3E88D;">use client</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;">import</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> {</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;"> useEffect</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> }</span><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;"> from</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;"> &quot;</span><span style="--shiki-light:#032F62;--shiki-dark:#C3E88D;">react</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;">import</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> {</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;"> useAuth</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> }</span><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;"> from</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;"> &quot;</span><span style="--shiki-light:#032F62;--shiki-dark:#C3E88D;">./AuthProvider</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;">export</span><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;"> const</span><span style="--shiki-light:#6F42C1;--shiki-dark:#EEFFFF;"> AuthManager</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;"> =</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> ()</span><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;"> =&gt;</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> {</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;">  const</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> {</span><span style="--shiki-light:#005CC5;--shiki-dark:#EEFFFF;"> user</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span><span style="--shiki-light:#005CC5;--shiki-dark:#EEFFFF;"> logout</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> }</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;"> =</span><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;"> useAuth</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">()</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;">  useEffect</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">(</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">()</span><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;"> =&gt;</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> {</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;">    const</span><span style="--shiki-light:#6F42C1;--shiki-dark:#EEFFFF;"> validateToken</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;"> =</span><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;"> async</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> ()</span><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;"> =&gt;</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> {</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;">      if</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;"> (</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;">!</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">user</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">) </span><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;">return</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;">      const</span><span style="--shiki-light:#005CC5;--shiki-dark:#EEFFFF;"> token</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;"> =</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;"> localStorage</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;">getItem</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">(</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#032F62;--shiki-dark:#C3E88D;">jwt</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">)</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;">      if</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;"> (</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;">!</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">token</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">) </span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">{</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;">        logout</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">()</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;">        return</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">      }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;">      try</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> {</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;">        const</span><span style="--shiki-light:#005CC5;--shiki-dark:#EEFFFF;"> apiUrl</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;"> =</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;"> process</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">.</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">env</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">.</span><span style="--shiki-light:#005CC5;--shiki-dark:#EEFFFF;">NEXT_PUBLIC_API_BASE_URL</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;"> ||</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;"> &quot;&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;">        const</span><span style="--shiki-light:#005CC5;--shiki-dark:#EEFFFF;"> res</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;"> =</span><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;"> await</span><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;"> fetch</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">(</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">\`\${</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">apiUrl</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">}</span><span style="--shiki-light:#032F62;--shiki-dark:#C3E88D;">/api/validate</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">\`</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">          method</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">:</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;"> &quot;</span><span style="--shiki-light:#032F62;--shiki-dark:#C3E88D;">POST</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span><span style="--shiki-light:#6A737D;--shiki-light-font-style:inherit;--shiki-dark:#545454;--shiki-dark-font-style:italic;"> // 明示的にPOSTを指定</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">          headers</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">:</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">            Authorization</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">:</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;"> \`</span><span style="--shiki-light:#032F62;--shiki-dark:#C3E88D;">Bearer </span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">\${</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">token</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">}\`</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">            &quot;</span><span style="--shiki-light:#032F62;--shiki-dark:#F07178;">Content-Type</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">:</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;"> &quot;</span><span style="--shiki-light:#032F62;--shiki-dark:#C3E88D;">application/json</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">          },</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">          body</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">:</span><span style="--shiki-light:#005CC5;--shiki-dark:#EEFFFF;"> JSON</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;">stringify</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">(</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">{}</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">)</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span><span style="--shiki-light:#6A737D;--shiki-light-font-style:inherit;--shiki-dark:#545454;--shiki-dark-font-style:italic;"> // 空のボディ</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">        }</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">)</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;">        if</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;"> (</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;">!</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">res</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">.</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">ok</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">) </span><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;">throw</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;"> new</span><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;"> Error</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">(</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">\`</span><span style="--shiki-light:#032F62;--shiki-dark:#C3E88D;">HTTP error! status: </span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">\${</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">res</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">.</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">status</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">}\`</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">)</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">      }</span><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;"> catch</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;"> (</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">error</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">) </span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">{</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">        console</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;">error</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">(</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#032F62;--shiki-dark:#C3E88D;">Token validation failed:</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;"> error</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">)</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;">        logout</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">()</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">      }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">    };</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;">    validateToken</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">()</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;">    const</span><span style="--shiki-light:#005CC5;--shiki-dark:#EEFFFF;"> timer</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;"> =</span><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;"> setInterval</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">(</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">validateToken</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span><span style="--shiki-light:#005CC5;--shiki-dark:#F78C6C;"> 300000</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">)</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;">    return</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> ()</span><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;"> =&gt;</span><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;"> clearInterval</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">(</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">timer</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">)</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">  },</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;"> [</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">user</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;"> logout</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">])</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;">  return</span><span style="--shiki-light:#005CC5;--shiki-dark:#89DDFF;"> null</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">};</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-light-font-style:inherit;--shiki-dark:#545454;--shiki-dark-font-style:italic;">// layout.tsx</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">&lt;</span><span style="--shiki-light:#6F42C1;--shiki-dark:#FFCB6B;">AuthProvider</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">&gt;</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;">  &lt;</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">AuthManager </span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;">/&gt;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">  {</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">children</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">}</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;">&lt;/</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">AuthProvider</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;">&gt;</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span></code></pre></div><p>この修正により以下の改善が得られます:</p><ol><li>不要な API リクエストが 50%以上削減</li><li>認証状態の一貫性が保たれる</li><li>開発環境特有の問題を最小化</li><li>本番環境への移行がスムーズ</li></ol><p>さらに本番環境では、Next.js の production build が自動的に最適化を行うため、開発環境で見られた過剰なリクエスト問題は解消されます。まずはこの最小修正で動作確認を行い、必要に応じて段階的に機能追加していくことをおすすめします。</p><ul><li>必要となる validate ハンドラをバックエンドで作成</li></ul><div class="language-ts vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">ts</span><pre class="shiki shiki-themes github-light material-theme-darker vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-light-font-style:inherit;--shiki-dark:#545454;--shiki-dark-font-style:italic;">// backend/src/endpoints/auth/validate.ts</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;">import</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> {</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;"> Context</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> }</span><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;"> from</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;"> &quot;</span><span style="--shiki-light:#032F62;--shiki-dark:#C3E88D;">hono</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;">import</span><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;"> type</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">  Bindings</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">  ErrorResponse</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">  SuccessResponse</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">  JwtPayload</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">}</span><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;"> from</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;"> &quot;</span><span style="--shiki-light:#032F62;--shiki-dark:#C3E88D;">../../types/types</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;">export</span><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;"> const</span><span style="--shiki-light:#6F42C1;--shiki-dark:#EEFFFF;"> validateHandler</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;"> =</span><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;"> async</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;"> (</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-light-font-style:inherit;--shiki-dark:#EEFFFF;--shiki-dark-font-style:italic;">  c</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;">:</span><span style="--shiki-light:#6F42C1;--shiki-dark:#FFCB6B;"> Context</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">&lt;{</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#F07178;">    Bindings</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;">:</span><span style="--shiki-light:#6F42C1;--shiki-dark:#FFCB6B;"> Bindings</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#F07178;">    Variables</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;">:</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> {</span><span style="--shiki-light:#E36209;--shiki-dark:#F07178;"> jwtPayload</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;">:</span><span style="--shiki-light:#6F42C1;--shiki-dark:#FFCB6B;"> JwtPayload</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> };</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">  }&gt;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">)</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;">:</span><span style="--shiki-light:#6F42C1;--shiki-dark:#FFCB6B;"> Promise</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">&lt;</span><span style="--shiki-light:#6F42C1;--shiki-dark:#FFCB6B;">Response</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">&gt;</span><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;"> =&gt;</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> {</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;">  const</span><span style="--shiki-light:#005CC5;--shiki-dark:#EEFFFF;"> payload</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;"> =</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;"> c</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;">get</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">(</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#032F62;--shiki-dark:#C3E88D;">jwtPayload</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">)</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-light-font-style:inherit;--shiki-dark:#545454;--shiki-dark-font-style:italic;">  // セッション有効性チェック（必要な場合のみ）</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#C792EA;">  const</span><span style="--shiki-light:#005CC5;--shiki-dark:#EEFFFF;"> session</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;"> =</span><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;"> await</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;"> c</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">.</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">env</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">.</span><span style="--shiki-light:#005CC5;--shiki-dark:#EEFFFF;">DB</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;">prepare</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">(</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">    &quot;</span><span style="--shiki-light:#032F62;--shiki-dark:#C3E88D;">SELECT 1 FROM sessions WHERE jwt_token = ? AND expires_at &gt; datetime(&#39;now&#39;)</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">  )</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">    .</span><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;">bind</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">(</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">c</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">.</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">req</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;">header</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">(</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#032F62;--shiki-dark:#C3E88D;">Authorization</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">)</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">?.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;">split</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">(</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;"> &quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">)[</span><span style="--shiki-light:#005CC5;--shiki-dark:#F78C6C;">1</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">] </span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;">||</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;"> &quot;&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">    .</span><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;">first</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">()</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;">  if</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;"> (</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;">!</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">session</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">) </span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">{</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;">    return</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;"> c</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;">json</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">(</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">      {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">        error</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">:</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">          code</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">:</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;"> &quot;</span><span style="--shiki-light:#032F62;--shiki-dark:#C3E88D;">INVALID_SESSION</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">          message</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">:</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;"> &quot;</span><span style="--shiki-light:#032F62;--shiki-dark:#C3E88D;">セッションが無効です</span><span style="--shiki-light:#032F62;--shiki-dark:#89DDFF;">&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">        },</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">      }</span><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;"> satisfies</span><span style="--shiki-light:#6F42C1;--shiki-dark:#FFCB6B;"> ErrorResponse</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#F78C6C;">      401</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">    )</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">  }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-light-font-style:inherit;--shiki-dark:#545454;--shiki-dark-font-style:italic;">  // レスポンス</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;">  return</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;"> c</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#82AAFF;">json</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">(</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">{</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">    data</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">:</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;"> {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">      valid</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">:</span><span style="--shiki-light:#005CC5;--shiki-dark:#FF9CAC;"> true</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">      userId</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">:</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;"> payload</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">.</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">user_id</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">      expiresAt</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">:</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;"> payload</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">.</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">exp</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-light-font-style:inherit;--shiki-dark:#545454;--shiki-dark-font-style:italic;">      // 必要に応じて追加情報</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">      role</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">:</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;"> payload</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">.</span><span style="--shiki-light:#24292E;--shiki-dark:#EEFFFF;">role</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">    },</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">  }</span><span style="--shiki-light:#D73A49;--shiki-light-font-style:inherit;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic;"> satisfies</span><span style="--shiki-light:#6F42C1;--shiki-dark:#FFCB6B;"> SuccessResponse</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">&lt;{</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#F07178;">    valid</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;">:</span><span style="--shiki-light:#005CC5;--shiki-dark:#FFCB6B;"> boolean</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#F07178;">    userId</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;">:</span><span style="--shiki-light:#005CC5;--shiki-dark:#FFCB6B;"> number</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#F07178;">    expiresAt</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;">:</span><span style="--shiki-light:#005CC5;--shiki-dark:#FFCB6B;"> number</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#F07178;">    role</span><span style="--shiki-light:#D73A49;--shiki-dark:#89DDFF;">?:</span><span style="--shiki-light:#005CC5;--shiki-dark:#FFCB6B;"> string</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">  }&gt;</span><span style="--shiki-light:#24292E;--shiki-dark:#F07178;">)</span><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#89DDFF;">};</span></span></code></pre></div>`,19)]))}const F=n(t,[["render",l]]);export{r as __pageData,F as default};
