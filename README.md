# 近隣1km 飲食店マップ (RestaurantSearch-app)

スマートフォンやPCのブラウザから、現在地（GPS）の半径1km以内にある飲食店をホットペッパーグルメ Webサービス（API）を用いて検索・一覧表示するWebアプリケーションです。

---

## 🔍 なぜ「タイムアウト」が発生していたのか？（技術的背景）

リクルートWEBサービス（ホットペッパーAPI）において、**2023年10月31日をもって JSONP（`format=jsonp`）のサポートが完全終了**しました。

1. **API側の挙動**: 現在、`format=jsonp` を指定しても無効値として無視され、初期値である **XML形式** で返却されます。
2. **ブラウザの挙動（CORB / ORB）**: 現代のブラウザ（iOS Safari、Android Chrome、PC Chrome等）は、セキュリティ防御機能（CORB/ORB）により、`<script>` タグでクロスオリジンの XML を受信すると **レスポンス本文を空（空文字）に強制置換** します。
3. **結果**: エラーイベントも構文エラーも発生せず、コールバック関数も実行されないため、**タイマーだけが満了して「接続がタイムアウトしました」** に倒れていました。
4. **CORS制約**: リクルートAPIは CORS ヘッダー（`Access-Control-Allow-Origin`）を返さないため、ブラウザからの直接 `fetch()` も同一生成元ポリシー（SOP）により遮断されます。

このため、**スマートフォンやWeb上で動作させるには、中継API（サーバーレス関数等）を経由する構成が必須**となります。本リポジトリには、スマートフォンから完全無料で利用可能にするための **Vercel / Netlify 対応サーバーレス関数（`/api/restaurants.js`）** を同梱しています。

---

## 📌 主な機能・特徴

- **📍 現在地からワンクリック検索**
  - ブラウザの Geolocation API を利用して端末の現在地（緯度・経度）を取得し、半径1km以内の飲食店を自動検索。
- **📋 充実した店舗一覧テーブル**
  - **店舗名 / ジャンル / キャッチコピー**: お店の名前と料理ジャンル、特徴を表示
  - **営業時間 / 定休日**: 営業スケジュールを一目で確認
  - **標準価格帯（目安・平均）**: ディナー・ランチ等の平均予算帯を表示
  - **Googleマップ連携**: 気になる店舗をワンタップでGoogleマップで開き、ルート検索やクチコミを確認可能
- **🔐 安心のローカルAPIキー管理**
  - ホットペッパーAPIキーはブラウザ内（LocalStorage）にのみ安全に保存されます。

---

## 🛠 技術スタック

| 分類 | 技術 |
| :--- | :--- |
| **フロントエンド** | HTML5, Vanilla JavaScript (ES6+), Tailwind CSS (CDN), Font Awesome 6 |
| **API中継レイヤー** | Vercel Serverless Function / Node.js (標準モジュール: http, https) |
| **外部API** | [ホットペッパーグルメ Webサービス](http://webservice.recruit.co.jp/) (format=json) |
| **Web API** | Geolocation API, Web Storage API (LocalStorage) |

---

## 📁 ディレクトリ構成

```plaintext
RestaurantSearch-app/
├── index.html          # メインHTML（UIレイアウトおよびモーダル）
├── vercel.json         # Vercelルーティング設定
├── server.js           # PCローカル実行用サーバー（npm install不要）
├── start.bat           # Windows用ワンクリック起動バッチ
├── package.json        # プロジェクト設定
├── api/
│   └── restaurants.js  # Vercel / Netlify サーバーレス関数（APIプロキシ）
├── js/
│   ├── api.js          # APIクライアントモジュール
│   ├── app.js          # イベント処理・DOMレンダリング・全体制御
│   ├── geo.js          # Geolocation APIによる位置情報取得モジュール
│   └── storage.js      # LocalStorageによるAPIキー永続化モジュール
├── .gitignore          # Git除外設定ファイル
└── README.md           # プロジェクトドキュメント（本ファイル）
```

---

## 🚀 利用方法

### 1. ホットペッパーAPIキーの取得（初回のみ・無料）
1. [リクルートWEBサービス 新規登録ページ](https://webservice.recruit.co.jp/register/) にアクセスします。
2. 会員登録を行い、発行された「APIキー」をコピーします。

---

### 2. スマートフォンで動かす方法（推奨・完全無料）

リポジトリ内にサーバーレス関数を同梱しているため、**Vercel（完全無料）に連携するだけで、スマホから即座に利用可能**になります。

1. [Vercel](https://vercel.com/) にアクセスし、GitHubアカウントでログインします。
2. **「Add New...」>「Project」** を選択し、本リポジトリ（`RestaurantSearch-app`）の **「Import」** をクリックします。
3. そのまま **「Deploy」** ボタンを押します（約30秒でデプロイ完了します）。
4. 発行された URL（`https://restaurant-search-app-xxxx.vercel.app`）をスマートフォンのブラウザで開きます。

---

### 3. PCローカルで動かす方法

1. フォルダ内の `start.bat` をダブルクリックします（またはターミナルで `node server.js` を実行）。
2. ブラウザで `http://localhost:3000` を開きます。

---

### 4. 操作手順
1. 画面右上の **「APIキー設定」** ボタンをタップ/クリックします。
2. 取得したホットペッパーAPIキーを入力し、**「保存する」** をタップします。
3. **「現在地で検索する」** ボタンをタップします。
4. 「位置情報の利用を許可しますか？」と表示されたら **「許可」** を選択します。
5. 現在地から半径1km以内の飲食店一覧が表示されます。「マップを開く」を押すとGoogleマップが開きます。

---

## 📜 クレジット

Powered by [ホットペッパーグルメ Webサービス](http://webservice.recruit.co.jp/)
