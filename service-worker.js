const CACHE_NAME = 'cad-suporte-v1';

const ARQUIVOS_APP = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './js/common.js',
    './js/suporte.js',
    './js/grade.js',
    './js/lib/three.min.js',
    './js/lib/OrbitControls.js',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ARQUIVOS_APP))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((nomes) =>
            Promise.all(nomes.filter((nome) => nome !== CACHE_NAME).map((nome) => caches.delete(nome)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((respostaCache) => {
            if (respostaCache) return respostaCache;

            return fetch(event.request)
                .then((respostaRede) => {
                    const copia = respostaRede.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
                    return respostaRede;
                })
                .catch(() => caches.match('./index.html'));
        })
    );
});
