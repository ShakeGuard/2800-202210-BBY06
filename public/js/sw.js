/**
 * sw.js – Service Worker code
 * Handles offline-accessible resources, that's about it.
 */

// NOTE: This file should be served from https://localhost/sw.js, NOT https://localhost/js/sw.js!
// See https://web.dev/learn/pwa/service-workers/ for a basic guide.

// Cache stuff.
const cacheName = "shakeguard-assets-v1"
const baseURL = location.origin;

self.addEventListener("install", evt => {
    evt.waitUntil(
        async () => {
            await caches.open(cacheName)
            .then(cache => {
                const resourcePages = ['resource', 'resource_page1', 'resource_page2', 'resource_page2'];
                cache.addAll(resourcePages.map(pg => bareURL + pg));
            });
        }
    )
});

// Intercept network requests.
self.addEventListener('fetch', (e) => {


    e.respondWith((async () => {
        const r = await caches.match(e.request);
        if (r) { console.log("cached by SW"); return r; }
        let response;
        try {
            response = await fetch(e.request);
            if (response.statusCode === 200) {
                const cache = await caches.open(cacheName);
                cache.put(e.request, response.clone());
            }
        } catch (err) {
            // No network, no cache – return bad response.
            return null;
        }
        return response;
    })());
});

// Clean up from previous SW installs.
self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then((keyList) => {
        return Promise.all(keyList.map((key) => {
            if (key === cacheName) { return; }
            return caches.delete(key);
        }))
    }));
});
