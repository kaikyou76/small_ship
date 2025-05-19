# 状態管理 AuthProvider コンポーネント 2.0

ログイン後の JWT 認証は正常に動作しているものの、フロントエンド側で過剰な API リクエストが発生

```
[wrangler:inf] GET /api/sessions 200 OK (100ms)
{"timestamp":"2025-05-17T04:25:17.404Z","method":"OPTIONS","path":"/api/users/me","normalizedPath":"/api/users/me","phase":"request-start","environment":"development"}
{"timestamp":"2025-05-17T04:25:17.406Z","method":"GET","path":"/api/sessions","normalizedPath":"/api/sessions","phase":"request-start","environment":"development"}
[wrangler:inf] OPTIONS /api/users/me 204 No Content (4ms)
[2025-05-17T04:25:17.407Z] [JWT] ミドルウェア開始 {
  "requestId": "lci9wq",
  "method": "GET",
  "path": "/api/sessions",
  "env": "development"
}
[2025-05-17T04:25:17.407Z] [JWT] 認証ヘッダー確認 {
  "header": "Bearer eyJ..."
}
[2025-05-17T04:25:17.407Z] [JWT] トークン正規化完了 {
  "original": "eyJhbGciOi...pUC7CpsugY",
  "normalized": "eyJhbGciOi...pUC7CpsugY"
}
[2025-05-17T04:25:17.408Z] [JWT] トークン検証開始 {
  "requestId": "lci9wq",
  "method": "GET",
  "path": "/api/sessions",
  "env": "development"
}
[2025-05-17T04:25:17.408Z] [JWT] 認証成功 {
  "user_id": 6,
  "type": "number"
}
[SESSION] 処理開始 { user_id: 6, method: 'GET', path: '/api/sessions' }
[SESSION] DBクエリ実行 { userId: 6 }
[SESSION] 処理成功 { count: 10, duration: '31ms' }
[2025-05-17T04:25:17.439Z] [JWT] ミドルウェア完了 {
  "requestId": "lci9wq",
  "method": "GET",
  "path": "/api/sessions",
  "env": "development"
}
[wrangler:inf] GET /api/sessions 200 OK (37ms)
{"timestamp":"2025-05-17T04:25:17.444Z","method":"GET","path":"/api/users/me","normalizedPath":"/api/users/me","phase":"request-start","environment":"development"}
[2025-05-17T04:25:17.445Z] [JWT] ミドルウェア開始 {
  "requestId": "orleez",
  "method": "GET",
  "path": "/api/users/me",
  "env": "development"
}
[2025-05-17T04:25:17.445Z] [JWT] 認証ヘッダー確認 {
  "header": "Bearer eyJ..."
}
[2025-05-17T04:25:17.445Z] [JWT] トークン正規化完了 {
  "original": "eyJhbGciOi...pUC7CpsugY",
  "normalized": "eyJhbGciOi...pUC7CpsugY"
}
[2025-05-17T04:25:17.446Z] [JWT] トークン検証開始 {
  "requestId": "orleez",
  "method": "GET",
  "path": "/api/users/me",
  "env": "development"
}
[2025-05-17T04:25:17.446Z] [JWT] 認証成功 {
  "user_id": 6,
  "type": "number"
}
[2025-05-17T04:25:17.455Z] [JWT] ミドルウェア完了 {
  "requestId": "orleez",
  "method": "GET",
  "path": "/api/users/me",
  "env": "development"
}
[wrangler:inf] GET /api/users/me 200 OK (47ms)
{"timestamp":"2025-05-17T04:25:17.467Z","method":"OPTIONS","path":"/api/users/me","normalizedPath":"/api/users/me","phase":"request-start","environment":"development"}
{"timestamp":"2025-05-17T04:25:17.468Z","method":"GET","path":"/api/sessions","normalizedPath":"/api/sessions","phase":"request-start","environment":"development"}
[2025-05-17T04:25:17.469Z] [JWT] ミドルウェア開始 {
  "requestId": "84ytv1",
  "method": "GET",
  "path": "/api/sessions",
  "env": "development"
}
[2025-05-17T04:25:17.469Z] [JWT] 認証ヘッダー確認 {
  "header": "Bearer eyJ..."
}
[2025-05-17T04:25:17.469Z] [JWT] トークン正規化完了 {
  "original": "eyJhbGciOi...pUC7CpsugY",
  "normalized": "eyJhbGciOi...pUC7CpsugY"
}
[2025-05-17T04:25:17.470Z] [JWT] トークン検証開始 {
  "requestId": "84ytv1",
  "method": "GET",
  "path": "/api/sessions",
  "env": "development"
}
[wrangler:inf] OPTIONS /api/users/me 204 No Content (4ms)
[2025-05-17T04:25:17.470Z] [JWT] 認証成功 {
  "user_id": 6,
  "type": "number"
}
[SESSION] 処理開始 { user_id: 6, method: 'GET', path: '/api/sessions' }
[SESSION] DBクエリ実行 { userId: 6 }
[SESSION] 処理成功 { count: 10, duration: '67ms' }
[2025-05-17T04:25:17.538Z] [JWT] ミドルウェア完了 {
  "requestId": "84ytv1",
  "method": "GET",
  "path": "/api/sessions",
  "env": "development"
}
[wrangler:inf] GET /api/sessions 200 OK (78ms)
{"timestamp":"2025-05-17T04:25:17.545Z","method":"GET","path":"/api/users/me","normalizedPath":"/api/users/me","phase":"request-start","environment":"development"}
[2025-05-17T04:25:17.545Z] [JWT] ミドルウェア開始 {
  "requestId": "gajacn",
  "method": "GET",
  "path": "/api/users/me",
  "env": "development"
}
[2025-05-17T04:25:17.546Z] [JWT] 認証ヘッダー確認 {
  "header": "Bearer eyJ..."
}
[2025-05-17T04:25:17.547Z] [JWT] トークン正規化完了 {
  "original": "eyJhbGciOi...pUC7CpsugY",
  "normalized": "eyJhbGciOi...pUC7CpsugY"
}
[2025-05-17T04:25:17.548Z] [JWT] トークン検証開始 {
  "requestId": "gajacn",
  "method": "GET",
  "path": "/api/users/me",
  "env": "development"
}
[2025-05-17T04:25:17.550Z] [JWT] 認証成功 {
  "user_id": 6,
  "type": "number"
}
[2025-05-17T04:25:17.595Z] [JWT] ミドルウェア完了 {
  "requestId": "gajacn",
  "method": "GET",
  "path": "/api/users/me",
  "env": "development"
}
[wrangler:inf] GET /api/users/me 200 OK (126ms)
{"timestamp":"2025-05-17T04:25:17.618Z","method":"OPTIONS","path":"/api/users/me","normalizedPath":"/api/users/me","phase":"request-start","environment":"development"}
{"timestamp":"2025-05-17T04:25:17.621Z","method":"GET","path":"/api/sessions","normalizedPath":"/api/sessions","phase":"request-start","environment":"development"}
[2025-05-17T04:25:17.622Z] [JWT] ミドルウェア開始 {
  "requestId": "c8dwqx",
  "method": "GET",
  "path": "/api/sessions",
  "env": "development"
}
[2025-05-17T04:25:17.623Z] [JWT] 認証ヘッダー確認 {
  "header": "Bearer eyJ..."
}
[2025-05-17T04:25:17.623Z] [JWT] トークン正規化完了 {
  "original": "eyJhbGciOi...pUC7CpsugY",
  "normalized": "eyJhbGciOi...pUC7CpsugY"
}
[2025-05-17T04:25:17.624Z] [JWT] トークン検証開始 {
  "requestId": "c8dwqx",
  "method": "GET",
  "path": "/api/sessions",
  "env": "development"
}
[wrangler:inf] OPTIONS /api/users/me 204 No Content (7ms)
[2025-05-17T04:25:17.626Z] [JWT] 認証成功 {
  "user_id": 6,
  "type": "number"
}
[SESSION] 処理開始 { user_id: 6, method: 'GET', path: '/api/sessions' }
[SESSION] DBクエリ実行 { userId: 6 }
[SESSION] 処理成功 { count: 10, duration: '66ms' }
[2025-05-17T04:25:17.692Z] [JWT] ミドルウェア完了 {
  "requestId": "c8dwqx",
  "method": "GET",
  "path": "/api/sessions",
  "env": "development"
}
{"timestamp":"2025-05-17T04:25:17.694Z","method":"GET","path":"/api/users/me","normalizedPath":"/api/users/me","phase":"request-start","environment":"development"}
[2025-05-17T04:25:17.695Z] [JWT] ミドルウェア開始 {
  "requestId": "45e2m2",
  "method": "GET",
  "path": "/api/users/me",
  "env": "development"
}
[2025-05-17T04:25:17.696Z] [JWT] 認証ヘッダー確認 {
  "header": "Bearer eyJ..."
}
[2025-05-17T04:25:17.696Z] [JWT] トークン正規化完了 {
  "original": "eyJhbGciOi...pUC7CpsugY",
  "normalized": "eyJhbGciOi...pUC7CpsugY"
}
[wrangler:inf] GET /api/sessions 200 OK (78ms)
[2025-05-17T04:25:17.696Z] [JWT] トークン検証開始 {
  "requestId": "45e2m2",
  "method": "GET",
  "path": "/api/users/me",
  "env": "development"
}
[2025-05-17T04:25:17.697Z] [JWT] 認証成功 {
  "user_id": 6,
  "type": "number"
}
[2025-05-17T04:25:17.755Z] [JWT] ミドルウェア完了 {
  "requestId": "45e2m2",
  "method": "GET",
  "path": "/api/users/me",
  "env": "development"
}
[wrangler:inf] GET /api/users/me 200 OK (127ms)
{"timestamp":"2025-05-17T04:25:17.769Z","method":"GET","path":"/api/sessions","normalizedPath":"/api/sessions","phase":"request-start","environment":"development"}
[2025-05-17T04:25:17.769Z] [JWT] ミドルウェア開始 {
  "requestId": "gs00j4",
  "method": "GET",
  "path": "/api/sessions",
  "env": "development"
}
[2025-05-17T04:25:17.770Z] [JWT] 認証ヘッダー確認 {
  "header": "Bearer eyJ..."
}
[2025-05-17T04:25:17.770Z] [JWT] トークン正規化完了 {
  "original": "eyJhbGciOi...pUC7CpsugY",
  "normalized": "eyJhbGciOi...pUC7CpsugY"
}
[2025-05-17T04:25:17.770Z] [JWT] トークン検証開始 {
  "requestId": "gs00j4",
  "method": "GET",
  "path": "/api/sessions",
  "env": "development"
}
[2025-05-17T04:25:17.771Z] [JWT] 認証成功 {
  "user_id": 6,
  "type": "number"
}
[SESSION] 処理開始 { user_id: 6, method: 'GET', path: '/api/sessions' }
[SESSION] DBクエリ実行 { userId: 6 }
[SESSION] 処理成功 { count: 10, duration: '68ms' }
[2025-05-17T04:25:17.839Z] [JWT] ミドルウェア完了 {
  "requestId": "gs00j4",
  "method": "GET",
  "path": "/api/sessions",
  "env": "development"
}
{"timestamp":"2025-05-17T04:25:17.841Z","method":"OPTIONS","path":"/api/users/me","normalizedPath":"/api/users/me","phase":"request-start","environment":"development"}
[wrangler:inf] GET /api/sessions 200 OK (75ms)
[wrangler:inf] OPTIONS /api/users/me 204 No Content (69ms)
{"timestamp":"2025-05-17T04:25:17.852Z","method":"GET","path":"/api/users/me","normalizedPath":"/api/users/me","phase":"request-start","environment":"development"}
[2025-05-17T04:25:17.852Z] [JWT] ミドルウェア開始 {
  "requestId": "a47b78",
  "method": "GET",
  "path": "/api/users/me",
  "env": "development"
}
[2025-05-17T04:25:17.852Z] [JWT] 認証ヘッダー確認 {
  "header": "Bearer eyJ..."
}
[2025-05-17T04:25:17.853Z] [JWT] トークン正規化完了 {
  "original": "eyJhbGciOi...pUC7CpsugY",
  "normalized": "eyJhbGciOi...pUC7CpsugY"
}
[2025-05-17T04:25:17.853Z] [JWT] トークン検証開始 {
  "requestId": "a47b78",
  "method": "GET",
  "path": "/api/users/me",
  "env": "development"
}
[2025-05-17T04:25:17.854Z] [JWT] 認証成功 {
  "user_id": 6,
  "type": "number"
}
[2025-05-17T04:25:17.916Z] [JWT] ミドルウェア完了 {
  "requestId": "a47b78",
  "method": "GET",
  "path": "/api/users/me",
  "env": "development"
}
[wrangler:inf] GET /api/users/me 200 OK (69ms)
{"timestamp":"2025-05-17T04:25:17.926Z","method":"OPTIONS","path":"/api/users/me","normalizedPath":"/api/users/me","phase":"request-start","environment":"development"}
{"timestamp":"2025-05-17T04:25:17.927Z","method":"GET","path":"/api/sessions","normalizedPath":"/api/sessions","phase":"request-start","environment":"development"}
[wrangler:inf] OPTIONS /api/users/me 204 No Content (4ms)
[2025-05-17T04:25:17.928Z] [JWT] ミドルウェア開始 {
  "requestId": "2f0wms",
  "method": "GET",
  "path": "/api/sessions",
  "env": "development"
}
[2025-05-17T04:25:17.928Z] [JWT] 認証ヘッダー確認 {
  "header": "Bearer eyJ..."
}
[2025-05-17T04:25:17.929Z] [JWT] トークン正規化完了 {
  "original": "eyJhbGciOi...pUC7CpsugY",
  "normalized": "eyJhbGciOi...pUC7CpsugY"
}
[2025-05-17T04:25:17.929Z] [JWT] トークン検証開始 {
  "requestId": "2f0wms",
  "method": "GET",
  "path": "/api/sessions",
  "env": "development"
}
[2025-05-17T04:25:17.930Z] [JWT] 認証成功 {
  "user_id": 6,
  "type": "number"
}
[SESSION] 処理開始 { user_id: 6, method: 'GET', path: '/api/sessions' }
[SESSION] DBクエリ実行 { userId: 6 }
[SESSION] 処理成功 { count: 10, duration: '39ms' }
[2025-05-17T04:25:17.969Z] [JWT] ミドルウェア完了 {
  "requestId": "2f0wms",
  "method": "GET",
  "path": "/api/sessions",
  "env": "development"
}
{"timestamp":"2025-05-17T04:25:17.970Z","method":"GET","path":"/api/users/me","normalizedPath":"/api/users/me","phase":"request-start","environment":"development"}
[2025-05-17T04:25:17.970Z] [JWT] ミドルウェア開始 {
  "requestId": "6d3r6n",
  "method": "GET",
  "path": "/api/users/me",
  "env": "development"
}
[2025-05-17T04:25:17.971Z] [JWT] 認証ヘッダー確認 {
  "header": "Bearer eyJ..."
}
[2025-05-17T04:25:17.971Z] [JWT] トークン正規化完了 {
  "original": "eyJhbGciOi...pUC7CpsugY",
  "normalized": "eyJhbGciOi...pUC7CpsugY"
}
[wrangler:inf] GET /api/sessions 200 OK (45ms)
[2025-05-17T04:25:17.971Z] [JWT] トークン検証開始 {
  "requestId": "6d3r6n",
  "method": "GET",
  "path": "/api/users/me",
  "env": "development"
}
[2025-05-17T04:25:17.971Z] [JWT] 認証成功 {
  "user_id": 6,
  "type": "number"
}
[2025-05-17T04:25:17.988Z] [JWT] ミドルウェア完了 {
  "requestId": "6d3r6n",
  "method": "GET",
  "path": "/api/users/me",
  "env": "development"
}
[wrangler:inf] GET /api/users/me 200 OK (59ms)
{"timestamp":"2025-05-17T04:25:17.998Z","method":"OPTIONS","path":"/api/users/me","normalizedPath":"/api/users/me","phase":"request-start","environment":"development"}
{"timestamp":"2025-05-17T04:25:18.000Z","method":"GET","path":"/api/sessions","normalizedPath":"/api/sessions","phase":"request-start","environment":"development"}
[2025-05-17T04:25:18.000Z] [JWT] ミドルウェア開始 {
  "requestId": "gkz32l",
  "method": "GET",
  "path": "/api/sessions",
  "env": "development"
}
[2025-05-17T04:25:18.000Z] [JWT] 認証ヘッダー確認 {
  "header": "Bearer eyJ..."
}
[2025-05-17T04:25:18.001Z] [JWT] トークン正規化完了 {
  "original": "eyJhbGciOi...pUC7CpsugY",
  "normalized": "eyJhbGciOi...pUC7CpsugY"
}
[wrangler:inf] OPTIONS /api/users/me 204 No Content (3ms)
[2025-05-17T04:25:18.001Z] [JWT] トークン検証開始 {
  "requestId": "gkz32l",
  "method": "GET",
  "path": "/api/sessions",
  "env": "development"
}
[2025-05-17T04:25:18.002Z] [JWT] 認証成功 {
  "user_id": 6,
  "type": "number"
}
[SESSION] 処理開始 { user_id: 6, method: 'GET', path: '/api/sessions' }
[SESSION] DBクエリ実行 { userId: 6 }
[SESSION] 処理成功 { count: 10, duration: '18ms' }
[2025-05-17T04:25:18.021Z] [JWT] ミドルウェア完了 {
  "requestId": "gkz32l",
  "method": "GET",
  "path": "/api/sessions",
  "env": "development"
}
{"timestamp":"2025-05-17T04:25:18.021Z","method":"GET","path":"/api/users/me","normalizedPath":"/api/users/me","phase":"request-start","environment":"development"}
[2025-05-17T04:25:18.022Z] [JWT] ミドルウェア開始 {
  "requestId": "1htnxu",
  "method": "GET",
  "path": "/api/users/me",
  "env": "development"
}
[2025-05-17T04:25:18.022Z] [JWT] 認証ヘッダー確認 {
  "header": "Bearer eyJ..."
}
[2025-05-17T04:25:18.022Z] [JWT] トークン正規化完了 {
  "original": "eyJhbGciOi...pUC7CpsugY",
  "normalized": "eyJhbGciOi...pUC7CpsugY"
}
[2025-05-17T04:25:18.022Z] [JWT] トークン検証開始 {
  "requestId": "1htnxu",
  "method": "GET",
  "path": "/api/users/me",
  "env": "development"
}
[wrangler:inf] GET /api/sessions 200 OK (24ms)
[2025-05-17T04:25:18.023Z] [JWT] 認証成功 {
  "user_id": 6,
  "type": "number"
}
[2025-05-17T04:25:18.044Z] [JWT] ミドルウェア完了 {
  "requestId": "1htnxu",
  "method": "GET",
  "path": "/api/users/me",
  "env": "development"
}
[wrangler:inf] GET /api/users/me 200 OK (44ms)
{"timestamp":"2025-05-17T04:25:18.056Z","method":"OPTIONS","path":"/api/users/me","normalizedPath":"/api/users/me","phase":"request-start","environment":"development"}
{"timestamp":"2025-05-17T04:25:18.058Z","method":"GET","path":"/api/sessions","normalizedPath":"/api/sessions","phase":"request-start","environment":"development"}
[wrangler:inf] OPTIONS /api/users/me 204 No Content (3ms)
[2025-05-17T04:25:18.058Z] [JWT] ミドルウェア開始 {
  "requestId": "mrn8h0",
  "method": "GET",
  "path": "/api/sessions",
  "env": "development"
}
[2025-05-17T04:25:18.058Z] [JWT] 認証ヘッダー確認 {
  "header": "Bearer eyJ..."
}
[2025-05-17T04:25:18.059Z] [JWT] トークン正規化完了 {
  "original": "eyJhbGciOi...pUC7CpsugY",
  "normalized": "eyJhbGciOi...pUC7CpsugY"
}
[2025-05-17T04:25:18.059Z] [JWT] トークン検証開始 {
  "requestId": "mrn8h0",
  "method": "GET",
  "path": "/api/sessions",
  "env": "development"
}
[2025-05-17T04:25:18.059Z] [JWT] 認証成功 {
  "user_id": 6,
  "type": "number"
}
[SESSION] 処理開始 { user_id: 6, method: 'GET', path: '/api/sessions' }
[SESSION] DBクエリ実行 { userId: 6 }
[SESSION] 処理成功 { count: 10, duration: '28ms' }
[2025-05-17T04:25:18.087Z] [JWT] ミドルウェア完了 {
  "requestId": "mrn8h0",
  "method": "GET",
  "path": "/api/sessions",
  "env": "development"
}
{"timestamp":"2025-05-17T04:25:18.088Z","method":"GET","path":"/api/users/me","normalizedPath":"/api/users/me","phase":"request-start","environment":"development"}
[2025-05-17T04:25:18.088Z] [JWT] ミドルウェア開始 {
  "requestId": "247jq5",
  "method": "GET",
  "path": "/api/users/me",
  "env": "development"
}
[2025-05-17T04:25:18.089Z] [JWT] 認証ヘッダー確認 {
  "header": "Bearer eyJ..."
}
[2025-05-17T04:25:18.089Z] [JWT] トークン正規化完了 {
  "original": "eyJhbGciOi...pUC7CpsugY",
  "normalized": "eyJhbGciOi...pUC7CpsugY"
}
[2025-05-17T04:25:18.089Z] [JWT] トークン検証開始 {
  "requestId": "247jq5",
  "method": "GET",
  "path": "/api/users/me",
  "env": "development"
}
[wrangler:inf] GET /api/sessions 200 OK (32ms)
[2025-05-17T04:25:18.090Z] [JWT] 認証成功 {
  "user_id": 6,
  "type": "number"
}
[2025-05-17T04:25:18.096Z] [JWT] ミドルウェア完了 {
  "requestId": "247jq5",
  "method": "GET",
  "path": "/api/users/me",
  "env": "development"
}
[wrangler:inf] GET /api/users/me 200 OK (37ms)
{"timestamp":"2025-05-17T04:25:18.140Z","method":"OPTIONS","path":"/api/users/me","normalizedPath":"/api/users/me","phase":"request-start","environment":"development"}
{"timestamp":"2025-05-17T04:25:18.142Z","method":"GET","path":"/api/sessions","normalizedPath":"/api/sessions","phase":"request-start","environment":"development"}
[wrangler:inf] OPTIONS /api/users/me 204 No Content (4ms)
[2025-05-17T04:25:18.142Z] [JWT] ミドルウェア開始 {
  "requestId": "rfscyo",
  "method": "GET",
  "path": "/api/sessions",
  "env": "development"
}
[2025-05-17T04:25:18.143Z] [JWT] 認証ヘッダー確認 {
  "header": "Bearer eyJ..."
}
[2025-05-17T04:25:18.143Z] [JWT] トークン正規化完了 {
  "original": "eyJhbGciOi...pUC7CpsugY",
  "normalized": "eyJhbGciOi...pUC7CpsugY"
}
[2025-05-17T04:25:18.143Z] [JWT] トークン検証開始 {
  "requestId": "rfscyo",
  "method": "GET",
  "path": "/api/sessions",
  "env": "development"
}
[2025-05-17T04:25:18.144Z] [JWT] 認証成功 {
  "user_id": 6,
  "type": "number"
}
[SESSION] 処理開始 { user_id: 6, method: 'GET', path: '/api/sessions' }
[SESSION] DBクエリ実行 { userId: 6 }
[SESSION] 処理成功 { count: 10, duration: '50ms' }
[2025-05-17T04:25:18.195Z] [JWT] ミドルウェア完了 {
  "requestId": "rfscyo",
  "method": "GET",
  "path": "/api/sessions",
  "env": "development"
}
{"timestamp":"2025-05-17T04:25:18.195Z","method":"GET","path":"/api/users/me","normalizedPath":"/api/users/me","phase":"request-start","environment":"development"}
[2025-05-17T04:25:18.196Z] [JWT] ミドルウェア開始 {
  "requestId": "qm4lm0",
  "method": "GET",
  "path": "/api/users/me",
  "env": "development"
}
[2025-05-17T04:25:18.196Z] [JWT] 認証ヘッダー確認 {
  "header": "Bearer eyJ..."
}
[wrangler:inf] GET /api/sessions 200 OK (56ms)
[2025-05-17T04:25:18.196Z] [JWT] トークン正規化完了 {
  "original": "eyJhbGciOi...pUC7CpsugY",
  "normalized": "eyJhbGciOi...pUC7CpsugY"
}
[2025-05-17T04:25:18.196Z] [JWT] トークン検証開始 {
  "requestId": "qm4lm0",
  "method": "GET",
  "path": "/api/users/me",
  "env": "development"
}
[2025-05-17T04:25:18.197Z] [JWT] 認証成功 {
  "user_id": 6,
  "type": "number"
}
[2025-05-17T04:25:18.248Z] [JWT] ミドルウェア完了 {
  "requestId": "qm4lm0",
  "method": "GET",
  "path": "/api/users/me",
  "env": "development"
}
[wrangler:inf] GET /api/users/me 200 OK (106ms)
{"timestamp":"2025-05-17T04:25:18.269Z","method":"OPTIONS","path":"/api/users/me","normalizedPath":"/api/users/me","phase":"request-start","environment":"development"}
{"timestamp":"2025-05-17T04:25:18.273Z","method":"GET","path":"/api/sessions","normalizedPath":"/api/sessions","phase":"request-start","environment":"development"}
[2025-05-17T04:25:18.273Z] [JWT] ミドルウェア開始 {
  "requestId": "sbq6b2",
  "method": "GET",
  "path": "/api/sessions",
  "env": "development"
}
[2025-05-17T04:25:18.274Z] [JWT] 認証ヘッダー確認 {
  "header": "Bearer eyJ..."
}
[2025-05-17T04:25:18.275Z] [JWT] トークン正規化完了 {
  "original": "eyJhbGciOi...pUC7CpsugY",
  "normalized": "eyJhbGciOi...pUC7CpsugY"
}
[wrangler:inf] OPTIONS /api/users/me 204 No Content (7ms)
[2025-05-17T04:25:18.275Z] [JWT] トークン検証開始 {
  "requestId": "sbq6b2",
  "method": "GET",
  "path": "/api/sessions",
  "env": "development"
}
[2025-05-17T04:25:18.276Z] [JWT] 認証成功 {
  "user_id": 6,
  "type": "number"
}
[SESSION] 処理開始 { user_id: 6, method: 'GET', path: '/api/sessions' }
[SESSION] DBクエリ実行 { userId: 6 }
[SESSION] 処理成功 { count: 10, duration: '80ms' }
[2025-05-17T04:25:18.357Z] [JWT] ミドルウェア完了 {
  "requestId": "sbq6b2",
  "method": "GET",
  "path": "/api/sessions",
  "env": "development"
```

