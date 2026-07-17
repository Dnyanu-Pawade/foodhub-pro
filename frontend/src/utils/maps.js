// Loads Google Maps JS API once and resolves when ready
let gmapsPromise = null

export function loadGoogleMaps() {
  if (gmapsPromise) return gmapsPromise
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY
  if (!key || key.startsWith('AIzaSyXXX')) {
    gmapsPromise = Promise.resolve(null)
    return gmapsPromise
  }
  gmapsPromise = new Promise(resolve => {
    if (window.google?.maps) { resolve(window.google.maps); return }
    const cb = '__gmaps_cb_' + Date.now()
    window[cb] = () => { resolve(window.google.maps); delete window[cb] }
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=${cb}`
    s.async = true
    s.onerror = () => { resolve(null); delete window[cb] }
    document.head.appendChild(s)
  })
  return gmapsPromise
}

// Returns tile layer URL — Google Maps satellite or OSM
export function getTileLayer() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY
  if (key && !key.startsWith('AIzaSyXXX')) {
    // Use Google Maps road tiles via Maps Static (requires billing)
    // Fallback to OSM for Leaflet (Google Maps JS API used separately)
  }
  return {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }
}

// Geocode using Google if available, else Nominatim
export async function geocodeAddress(address) {
  const gmaps = await loadGoogleMaps()
  if (gmaps) {
    return new Promise(resolve => {
      new gmaps.Geocoder().geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const loc = results[0].geometry.location
          resolve([loc.lat(), loc.lng()])
        } else resolve(null)
      })
    })
  }
  // Fallback: Nominatim
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`)
    const d = await r.json()
    if (d.length) return [parseFloat(d[0].lat), parseFloat(d[0].lon)]
  } catch {}
  return null
}
