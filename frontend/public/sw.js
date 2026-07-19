const CACHE = 'foodhub-v7'
const STATIC = ['/offline.html', '/manifest.json', '/favicon.svg']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)).catch(() => {}))
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
  const url = e.request.url

  // Never intercept: non-GET, API, WebSocket, cross-origin
  if (e.request.method !== 'GET') return
  if (url.includes('/api/')) return
  if (url.includes('/ws')) return
  if (!url.startsWith(self.location.origin)) return

  // Navigation requests (HTML pages) — always network-first, fallback to /index.html
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match('/index.html').then(r => r || caches.match('/offline.html'))
      )
    )
    return
  }

  // Static assets (JS/CSS/images) — cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()))
        }
        return res
      }).catch(() => new Response('', { status: 503 }))
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
