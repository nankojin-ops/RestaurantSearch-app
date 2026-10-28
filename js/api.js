/**
 * ホットペッパーAPI JSONPクライアントモジュール
 */
const HotpepperApi = (() => {
  const BASE_URL = 'https://webservice.recruit.co.jp/hotpepper/gourmet/v1/';

  /**
   * 現在地から半径1km以内の飲食店を取得する
   * @param {string} apiKey - ホットペッパーAPIキー
   * @param {number} lat - 緯度
   * @param {number} lng - 経度
   * @returns {Promise<{shops: Array, available: number, returned: number}>}
   */
  const fetchNearbyRestaurants = (apiKey, lat, lng) => {
    return new Promise((resolve, reject) => {
      if (!apiKey) {
        reject(new Error('APIキーが設定されていません。'));
        return;
      }

      // JSONP用のユニークなコールバック関数名を生成
      const callbackName = `__hp_jsonp_cb_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

      // スクリプトタグの削除ヘルパー
      const removeScriptTag = () => {
        const scriptElem = document.getElementById(callbackName);
        if (scriptElem && scriptElem.parentNode) {
          scriptElem.parentNode.removeChild(scriptElem);
        }
      };

      // タイムアウト設定 (10秒)
      const timeoutId = setTimeout(() => {
        // 遅延レスポンス到達時の ReferenceError を防止するため、自己削除型 no-op 関数へ差し替え
        window[callbackName] = () => {
          delete window[callbackName];
        };
        removeScriptTag();
        reject(new Error('ホットペッパーAPIへの接続がタイムアウトしました。通信環境をご確認ください。'));
      }, 10000);

      // 正常完了時のクリーンアップ処理
      const cleanup = () => {
        clearTimeout(timeoutId);
        if (window[callbackName]) {
          delete window[callbackName];
        }
        removeScriptTag();
      };

      // グローバルコールバック関数の登録
      window[callbackName] = (data) => {
        cleanup();

        if (!data || !data.results) {
          reject(new Error('無効なAPIレスポンスを受信しました。'));
          return;
        }

        if (data.results.error) {
          const errDetail = data.results.error[0]?.message || 'APIリクエストエラーが発生しました。';
          reject(new Error(`ホットペッパーAPIエラー: ${errDetail}`));
          return;
        }

        const shops = data.results.shop || [];
        const available = parseInt(data.results.results_available, 10) || shops.length;
        const returned = parseInt(data.results.results_returned, 10) || shops.length;

        resolve({ shops, available, returned });
      };

      // パラメータの組み立て (range=3: 半径1000m)
      const params = new URLSearchParams({
        key: apiKey,
        lat: lat.toString(),
        lng: lng.toString(),
        range: '3',
        datum: 'world',
        count: '50',
        format: 'jsonp',
        callback: callbackName
      });

      // <script>タグの発行・挿入
      const script = document.createElement('script');
      script.id = callbackName;
      script.src = `${BASE_URL}?${params.toString()}`;
      script.onerror = () => {
        cleanup();
        reject(new Error('APIスクリプトのロードに失敗しました。APIキーまたはネットワーク接続をご確認ください。'));
      };

      document.head.appendChild(script);
    });
  };

  return {
    fetchNearbyRestaurants
  };
})();