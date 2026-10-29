const https = require('https');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { key, lat, lng, range = '3', count = '50' } = req.query;

  if (!key) {
    return res.status(400).json({ error: 'APIキーが指定されていません。' });
  }

  if (!lat || !lng) {
    return res.status(400).json({ error: '緯度・経度が指定されていません。' });
  }

  const apiUrl = new URL('https://webservice.recruit.co.jp/hotpepper/gourmet/v1/');
  apiUrl.searchParams.set('key', key.trim());
  apiUrl.searchParams.set('lat', lat.toString());
  apiUrl.searchParams.set('lng', lng.toString());
  apiUrl.searchParams.set('range', range.toString());
  apiUrl.searchParams.set('datum', 'world');
  apiUrl.searchParams.set('count', count.toString());
  apiUrl.searchParams.set('format', 'json');

  https.get(apiUrl.toString(), (apiRes) => {
    let data = '';
    apiRes.on('data', (chunk) => { data += chunk; });
    apiRes.on('end', () => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(apiRes.statusCode || 200).send(data);
    });
  }).on('error', (err) => {
    res.status(502).json({ error: `リクルートAPI通信エラー: ${err.message}` });
  });
};
