// Service Worker for APGI Website Performance Optimization
const CACHE_NAME = 'apgi-framework-v1';
const STATIC_CACHE = 'apgi-static-v1';
const DYNAMIC_CACHE = 'apgi-dynamic-v1';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/Home.html',
  '/js/navigation.js',
  '/js/accessibility-enhancer.js',
  '/Privacy-Policy.html',
  '/Terms-of-Service.html',
  '/images/APGI-Framework-Diagram.png',
  '/images/APGI-Framework-Diagram.svg'
];

// External CDN resources to cache
const CDN_RESOURCES = [
  'https://cdn.plot.ly/plotly-3.3.0.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@700&family=Inter:wght@300;400;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.tailwindcss.com'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.log('Service Worker: Failed to cache static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external requests that aren't in our CDN list
  if (url.origin !== self.location.origin && !CDN_RESOURCES.includes(url.href)) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          // For static assets, serve from cache and update in background
          if (isStaticAsset(request.url)) {
            updateCacheInBackground(request);
            return cachedResponse;
          }
          
          // For HTML pages, check network first for fresh content
          if (request.headers.get('accept').includes('text/html')) {
            return fetch(request)
              .then((networkResponse) => {
                if (networkResponse.ok) {
                  // Cache the fresh response
                  const responseClone = networkResponse.clone();
                  caches.open(DYNAMIC_CACHE).then((cache) => {
                    cache.put(request, responseClone);
                  });
                  return networkResponse;
                }
                return cachedResponse;
              })
              .catch(() => {
                return cachedResponse;
              });
          }
          
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(request)
          .then((networkResponse) => {
            // Check if response is valid
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Clone the response
            const responseClone = networkResponse.clone();
            
            // Cache the response
            if (isStaticAsset(request.url)) {
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            } else {
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            
            return networkResponse;
          })
          .catch((error) => {
            console.log('Service Worker: Fetch failed', error);
            
            // Return offline page for HTML requests
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('/Home.html') || new Response('Offline', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            }
          });
      })
  );
});

// Background sync for cache updates
function updateCacheInBackground(request) {
  fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        caches.open(STATIC_CACHE).then((cache) => {
          cache.put(request, networkResponse);
        });
      }
    })
    .catch((error) => {
      console.log('Service Worker: Background update failed', error);
    });
}

// Check if request is for a static asset
function isStaticAsset(url) {
  return STATIC_ASSETS.some(asset => url.includes(asset)) ||
         CDN_RESOURCES.some(cdn => url.includes(cdn)) ||
         url.includes('.js') ||
         url.includes('.css') ||
         url.includes('.png') ||
         url.includes('.jpg') ||
         url.includes('.svg') ||
         url.includes('.woff') ||
         url.includes('.woff2');
}

// Message handling for cache management
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_UPDATE':
      updateSpecificCache(payload.url);
      break;
      
    case 'CLEAR_CACHE':
      clearCaches();
      break;
      
    default:
      console.log('Service Worker: Unknown message type', type);
  }
});

// Update specific cache entry
function updateSpecificCache(url) {
  fetch(url)
    .then((response) => {
      if (response.ok) {
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(url, response);
        });
      }
    })
    .catch((error) => {
      console.log('Service Worker: Failed to update specific cache', error);
    });
}

// Clear all caches
function clearCaches() {
  caches.keys().then((cacheNames) => {
    return Promise.all(
      cacheNames.map((cacheName) => {
        return caches.delete(cacheName);
      })
    );
  });
}

// Performance monitoring
self.addEventListener('fetch', (event) => {
  const start = performance.now();
  
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(event.request);
        const end = performance.now();
        
        // Log slow requests
        if (end - start > 1000) {
          console.log('Service Worker: Slow request detected', {
            url: event.request.url,
            duration: end - start
          });
        }
        
        return response;
      } catch (error) {
        console.log('Service Worker: Request failed', {
          url: event.request.url,
          error: error.message
        });
        throw error;
      }
    })()
  );
});

// Cache size management
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.open(DYNAMIC_CACHE).then((cache) => {
      return cache.keys().then((keys) => {
        // If cache is too large, remove oldest entries
        if (keys.length > 100) {
          return Promise.all(
            keys.slice(0, 50).map((key) => cache.delete(key))
          );
        }
      });
    })
  );
});
