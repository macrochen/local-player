const CACHE_NAME = 'media-player-v7';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 安装 service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 拦截网络请求
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // 拦截 Google Drive 媒体请求
  const match = url.pathname.match(/\/google-drive-media\/([^/]+)$/);
  if (match) {
    const fileId = match[1];
    const token = url.searchParams.get('token');
    
    if (fileId && token) {
      const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      const headers = new Headers(event.request.headers);
      headers.set('Authorization', `Bearer ${token}`);
      
      const newRequest = new Request(driveUrl, {
        method: event.request.method,
        headers: headers,
        mode: 'cors',
        credentials: 'omit',
        redirect: 'follow'
      });
      
      event.respondWith(fetch(newRequest));
      return;
    }
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果找到缓存的响应，则返回缓存
        if (response) {
          return response;
        }
        
        // 否则发起网络请求
        return fetch(event.request).then(
          response => {
            // 检查是否收到有效的响应
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 克隆响应，因为响应是一个流，只能消费一次
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          }
        );
      })
    );
});

// 激活 service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});