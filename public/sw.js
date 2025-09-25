/**
 * Service Worker for Deadlock Analytics PWA
 * Provides offline functionality and caching
 */

const CACHE_NAME = 'deadlock-analytics-v1';
const STATIC_CACHE_URLS = [
    '/',
    '/index.html',
    '/js/mobile/PlatformOptimizer.js',
    '/js/mobile/ViewportManager.js',
    '/js/mobile/MobileLayoutController.js',
    '/js/mobile/mobile-layout-styles.css',
    '/js/mobile/mobile-form-styles.css',
    '/js/mobile/mobile-navigation-styles.css',
    '/js/mobile/mobile-accessibility-styles.css',
    '/manifest.json'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching static resources');
                return cache.addAll(STATIC_CACHE_URLS.map(url => new Request(url, {
                    cache: 'reload'
                })));
            })
            .catch((error) => {
                console.error('Cache installation failed:', error);
            })
    );
    
    // Force activation of new service worker
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Take control of all pages immediately
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip external requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached version if available
                if (cachedResponse) {
                    // For HTML files, try network first for fresh content
                    if (event.request.destination === 'document') {
                        return fetch(event.request)
                            .then((networkResponse) => {
                                // Update cache with fresh content
                                if (networkResponse.ok) {
                                    const responseClone = networkResponse.clone();
                                    caches.open(CACHE_NAME)
                                        .then((cache) => {
                                            cache.put(event.request, responseClone);
                                        });
                                }
                                return networkResponse;
                            })
                            .catch(() => {
                                // Network failed, return cached version
                                return cachedResponse;
                            });
                    }
                    
                    return cachedResponse;
                }

                // Not in cache, try network
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Don't cache non-successful responses
                        if (!networkResponse.ok) {
                            return networkResponse;
                        }

                        // Clone response for caching
                        const responseClone = networkResponse.clone();
                        
                        // Cache the response for future use
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseClone);
                            });

                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('Fetch failed:', error);
                        
                        // Return offline page for navigation requests
                        if (event.request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                        
                        throw error;
                    });
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('Background sync triggered:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Handle background sync tasks
            handleBackgroundSync()
        );
    }
});

// Push notifications (if needed in future)
self.addEventListener('push', (event) => {
    console.log('Push notification received:', event);
    
    const options = {
        body: event.data ? event.data.text() : 'New update available',
        icon: '/manifest-icon-192.png',
        badge: '/manifest-icon-96.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'View Update',
                icon: '/images/checkmark.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/images/xmark.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Deadlock Analytics', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        // Open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Handle background sync tasks
async function handleBackgroundSync() {
    try {
        // Sync any pending data when back online
        console.log('Performing background sync...');
        
        // Add your background sync logic here
        // For example: sync user preferences, analytics data, etc.
        
        return Promise.resolve();
    } catch (error) {
        console.error('Background sync failed:', error);
        throw error;
    }
}

// Message handling from main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker received message:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    console.log('Periodic sync triggered:', event.tag);
    
    if (event.tag === 'content-sync') {
        event.waitUntil(
            // Perform periodic sync tasks
            handlePeriodicSync()
        );
    }
});

async function handlePeriodicSync() {
    try {
        console.log('Performing periodic sync...');
        
        // Add periodic sync logic here
        // For example: update cached data, check for app updates, etc.
        
        return Promise.resolve();
    } catch (error) {
        console.error('Periodic sync failed:', error);
        throw error;
    }
}