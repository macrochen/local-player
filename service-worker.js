const CACHE_NAME = 'media-player-v11';
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
      .then(() => self.skipWaiting()) // 强制立刻激活新的 Service Worker
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
      // 必须包含 supportsAllDrives=true 否则共享云盘里的文件会报 404
      const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`;
      
      const headers = new Headers();
      // Google API 下载文件强制要求使用 Authorization header (不能用 query param)
      headers.set('Authorization', `Bearer ${token}`);
      
      // 透传视频播放器的 Range 请求头，用于支持拖拽和分段缓冲
      if (event.request.headers.has('Range')) {
        headers.set('Range', event.request.headers.get('Range'));
      }
      
      const newRequest = new Request(driveUrl, {
        method: event.request.method,
        headers: headers,
        mode: 'cors', // 必须是 cors 才能发送 Authorization header
        credentials: 'omit',
        redirect: 'follow' // 浏览器会自动跟随重定向到 googleusercontent.com，并附带签名
      });
      
      event.respondWith(
        fetch(newRequest).then(response => {
          // 如果 Google 返回 4xx/5xx 错误，在控制台打印方便调试
          if (!response.ok) {
            console.error("Google Drive API 返回错误:", response.status, response.url);
          }
          return response;
        }).catch(err => {
          console.error("Fetch Google Drive 失败:", err);
          throw err;
        })
      );
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
      ).then(() => self.clients.claim()); // 强制立刻接管所有打开的页面
    })
  );
});