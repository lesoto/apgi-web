// Service Worker for APGI Website
importScripts('/assets/js/logger.js');

const CACHE_NAME = 'apgi-v1';
const STATIC_CACHE = 'apgi-static-v1';
const DYNAMIC_CACHE = 'apgi-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/Home.html',
  '/Quiz-Short.html',
  '/Assessment.html',
  '/PsyStates-Visualizer.html',
  '/Consciousness-Visualization.html',
  '/Neuromoduratory-Cascade.html',
  '/Paper.html',
  '/Book-Outline.html',
  '/Book-Available-Now.html',
  '/Privacy-Policy.html',
  '/Terms-of-Service.html',
  '/Profile.html',
  '/Assessment-OnePage.html',
  '/Dashboard-Acad.html',
  '/State-Network-3d.html',
  '/PsyStates.html',
  '/assets/js/navigation.js',
  '/assets/js/accessibility-enhancer.js',
  '/assets/js/performance-optimizer.js',
  '/assets/js/data-extraction.js',
  '/assets/js/performance-optimizer-v2.js',
  '/assets/css/navigation.css',
  '/assets/css/design-system.css',
  '/assets/images/APGI-Framework-Diagram.svg',
  '/assets/images/Evolutionary-Mismatch.svg',
  '/assets/images/mismatch.jpg',
  '/assets/images/2-APGI-Framework-Diagram.png',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  logger.sw('Service Worker: Installing...');

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => {
        logger.sw('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        logger.sw('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch(error => {
        logger.sw('Service Worker: Failed to cache static assets', 'error');
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  logger.sw('Service Worker: Activating...');

  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              logger.sw('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        logger.sw('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests (except CDN resources)
  if (url.origin !== location.origin && !isCDNResource(url)) {
    return;
  }

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      // Return cached version if available
      if (cachedResponse) {
        // For HTML files, try network first for fresh content
        if (request.destination === 'document') {
          return fetch(request)
            .then(networkResponse => {
              // Cache the fresh response
              if (networkResponse.ok) {
                const responseClone = networkResponse.clone();
                caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, responseClone));
              }
              return networkResponse;
            })
            .catch(() => cachedResponse); // Fallback to cache
        }

        return cachedResponse;
      }

      // For static assets, cache on first fetch
      if (isStaticAsset(url)) {
        return fetch(request).then(networkResponse => {
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then(cache => cache.put(request, responseClone));
          }
          return networkResponse;
        });
      }

      // For dynamic content, cache with network-first strategy
      return fetch(request)
        .then(networkResponse => {
          if (networkResponse.ok && isCacheable(request)) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Try to serve from dynamic cache if network fails
          return caches.match(request);
        });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'quiz-results') {
    event.waitUntil(syncQuizResults());
  }
});

// Push notification handler
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New APGI Framework update available',
    icon: '/images/icon-192x192.png',
    badge: '/images/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: '/images/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/images/xmark.png'
      }
    ]
  };

  event.waitUntil(self.registration.showNotification('APGI Framework', options));
});

// Helper functions
function isCDNResource(url) {
  const cdnDomains = [
    'cdn.tailwindcss.com',
    'unpkg.com',
    'cdnjs.cloudflare.com',
    'cdn.jsdelivr.net',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
  ];

  return cdnDomains.some(domain => url.hostname.includes(domain));
}

function isStaticAsset(url) {
  const staticExtensions = [
    '.js',
    '.css',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.webp',
    '.woff',
    '.woff2'
  ];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

function isCacheable(request) {
  // Don't cache API calls or sensitive data
  if (request.url.includes('/api/') || request.url.includes('quiz-results')) {
    return false;
  }

  // Cache HTML, CSS, JS, images
  const cacheableTypes = ['document', 'style', 'script', 'image'];
  return cacheableTypes.includes(request.destination);
}

async function syncQuizResults() {
  // Sync any stored quiz results when back online
  const storedResults = await getStoredResults();

  for (const result of storedResults) {
    try {
      await fetch('/api/quiz-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(result)
      });

      // Remove synced result from storage
      await removeStoredResult(result.id);
    } catch (error) {
      logger.sw('Failed to sync quiz result', 'error');
    }
  }
}

async function getStoredResults() {
  // This would integrate with IndexedDB or localStorage
  return [];
}

async function removeStoredResult(id) {
  // Remove synced result from storage
  return Promise.resolve();
}
