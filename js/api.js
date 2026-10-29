/**
 * ホットペッパーAPI クライアントモジュール
 * 
 * リクルートWEBサービスのJSONP廃止に伴い、ローカルプロキシ(/api/restaurants)を
 * 経由してAPIからJSONデータを取得します。
 */
const HotpepperApi = (() => {
  /**
   * 現在地から半径1km以内の飲食店を取得する
   * @param {string} apiKey - ホットペッパーAPIキー
   * @param {number} lat - 緯度
   * @param {number} lng - 経度
   * @returns {Promise<{shops: Array, available: number, returned: number}>}
   */
  const fetchNearbyRestaurants = async (apiKey, lat, lng) => {
    if (!apiKey) {
      throw new Error('APIキーが設定されていません。右上の「APIキー設定」より登録してください。');
    }

    const params = new URLSearchParams({
      key: apiKey.trim(),
      lat: lat.toString(),
      lng: lng.toString(),
      range: '3',
      count: '50'
    });

    // 試行するエンドポイント候補
    // 1. 同一オリジンのプロキシ (/api/restaurants)
    // 2. ローカルサーバー (http://localhost:3000/api/restaurants) - Live Server等で別ポートから開かれた場合の救済
    const candidateUrls = [
      `/api/restaurants?${params.toString()}`
    ];

    if (window.location.origin !== 'http://localhost:3000') {
      candidateUrls.push(`http://localhost:3000/api/restaurants?${params.toString()}`);
    }

    let lastError = null;

    for (const requestUrl of candidateUrls) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(requestUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errJson = await response.json().catch(() => null);
          const errMsg = errJson?.error || `HTTPエラー (${response.status} ${response.statusText})`;
          throw new Error(errMsg);
        }

        const data = await response.json();

        if (!data || !data.results) {
          throw new Error('無効なAPIレスポンスを受信しました。');
        }

        // リクルートAPIのエラー返却チェック
        if (data.results.error) {
          const errDetail = data.results.error[0]?.message || 'APIリクエストエラーが発生しました。';
          const errCode = data.results.error[0]?.code;
          if (errCode === 2000 || errDetail.includes('APIキー')) {
            throw new Error(`ホットペッパーAPIエラー: APIキーが正しくありません。右上の「APIキー設定」より有効なキーを設定してください。`);
          }
          throw new Error(`ホットペッパーAPIエラー: ${errDetail}`);
        }

        const shops = data.results.shop || [];
        const available = parseInt(data.results.results_available, 10) || shops.length;
        const returned = parseInt(data.results.results_returned, 10) || shops.length;

        return { shops, available, returned };

      } catch (err) {
        clearTimeout(timeoutId);

        if (err.name === 'AbortError') {
          lastError = new Error('ホットペッパーAPIへの接続がタイムアウトしました。通信環境やAPIキーをご確認ください。');
        } else {
          lastError = err;
        }

        // 次のURL候補がある場合は再試行
      }
    }

    // すべてのエンドポイントで失敗した場合の親切なメッセージ
    const isNetworkError = lastError?.message?.includes('Failed to fetch') || 
                           lastError?.message?.includes('NetworkError') ||
                           lastError?.message?.includes('Load failed');

    if (isNetworkError) {
      throw new Error(
        'ローカルサーバーに接続できませんでした。<br>' +
        'リクルート社の仕様変更（JSONP廃止）に伴い、本アプリの実行にはローカルサーバーが必要です。<br>' +
        'ターミナルで <code>node server.js</code> を実行するか、フォルダ内の <code>start.bat</code> をダブルクリックして起動してください。'
      );
    }

    throw lastError || new Error('飲食店の検索に失敗しました。');
  };

  return {
    fetchNearbyRestaurants
  };
})();
