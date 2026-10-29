/**
 * ホットペッパーAPI クライアントモジュール
 * 
 * リクルートWEBサービスにおけるJSONP廃止に伴い、
 * 中継API (/api/restaurants) を経由してデータを取得します。
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
    if (!apiKey || !apiKey.trim()) {
      throw new Error('APIキーが設定されていません。右上の「APIキー設定」より登録してください。');
    }

    const sanitizedKey = apiKey.trim();
    const latVal = typeof lat === 'number' ? lat.toFixed(6) : Number(lat).toFixed(6);
    const lngVal = typeof lng === 'number' ? lng.toFixed(6) : Number(lng).toFixed(6);

    const queryParams = new URLSearchParams({
      key: sanitizedKey,
      lat: latVal,
      lng: lngVal,
      range: '3',
      count: '50'
    });

    // 試行するエンドポイント候補
    const candidateUrls = [
      `/api/restaurants?${queryParams.toString()}`
    ];

    // ローカル別ポート（Live Serverなど）で開かれた場合のフォールバック
    if (window.location.origin !== 'http://localhost:3000' && window.location.protocol.startsWith('http')) {
      candidateUrls.push(`http://localhost:3000/api/restaurants?${queryParams.toString()}`);
    }

    let lastError = null;

    for (const requestUrl of candidateUrls) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      try {
        const response = await fetch(requestUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          const errMsg = errData?.error || `HTTPエラー: ${response.status} ${response.statusText}`;
          throw new Error(errMsg);
        }

        const data = await response.json();

        if (!data || !data.results) {
          throw new Error('無効なAPIレスポンスを受信しました。');
        }

        if (data.results.error) {
          const errDetail = data.results.error[0]?.message || 'APIリクエストエラーが発生しました。';
          const errCode = data.results.error[0]?.code;
          if (errCode === 2000 || errDetail.includes('APIキー')) {
            throw new Error('ホットペッパーAPIエラー: APIキーが正しくありません。右上の「APIキー設定」より有効なキーをご確認ください。');
          }
          throw new Error(`ホットペッパーAPIエラー: ${errDetail}`);
        }

        const shops = data.results.shop || [];
        const available = parseInt(data.results.results_available, 10) || shops.length;
        const returned = parseInt(data.results.results_returned, 10) || shops.length;

        return { shops, available, returned };

      } catch (err) {
        clearTimeout(timeoutId);
        lastError = err;
      }
    }

    // エラーハンドリングと分かりやすいガイダンス
    if (lastError?.name === 'AbortError') {
      throw new Error('ホットペッパーAPIへの接続がタイムアウトしました。通信環境をご確認ください。');
    }

    // ネットワークエラーまたは404（静的ホスティング等で /api が存在しない場合）
    const isNetworkOr404 = lastError?.message?.includes('Failed to fetch') ||
                           lastError?.message?.includes('NetworkError') ||
                           lastError?.message?.includes('404');

    if (isNetworkOr404) {
      throw new Error(
        '<strong>【API中継エラー】</strong><br>' +
        'リクルート社によるJSONP廃止（2023年10月）に伴い、ホットペッパーAPIの直接通信はブラウザのCORS制限により遮断されます。<br><br>' +
        '📱 <strong>スマートフォンでご利用の場合:</strong><br>' +
        '本リポジトリを <strong>Vercel</strong>（無料）に連携すると、同梱の <code>/api/restaurants</code> サーバーレス関数が自動展開され、スマホのブラウザから正常にご利用いただけます。<br><br>' +
        '💻 <strong>PCローカルでご利用の場合:</strong><br>' +
        'ターミナルで <code>node server.js</code> を実行し、<code>http://localhost:3000</code> よりアクセスしてください。'
      );
    }

    throw lastError || new Error('飲食店の検索に失敗しました。');
  };

  return {
    fetchNearbyRestaurants
  };
})();
