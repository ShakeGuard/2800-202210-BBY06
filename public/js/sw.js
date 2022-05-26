/**
 * sw.js – Service Worker code
 * Handles offline-accessible resources, that's about it.
 */

// NOTE: This file should be served from https://localhost/sw.js, NOT https://localhost/js/sw.js!
// See https://web.dev/learn/pwa/service-workers/ for a basic guide.

// Cache stuff.
const staticCache = async () => await caches.open("shakeguard-assets-v8");
const baseURL = location.origin;

self.addEventListener("install", evt => {
    evt.waitUntil(
        () => {
        }
    );
});

// Intercept network requests.

/**
 * Offline Routes object; any route we want to have specific offline-only response logic is defined here.
 * @typedef {Function<Request, Response>} Responder
 * @type {string: Responder}
 */
const offlineRoutes = {
    '/login': () => new Response("offline", {status: 200})
};

/**
 *
 * @param {Request} req
 */
function shouldCache(req, res) {
    // Don't cache things that have dynamic templates in them.
    // TODO: make Kits cacheable in some way.
    const templatedPages = new Set([
        '/profile',
        '/dashboard'
    ]);
    const JSONRoutes = new Set([
        '/',
    ]);
    return !(req.headers.has('Cache-Control')
    ||  templatedPages.has(new URL(req.url).pathname)
    ||  JSONRoutes.has(new URL(req.url).pathname)
    || !res.clone().headers.get("Content-Type").includes("application/json"));
}

self.addEventListener('fetch', (e) => {
    e.respondWith((async () => {
        // Check the static asset cache first.
        // Empty-bodied requests should be safe to serve from cache:
        if (e.request.method === "GET" && e.request.body === undefined) {
            const cached = await (await staticCache()).match(e.request);
            if (cached) {
                return cached;
            }

            // Cache is empty, let's see if we can get it from the server:
            // We'll send the response either way, but only cache if it comes with a 200 OK status.
            let response;
            try {
                response = await fetch(e.request);
                if (response.status === 200 && shouldCache(e.request, e.response)) {
                    await (await staticCache()).put(e.request, response.clone());
                }
            } catch (err) {
                // No network, no cache – return bad response.
                return null;
            }
            return response;
        }

        // Nothing else is cached, only GETs with no body.
        // Client is online, so we can fetch stuff:
        if (navigator.onLine) {
            return await fetch(e.request);
        } else {
            // Default response while offline:
            // 503, Service Unavailable.
            const defaultResponder = () => new Response("offline", {status: 503});

            // Route-specific offline responses.
            const url = new URL(e.request.url).pathname;
            const responder = offlineRoutes[url] ?? defaultResponder;
            return responder(e.request);
        }
    })());
});

// Clean up from previous SW installs.
self.addEventListener('activate', (e) => {
    // HACK: Putting all this as data-in-code is a horrible bodge and I hate it. -Katy
    // HACK: This is growing to be untenable, but unfortunately it's 8:34 on the day of the submission so we do what we
    // must.
    e.waitUntil(caches.keys().then((keyList) => {
        staticCache().then(
            cache => {
                // Cache completely-static pages.
                const toCache = [
                    // Login Page:
                    "login",
                    // Resource Pages:
                    "resource_page1",
                    "resource_page2",
                    "resource_page3",
                    "resource_page4",
                    "resource_page5",
                    "resource_page6",
                    "resource",
                    // Scripts:
                    "js/client.js",
                    "js/footer-easter-egg.js",
                    // Sounds:
                    "sounds/easteregg/ding.wav",
                    // Images:
                    "favicon.ico",
                    "images/Resource1.jpg",
                    "images/Resource2.jpg",
                    "images/Resource3.jpg",
                    "images/Resource4.jpg",
                    "images/Resource5.jpg",
                    "images/Resource6.jpg",
                    "images/comp2800_logo.svg",
                    "images/menu-icon-black.svg",
                    "images/ShakeGuard.png",
                    // CSS:
                    "css/all_resource_pages.css",
                    "css/resource.css",
                    "css/card.css",
                    "css/style.css",
                    "css/login.css",
                    "css/buttons.css",
                    "css/header-footer.css",
                    // Web Manifest (? might be bad)
                    "shakeguard.webmanifest",
                ].map(pg => baseURL + '/' + pg)
                .concat([
                    // Stuff that isn't ours:
                    "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200",
                    "https://api.fontshare.com/css?f[]=satoshi@400,700&display=swap",
                    "https://api.fontshare.com/css?f[]=sharpie@700&display=swap",
                    "https://fonts.sandbox.google.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
                ]);

                for (const route of toCache) {
                    console.log(`adding ${route}`);
                    cache.add(route);
                }
            }
        );
    }));
});
