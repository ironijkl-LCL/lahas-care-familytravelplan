// service-worker.js
const CACHE_NAME = 'hokkaido-rpg-v5.0';

// 需要離線快取的靜態資源清單
const ASSETS_TO_CACHE = [
  './',                  // 緩存首頁
  './summer.mp3',        // 你的背景音樂檔案
  // 線上第三方組件（直接寫入網址，SW 會在第一次連網時抓下來存進手機）
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// 1. 安裝階段 (Installation): 把所有資源塞進手機快取
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📡 [SW] 正在建立實體快取庫...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting()) // 強制更新
  );
});

// 2. 激活階段 (Activation): 清理舊版本的快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('🗑️ [SW] 清理舊快取版本:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 攔截請求 (Fetch): 核心離線機制（快取優先策略）
self.addEventListener('fetch', (event) => {
  // 只攔截 GET 請求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 如果快取庫裡面有，就直接秒開（完全不需要網絡）
      if (cachedResponse) {
        return cachedResponse;
      }

      // 如果快取沒有（例如未來你手動加的新網址），就去走網絡下載
      return fetch(event.request).then((networkResponse) => {
        // 確保回應正常才存入快取
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // 動態將新請求複製一份存入快取，方便下次離線使用
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // 當徹底沒網、快取也找不到時的降級處理（通常不會發生在已設定快取的靜態資源上）
        console.log('📴 [SW] 完全處於無網路狀態且無快取資源');
      });
    })
  );
});
