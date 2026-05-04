/**
 * APGI Framework Service Worker
 * Provides offline caching for static assets
 * @version 1.0.0
 */

const CACHE_NAME = "apgi-framework-v1";
const STATIC_ASSETS = [
  "/",
  "/Home.html",
  "/assets/css/design-system.css",
  "/assets/css/tailwind-built.css",
  "/assets/js/performance-optimizer.js",
  "/assets/js/accessibility-enhancer.js",
  "/assets/js/unified-theme-manager.js",
  "/assets/js/cdn-fallbacks.js",
  "/assets/js/lazy-quiz-loader.js",
  "/assets/js/quiz.js",
  "/assets/images/2-APGI-Framework-Diagram.png",
  "/assets/images/2-APGI-Framework-Diagram.webp",
  "/assets/images/APGI-Framework-Diagram.svg",
  "/favicon.svg",
  "/favicon.ico",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error("[SW] Failed to cache assets:", error);
      }),
  );

  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log("[SW] Deleting old cache:", name);
            return caches.delete(name);
          }),
      );
    }),
  );

  // Claim clients immediately
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip external requests
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) {
        // Fetch fresh version in background (stale-while-revalidate)
        fetch(event.request)
          .then((fetchResponse) => {
            if (fetchResponse.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, fetchResponse.clone());
              });
            }
          })
          .catch(() => {
            // Ignore network errors when updating cache
          });

        return response;
      }

      // Fetch from network and cache
      return fetch(event.request)
        .then((fetchResponse) => {
          if (
            !fetchResponse ||
            fetchResponse.status !== 200 ||
            fetchResponse.type !== "basic"
          ) {
            return fetchResponse;
          }

          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return fetchResponse;
        })
        .catch((error) => {
          console.error("[SW] Fetch failed:", error);
          // Return offline fallback if available
          if (event.request.mode === "navigate") {
            return caches.match("/Home.html");
          }
          throw error;
        });
    }),
  );
});
