const CACHE_NAME = 'cad-suporte-v4';

const ARQUIVOS_APP = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './js/common.js',
    './js/suporte.js',
    './js/grade.js',
    './js/guincho.js',
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

// Network-first: sempre busca a versão mais nova primeiro (essencial enquanto o
// app está em desenvolvimento ativo). Só cai para o cache se estiver offline.
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((respostaRede) => {
                const copia = respostaRede.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
                return respostaRede;
            })
            .catch(() => caches.match(event.request).then((r) => r || caches.match('./index.html')))
    );
});