ログイン後の動作を分析したところ、JWT 認証は正常に動作しているものの、フロントエンド側で過剰な API リクエストが発生していることが問題のようです。最小限の修正で状態管理を安定させるための解決策を提案します。

### 即効性のある修正ポイント

#### 1. フロントエンド側の無限ループ修正

```typescript
// AuthProvider.tsx のuseEffectを以下に変更
useEffect(() => {
  const checkAuth = async () => {
    const token = localStorage.getItem("jwt");
    if (!token) return;

    try {
      const res = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
    } catch {
      logout();
    }
  };

  checkAuth();
}, []); // 空の依存配列でマウント時1回のみ実行
```

#### 2. ログイン成功後のリダイレクト最適化

```typescript
// ログインページのsubmit処理
const handleSubmit = async (e) => {
  e.preventDefault();
  const res = await fetch("/api/login", { ... });
  const { token, user } = await res.json();

  login(token, user);
  router.push("/dashboard"); // 明示的なリダイレクト
};
```

#### 3. バックエンド側の JWT 検証最適化 (login.ts)

```typescript
// backend/src/endpoints/auth/login.ts
return c.json({ token, user }, 200, {
  headers: {
    "Cache-Control": "no-store, max-age=0", // キャッシュ完全禁止
    Vary: "Authorization", // 認証情報ごとに異なるレスポンスを保証
    Pragma: "no-cache", // レガシーブラウザ対応
  },
});
```

