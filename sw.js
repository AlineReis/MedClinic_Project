/**
 * SERVICE WORKER
 * MedClinic - PWA Offline Support
 */

const CACHE_NAME = 'medclinic-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/pages/login.html',
  '/pages/register.html',
  '/pages/patient-dashboard.html',
  '/pages/doctor-dashboard.html',
  '/pages/doctors.html',
  '/pages/slots.html',
  '/pages/checkout.html',
  '/pages/my-appointments.html',
  '/pages/prescription.html',
  '/pages/password-recovery.html',
  '/js/services/mock_db.js',
  '/js/services/auth.js',
  '/js/services/api.js',
  '/js/utils/validation.js',
  '/js/utils/utils.js',
  '/js/pages/app.js',
  '/css/global.css',
  '/manifest.json'
];

// External resources to cache
const EXTERNAL_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.log('[SW] Cache failed:', err))
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API calls (let them go to network)
  if (url.pathname.startsWith('/api/')) return;

  // Cache-first strategy for static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Network-first strategy for HTML pages
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Stale-while-revalidate for other resources
  event.respondWith(staleWhileRevalidate(request));
});

// Cache-first strategy
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Return offline page
    return caches.match('/pages/login.html');
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const networkPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        const responseToCache = response.clone();
        caches
          .open(CACHE_NAME)
          .then(cache => cache.put(request, responseToCache));
      }
      return response;
    })
    .catch(() => null);

  return cached || networkPromise;
}

// Check if URL is a static asset
function isStaticAsset(pathname) {
  const extensions = [
    '.js',
    '.css',
    '.png',
    '.jpg',
    '.jpeg',
    '.svg',
    '.ico',
    '.woff',
    '.woff2'
  ];
  return extensions.some(ext => pathname.endsWith(ext));
}

// Handle push notifications (for future use)
self.addEventListener('push', event => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || 'Nova notificação do MedClinic',
    icon: '/assets/icons/icon-192.png',
    badge: '/assets/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Fechar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'MedClinic', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'close') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Focus existing window if open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Background sync (for offline form submissions)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-appointments') {
    event.waitUntil(syncAppointments());
  }
});

async function syncAppointments() {
  // In production, this would sync offline appointments to the server
  console.log('[SW] Syncing appointments...');
}
