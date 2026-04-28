// Service Worker — Gela Redenção PWA
const CACHE_NAME = 'gela-redencao-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo-gela.jpeg',
];

// Instala e faz cache dos assets estáticos
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

// Ativa e remove caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

// Estratégia: Network First para navegação, Cache First para assets estáticos
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições não-HTTP (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) return;

  // IMPORTANTE: Ignora requisições que não sejam GET
  // PATCH, POST, PUT, DELETE não podem ser cacheadas
  if (request.method !== 'GET') return;

  // Ignora requisições para APIs externas (Supabase, Evolution, etc.)
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('railway.app') ||
    url.hostname.includes('openfoodfacts.org')
  ) return;

  // Para navegação (páginas HTML) — Network First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Para assets (imagens, fontes, CSS, JS) — Cache First
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return response;
      });
    })
  );
});