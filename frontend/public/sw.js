// CarCare Service Worker - PWA Ultra-Moderne 2025
// Version 1.0.0 - Interface Révolutionnaire

const CACHE_NAME = 'carcare-v1.0.0';
const STATIC_CACHE = 'carcare-static-v1.0.0';
const DYNAMIC_CACHE = 'carcare-dynamic-v1.0.0';
const API_CACHE = 'carcare-api-v1.0.0';

// Ressources essentielles à mettre en cache
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/index.css',
  '/assets/index.js',
  // Icons PWA
  '/assets/icon-192x192.png',
  '/assets/icon-512x512.png',
  // Fonts et assets critiques
  '/assets/fonts/inter.woff2',
  // Pages principales
  '/login',
  '/home', 
  '/booking',
  '/tracking'
];

// Stratégies de cache
const CACHE_STRATEGIES = {
  // Cache First: Assets statiques (CSS, JS, images)
  CACHE_FIRST: 'cache-first',
  // Network First: API calls, données dynamiques  
  NETWORK_FIRST: 'network-first',
  // Stale While Revalidate: Balance performance/fraîcheur
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  // Network Only: Données sensibles (auth, paiements)
  NETWORK_ONLY: 'network-only'
};

// Configuration des patterns d'URL
const URL_PATTERNS = {
  api: /^https:\/\/.*\.supabase\.co\/rest\/v1\//,
  auth: /^https:\/\/.*\.supabase\.co\/auth\/v1\//,
  storage: /^https:\/\/.*\.supabase\.co\/storage\/v1\//,
  static: /\.(css|js|png|jpg|jpeg|svg|woff2?|ttf|eot)$/,
  pages: /\/(login|home|booking|tracking|history)$/
};

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('🚀 CarCare SW: Installation démarrée');
  
  event.waitUntil(
    Promise.all([
      // Cache les ressources essentielles
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 CarCare SW: Mise en cache des ressources essentielles');
        return cache.addAll(CORE_ASSETS);
      }),
      // Skip waiting pour activation immédiate
      self.skipWaiting()
    ])
  );
});

// Activation du Service Worker  
self.addEventListener('activate', (event) => {
  console.log('✨ CarCare SW: Activation en cours');
  
  event.waitUntil(
    Promise.all([
      // Nettoyage des anciens caches
      cleanupOldCaches(),
      // Claim immédiat de tous les clients
      self.clients.claim()
    ])
  );
});

// Gestion des requêtes avec stratégies avancées
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore les requêtes non-HTTP
  if (!request.url.startsWith('http')) return;

  // Stratégie basée sur le type de ressource
  if (URL_PATTERNS.static.test(url.pathname)) {
    // Assets statiques: Cache First
    event.respondWith(handleCacheFirst(request, STATIC_CACHE));
  } else if (URL_PATTERNS.api.test(url.href)) {
    // API Supabase: Network First avec fallback
    event.respondWith(handleNetworkFirst(request, API_CACHE));
  } else if (URL_PATTERNS.auth.test(url.href)) {
    // Authentification: Network Only (sécurité)
    event.respondWith(handleNetworkOnly(request));
  } else if (URL_PATTERNS.storage.test(url.href)) {
    // Stockage: Stale While Revalidate
    event.respondWith(handleStaleWhileRevalidate(request, DYNAMIC_CACHE));
  } else if (URL_PATTERNS.pages.test(url.pathname) || url.pathname === '/') {
    // Pages de l'app: Cache avec fallback vers index.html (SPA)
    event.respondWith(handlePageRequest(request));
  } else {
    // Autres ressources: Network First
    event.respondWith(handleNetworkFirst(request, DYNAMIC_CACHE));
  }
});

// Stratégie Cache First - Performance maximale
async function handleCacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log(`💾 Cache hit: ${request.url}`);
      return cachedResponse;
    }

    console.log(`🌐 Cache miss, fetching: ${request.url}`);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Cache First error:', error);
    return new Response('Ressource non disponible hors ligne', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Stratégie Network First - Données fraîches prioritaires
async function handleNetworkFirst(request, cacheName) {
  try {
    console.log(`🌐 Network first: ${request.url}`);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log(`💾 Network failed, trying cache: ${request.url}`);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response(JSON.stringify({ 
      error: 'Données non disponibles hors ligne',
      offline: true 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Stratégie Network Only - Sécurité maximale
async function handleNetworkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Connexion requise pour cette action',
      requiresOnline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Stratégie Stale While Revalidate - Balance optimale
async function handleStaleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Fetch en arrière-plan pour mise à jour
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  // Retourne immédiatement le cache si disponible
  return cachedResponse || fetchPromise;
}

// Gestion des pages SPA
async function handlePageRequest(request) {
  try {
    // Essaie d'abord le réseau
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('🌐 Network failed for page, using cache');
  }
  
  // Fallback vers le cache ou index.html pour SPA
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Fallback ultime vers index.html pour SPA routing
  return cache.match('/index.html') || cache.match('/');
}

// Nettoyage des anciens caches
async function cleanupOldCaches() {
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
  const cacheNames = await caches.keys();
  
  return Promise.all(
    cacheNames
      .filter(name => !currentCaches.includes(name))
      .map(name => {
        console.log(`🗑️ Suppression ancien cache: ${name}`);
        return caches.delete(name);
      })
  );
}

// Gestion des messages depuis l'app
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_URLS':
      cacheUrls(payload.urls);
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches();
      break;
      
    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0].postMessage(status);
      });
      break;
  }
});

// Cache des URLs à la demande
async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  return cache.addAll(urls);
}

// Nettoyage complet des caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(cacheNames.map(name => caches.delete(name)));
}

// Statut des caches
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    status[name] = keys.length;
  }
  
  return status;
}

// Gestion de la synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

// Synchronisation des données en attente
async function handleBackgroundSync() {
  console.log('🔄 CarCare SW: Synchronisation en arrière-plan');
  // Ici vous pouvez implémenter la synchronisation des réservations,
  // mises à jour de statut, etc. quand la connexion revient
}

// Gestion des notifications push
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/assets/icon-192x192.png',
    badge: '/assets/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: data.data,
    actions: [
      {
        action: 'view',
        title: 'Voir les détails',
        icon: '/assets/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Ignorer',
        icon: '/assets/action-dismiss.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Gestion des clics sur notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

console.log('🚀 CarCare Service Worker - Interface Révolutionnaire 2025 chargé');