/**
 * sw.js – Service Worker code
 * Handles offline-accessible resources, that's about it.
 */

// NOTE: This file should be served from https://localhost/sw.js, NOT https://localhost/js/sw.js!
// See https://web.dev/learn/pwa/service-workers/ for a basic guide.

// Cache stuff.
const staticCache = async () => await caches.open("shakeguard-assets-v1");
const baseURL = location.origin;

self.addEventListener("install", evt => {
    evt.waitUntil(
        () => {
        }
    );
});

// Intercept network requests.
self.addEventListener('fetch', (e) => {
    e.respondWith((async () => {
        // Check the static asset cache first.
        const r = await (await staticCache()).match(e.request);
        if (r) {
            console.log("cached by SW"); // TODO remove
            return r;
        }

        // Nothing in the static cache, this could be an AJAX thing
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
        Promise.all(keyList.map((key) => {
            return caches.delete(key);
        }));
        caches.open("shakeguard-assets-v1").then(
            cache => {
                // Cache completely-static resource pages.
                const toCache = [
                    "resource_page1",
                    "resource_page2",
                    "resource_page3",
                    "resource_page4",
                    "resource_page5",
                    "resource_page6",
                    "resource"
                ].map(pg => baseURL + '/' + pg);
                cache.addAll(toCache);
                console.log(toCache);
            }
        );
    }));
});
