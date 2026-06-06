/* オフライン対応：初回オンラインで読み込めば、以降はネットなしでも起動・動作 */
const CACHE = 'shodan-slide-v1';
const ASSETS = [
  './',
  './index.html',
  './商談スライド.html',
  './step5-compare.html',
  './kinri-chart.html',
  './chart.umd.min.js',
  './chartjs-adapter-date-fns.bundle.min.js',
  './logo.png',
  './robots.txt'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url; try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin !== location.origin) return;   // 外部（金利データ取得など）は介入しない

  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    // ネット優先・失敗時はキャッシュ（オフライン時）
    e.respondWith(
      fetch(req).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return res; })
        .catch(() => caches.match(req).then(r => r || caches.match('./商談スライド.html')))
    );
  } else {
    // キャッシュ優先・無ければネット
    e.respondWith(
      caches.match(req).then(r => r || fetch(req).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return res; }).catch(() => r))
    );
  }
});
