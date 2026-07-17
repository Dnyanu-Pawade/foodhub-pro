const CACHE = 'foodhub-v4'
const STATIC = ['/index.html', '/manifest.json']

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  // Skip non-GET, API calls, WebSocket, cross-origin, and auth endpoints
  if (e.request.method !== 'GET') return
  if (e.request.url.includes('/api/')) return
  if (e.request.url.includes('/ws')) return
  if (!e.request.url.startsWith(self.location.origin)) return

  e.respondWith(
    caches.match(e.request).then(cached => {
      const networkFetch = fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const toCache = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, toCache))
        }
        return res
      }).catch(() => cached || new Response('Offline', { status: 503, statusText: 'Service Unavailable' }))

      return cached || networkFetch
    })
  )
})

self.addEventListener('push', e => {
  const data = e.data?.json() || { title: 'FoodHub Pro', body: 'You have a new notification' }
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
    })
  )
})
