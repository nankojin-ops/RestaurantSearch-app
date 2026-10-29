/**
 * ホットペッパーAPI クライアントモジュール
 * 
 * スマートフォンや静的ホスティング（GitHub Pages等）のブラウザ単体で完結して動作するよう、
 * JSONP方式を用いて直接リクルートWEBサービスと通信します（サーバー不要）。
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
      if (!apiKey || !apiKey.trim()) {
        reject(new Error('APIキーが設定されていません。右上の「APIキー設定」より登録してください。'));
        return;
      }

      const sanitizedKey = apiKey.trim();

      // 緯度・経度の正規化（小数点以下6桁）
      const latVal = typeof lat === 'number' ? lat.toFixed(6) : Number(lat).toFixed(6);
      const lngVal = typeof lng === 'number' ? lng.toFixed(6) : Number(lng).toFixed(6);

      // JSONP用のユニークなコールバック関数名
      const callbackName = `hpCallback_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
      const scriptId = `script_${callbackName}`;

      let isCleanedUp = false;

      // スクリプトタグ削除ヘルパー
      const removeScriptTag = () => {
        const scriptElem = document.getElementById(scriptId);
        if (scriptElem && scriptElem.parentNode) {
          scriptElem.parentNode.removeChild(scriptElem);
        }
      };

      // 共通クリーンアップ処理
      const cleanup = () => {
        if (isCleanedUp) return;
        isCleanedUp = true;

        clearTimeout(timeoutId);
        window.removeEventListener('error', scriptErrorHandler, true);

        if (window[callbackName]) {
          // 遅延到達時のReferenceErrorを防止するため自己削除型関数へ差し替え
          window[callbackName] = () => {
            delete window[callbackName];
          };
          setTimeout(() => {
            delete window[callbackName];
          }, 5000);
        }

        removeScriptTag();
      };

      // タイムアウト設定 (モバイル通信環境を考慮して15秒)
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(
          'ホットペッパーAPIへの接続がタイムアウトしました。<br>' +
          '電波環境をご確認いただくか、入力したAPIキーが有効であるか「APIキー設定」をご確認ください。'
        ));
      }, 15000);

      // スクリプトエラー・構文エラーの検知（APIキー不正時などにXMLが返ってきた場合の即時検出）
      const scriptErrorHandler = (event) => {
        const targetSrc = event?.target?.src || event?.filename || '';
        if (targetSrc.includes('webservice.recruit.co.jp') || event?.target?.id === scriptId) {
          cleanup();
          reject(new Error(
            'ホットペッパーAPIからの応答解析に失敗しました。<br>' +
            'APIキーが正しくないか、利用制限に達している可能性があります。<br>' +
            '右上の「APIキー設定」よりキーを再度ご確認ください。'
          ));
        }
      };
      window.addEventListener('error', scriptErrorHandler, true);

      // グローバルコールバック関数の登録
      window[callbackName] = (data) => {
        cleanup();

        if (!data || !data.results) {
          reject(new Error('無効なAPIレスポンスを受信しました。'));
          return;
        }

        if (data.results.error) {
          const errDetail = data.results.error[0]?.message || 'APIリクエストエラーが発生しました。';
          const errCode = data.results.error[0]?.code;
          if (errCode === 2000 || errDetail.includes('APIキー')) {
            reject(new Error('ホットペッパーAPIエラー: APIキーが正しくありません。右上の「APIキー設定」より正しいキーを入力してください。'));
            return;
          }
          reject(new Error(`ホットペッパーAPIエラー: ${errDetail}`));
          return;
        }

        const shops = data.results.shop || [];
        const available = parseInt(data.results.results_available, 10) || shops.length;
        const returned = parseInt(data.results.results_returned, 10) || shops.length;

        resolve({ shops, available, returned });
      };

      // パラメータ組み立て (range=3: 半径1000m)
      const params = new URLSearchParams({
        key: sanitizedKey,
        lat: latVal,
        lng: lngVal,
        range: '3',
        datum: 'world',
        count: '50',
        format: 'jsonp',
        callback: callbackName,
        _: Date.now().toString()
      });

      // <script>タグの生成・挿入
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `${BASE_URL}?${params.toString()}`;
      script.async = true;

      script.onerror = () => {
        cleanup();
        reject(new Error('ホットペッパーAPIへの接続に失敗しました。ネットワーク接続やURL制限をご確認ください。'));
      };

      document.head.appendChild(script);
    });
  };

  return {
    fetchNearbyRestaurants
  };
})();
