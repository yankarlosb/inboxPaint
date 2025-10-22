// Service Worker para InboxPaint PWA
const CACHE_NAME = 'inboxpaint-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker: Instalado');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar peticiones (cache-first strategy)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - devolver respuesta del cache
        if (response) {
          return response;
        }
        // No está en cache - fetch de la red
        return fetch(event.request);
      })
  );
});

// Escuchar mensajes push
self.addEventListener('push', (event) => {
  console.log('📨 Push recibido:', event);
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Nuevo mensaje', body: event.data.text() };
    }
  }

  const title = data.title || '📨 Nuevo mensaje en InboxPaint';
  const options = {
    body: data.body || 'Tienes un nuevo mensaje',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'inbox-message',
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Click en notificación:', event);
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