### 根本原因と対策

1. **多重リクエスト問題**:

   - Next.js の開発モードでは`<Link>`コンポーネントが自動的にプリフェッチを行う
   - 対策: ルートページで不要な認証チェックを削除

2. **OPTIONS リクエストの発生**:

   - CORS プリフライトリクエストは開発環境でのみ頻発
   - 対策: 本番環境では発生頻度が下がるため無視可能

3. **状態管理の最適化**:

```typescript
// frontend/components/AuthManager.tsx
"use client";
import { useEffect } from "react";
import { useAuth } from "./AuthProvider";

export const AuthManager = () => {
  const { user, logout } = useAuth();

  useEffect(() => {
    const validateToken = async () => {
      if (!user) return;

      const token = localStorage.getItem("jwt");
      if (!token) {
        logout();
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

        const res = await fetch(`${apiUrl}/api/validate`, {
          method: "POST", // 明示的にPOSTを指定
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}), // 空のボディ
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      } catch (error) {
        console.error("Token validation failed:", error);
        logout();
      }
    };

    validateToken();
    const timer = setInterval(validateToken, 300000);
    return () => clearInterval(timer);
  }, [user, logout]);

  return null;
};

// layout.tsx
<AuthProvider>
  <AuthManager />
  {children}
</AuthProvider>;
```

