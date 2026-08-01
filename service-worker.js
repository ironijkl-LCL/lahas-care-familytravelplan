// service-worker.js (13.0 獨立靜態檔標準版)
const CACHE_NAME = 'travel-rpg-v13-static';

// 需要預先離線快取的靜態資源清單
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/app.css',
    './js/db.js',
    './js/map.js',
    './js/quest.js',
    './js/pwa.js',
    './js/app.js',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// 1. 安裝階段 (Installation): 預快取核心靜態檔案
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('📡 [SW] 正在預快取 App 核心靜態檔案...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting(); // 強制跳過等待，即時啟用
});

// 2. 激活階段 (Activation): 清理過期的舊版本 Cache
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME && !key.startsWith('map-tiles')) {
                        console.log('🗑️ [SW] 清理舊快取版本:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. 攔截請求 (Fetch): Cache-First 策略 + 地圖 Tiles 動態快取
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            // 優先回傳快取
            if (cachedResponse) {
                return cachedResponse;
            }
            // 冇快取就經網絡抓取
            return fetch(event.request).then(networkResponse => {
                // 如果係 OpenStreetMap 切片，自動複製一份存入地圖快取庫
                if (event.request.url.includes('tile.openstreetmap.org')) {
                    const responseClone = networkResponse.clone();
                    caches.open('map-tiles-v13').then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            });
        }).catch(() => caches.match('./index.html')) // 完全斷網時的 Fallback
    );
});
