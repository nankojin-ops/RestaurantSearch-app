/**
 * Vercel / Netlify サーバーレス関数: /api/restaurants
 * 
 * リクルートWEBサービス（ホットペッパーAPI）のJSONP廃止に伴うCORS制約を解消するため、
 * サーバーサイドから安全にリクルートAPI（format=json）を呼び出して結果をフロントエンドに返します。
 */
const https = require('https');

module.exports = async (req, res) => {
  // CORSヘッダーの付与
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const { key, lat, lng, range = '3', count = '50' } = req.query;

  if (!key) {
    res.status(400).json({ error: 'APIキーが指定されていません。' });
    return;
  }

  if (!lat || !lng) {
    res.status(400).json({ error: '緯度・経度が指定されていません。' });
    return;
  }

  // ホットペッパーAPIへのリクエストパラメータ組み立て
  const apiUrl = new URL('https://webservice.recruit.co.jp/hotpepper/gourmet/v1/');
  apiUrl.searchParams.set('key', key.trim());
  apiUrl.searchParams.set('lat', lat.toString());
  apiUrl.searchParams.set('lng', lng.toString());
  apiUrl.searchParams.set('range', range.toString());
  apiUrl.searchParams.set('datum', 'world');
  apiUrl.searchParams.set('count', count.toString());
  apiUrl.searchParams.set('format', 'json');

  return new Promise((resolve) => {
    const apiReq = https.get(apiUrl.toString(), (apiRes) => {
      let data = '';

      apiRes.on('data', (chunk) => {
        data += chunk;
      });

      apiRes.on('end', () => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(apiRes.statusCode).send(data);
        resolve();
      });
    });

    apiReq.on('error', (err) => {
      res.status(502).json({ error: `リクルートAPIサーバーとの通信に失敗しました: ${err.message}` });
      resolve();
    });

    apiReq.setTimeout(10000, () => {
      apiReq.destroy();
      res.status(504).json({ error: 'リクルートAPIへの接続がタイムアウトしました。' });
      resolve();
    });
  });
};