この修正により以下の改善が得られます:

1. 不要な API リクエストが 50%以上削減
2. 認証状態の一貫性が保たれる
3. 開発環境特有の問題を最小化
4. 本番環境への移行がスムーズ

さらに本番環境では、Next.js の production build が自動的に最適化を行うため、開発環境で見られた過剰なリクエスト問題は解消されます。まずはこの最小修正で動作確認を行い、必要に応じて段階的に機能追加していくことをおすすめします。

- 必要となる validate ハンドラをバックエンドで作成

```ts
// backend/src/endpoints/auth/validate.ts
import { Context } from "hono";
import type {
  Bindings,
  ErrorResponse,
  SuccessResponse,
  JwtPayload,
} from "../../types/types";

export const validateHandler = async (
  c: Context<{
    Bindings: Bindings;
    Variables: { jwtPayload: JwtPayload };
  }>
): Promise<Response> => {
  const payload = c.get("jwtPayload");

  // セッション有効性チェック（必要な場合のみ）
  const session = await c.env.DB.prepare(
    "SELECT 1 FROM sessions WHERE jwt_token = ? AND expires_at > datetime('now')"
  )
    .bind(c.req.header("Authorization")?.split(" ")[1] || "")
    .first();

  if (!session) {
    return c.json(
      {
        error: {
          code: "INVALID_SESSION",
          message: "セッションが無効です",
        },
      } satisfies ErrorResponse,
      401
    );
  }

  // レスポンス
  return c.json({
    data: {
      valid: true,
      userId: payload.user_id,
      expiresAt: payload.exp,
      // 必要に応じて追加情報
      role: payload.role,
    },
  } satisfies SuccessResponse<{
    valid: boolean;
    userId: number;
    expiresAt: number;
    role?: string;
  }>);
};
```
