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
        if (navigator.onLine || e.request.method !== "GET") {
            return await fetch(e.request);
        }
        const r = await (await staticCache()).match(e.request);
        if (r) {
            return r;
        }

        // Nothing in the static cache, this could be an AJAX thing

        // Okay, check if the server knows what's up and put it in our static asset cache.
        let response;
        try {
            response = await fetch(e.request);
            if (response.status === 200) {
                await (await staticCache()).put(e.request, response.clone());
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
                    "resource",
                    "css/all_resource_pages.css",
                    "images/Resource1.jpg",
                    "images/Resource2.jpg",
                    "images/Resource3.jpg",
                    "images/Resource4.jpg",
                    "images/Resource5.jpg",
                    "images/Resource6.jpg",
                    "css/resource.css",
                    "css/card.css"
                ].map(pg => baseURL + '/' + pg);
                cache.addAll(toCache);
            }
        );
    }));
});
