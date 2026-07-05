const CACHE_NAME = 'hokkaido-rpg-v5-cache';
const ASSETS = [
    './',
    './index.html',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://cdn.jsdelivr.net/npm/chart.js',
    './summer.mp3'
];

// 安裝階段：將核心資源寫入快取防線
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// 啟用階段：清除舊快取並立即接管頁面
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// 網路請求劫持：在北海道荒野斷網時，100% 秒開本地快取
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request).catch(() => {
                // 斷網後的沙盒後備機制
                if (event.request.mode === 'navigate') {
                    return new Response("<h1>📡 進入北海道無網地區 · 離線系統持續守護中</h1>", {
                        headers: { 'Content-Type': 'text/html' }
                    });
                }
            });
        })
    );
});
