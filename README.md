# 近隣1km 飲食店マップ (RestaurantSearch-app)

スマートフォンやPCのブラウザから、現在地（GPS）の半径1km以内にある飲食店をホットペッパーグルメ Webサービス（API）を用いて検索・一覧表示するWebアプリケーションです。

サーバー不要の完全な静的Webアプリケーション（HTML/CSS/JavaScript）のため、**GitHub Pages やスマートフォンのブラウザからURLを開くだけでそのまま動作します**。

---

## 📌 主な機能・特徴

- **📱 スマホ・PC完全対応（サーバーレス）**
  - バックエンドサーバーの構築・起動は一切不要。スマホのSafari/ChromeやGitHub PagesでURLを開くだけで即座に利用可能。
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
| **外部API** | [ホットペッパーグルメ Webサービス](http://webservice.recruit.co.jp/) (JSONP通信) |
| **Web API** | Geolocation API, Web Storage API (LocalStorage) |

---

## 📁 ディレクトリ構成

```plaintext
RestaurantSearch-app/
├── index.html          # メインHTML（UIレイアウトおよびモーダル）
├── js/
│   ├── api.js          # ホットペッパーAPI クライアントモジュール（JSONP）
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

### 2. アプリの起動

#### スマートフォン・GitHub Pages で使う場合（推奨）
リポジトリの GitHub Pages の URL（例: `https://<ユーザー名>.github.io/RestaurantSearch-app/`）にスマホやPCのブラウザからアクセスします。

#### PCのローカルで開く場合
VS Codeの「Live Server」拡張機能などを使用するか、`index.html` をブラウザで開きます。

> **※注意:** Geolocation API のブラウザセキュリティ仕様により、位置情報の取得には **HTTPS接続**（GitHub Pages等）または **localhost環境** が必要です。

---

### 3. 操作手順
1. 画面右上の **「APIキー設定」** ボタンをタップ/クリックします。
2. 取得したホットペッパーAPIキーを入力し、**「保存する」** をタップします。
3. **「現在地で検索する」** ボタンをタップします。
4. 「位置情報の利用を許可しますか？」と表示されたら **「許可」** を選択します。
5. 現在地から半径1km以内の飲食店一覧が表示されます。「マップを開く」を押すとGoogleマップが開きます。

---

## 📜 クレジット

Powered by [ホットペッパーグルメ Webサービス](http://webservice.recruit.co.jp/)
