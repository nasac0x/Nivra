// Service Worker do Nivra — mínimo viável para installabilidade.
// Estratégia: network-first com fallback de cache para o shell.
// (app de dados locais: o conteúdo real vive no navegador, não no SW)

const CACHE = 'nivra-shell-v1';
const PRECACHE = [
  '/',
  '/manifest.json',
  '/icons/favicon-32.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // só GET da mesma origem; API/_next deixa pro navegador
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/_next/image')) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // replica em cache p/ próximas
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('/')))
  );
});
