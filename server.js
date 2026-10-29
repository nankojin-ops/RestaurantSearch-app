/**
 * 近隣1km 飲食店マップ - ローカル開発用Webサーバー & APIプロキシ
 * 
 * 外部npmパッケージ不要（Node.js標準モジュールのみ）で動作します。
 * ホットペッパーAPIのJSONP廃止に伴うCORS制約を解消するため、
 * /api/restaurants 経由でリクルートAPIへ安全に中継します。
 */

const http = require('http');
const https = require('https');
const url = require('url');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

// MIMEタイプマッピング
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // CORSヘッダー（Live Serverなど別ポートからのアクセスも許容）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 1. APIプロキシエンドポイント: /api/restaurants
  if (pathname === '/api/restaurants') {
    const { key, lat, lng, range = '3', count = '50' } = parsedUrl.query;

    if (!key) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'APIキーが指定されていません。' }));
      return;
    }

    if (!lat || !lng) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: '緯度・経度が指定されていません。' }));
      return;
    }

    // ホットペッパーAPIへのリクエストパラメータ組み立て
    const apiUrl = new URL('https://webservice.recruit.co.jp/hotpepper/gourmet/v1/');
    apiUrl.searchParams.set('key', key);
    apiUrl.searchParams.set('lat', lat);
    apiUrl.searchParams.set('lng', lng);
    apiUrl.searchParams.set('range', range);
    apiUrl.searchParams.set('datum', 'world');
    apiUrl.searchParams.set('count', count);
    apiUrl.searchParams.set('format', 'json');

    const apiReq = https.get(apiUrl.toString(), (apiRes) => {
      let data = '';

      apiRes.on('data', (chunk) => {
        data += chunk;
      });

      apiRes.on('end', () => {
        res.writeHead(apiRes.statusCode, {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(data);
      });
    });

    apiReq.on('error', (err) => {
      console.error('ホットペッパーAPI通信エラー:', err.message);
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: `リクルートAPIサーバーとの通信に失敗しました: ${err.message}` }));
    });

    // 10秒タイムアウト
    apiReq.setTimeout(10000, () => {
      apiReq.destroy(new Error('リクルートAPIへの接続がタイムアウトしました。'));
    });

    return;
  }

  // 2. 静的ファイルの配信
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, safePath);

  // ディレクトリトラバーサル対策
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` 近隣1km 飲食店マップ アプリサーバーが起動しました`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log(` 終了するには Ctrl + C を押してください`);
  console.log(`=======================================================`);
});
