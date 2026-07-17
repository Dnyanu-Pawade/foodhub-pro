import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

let app = null
let messaging = null

function isConfigured() {
  return firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('AIzaSyXXX')
}

export function initFirebase() {
  if (!isConfigured()) return null
  try {
    app = initializeApp(firebaseConfig)
    messaging = getMessaging(app)
    return messaging
  } catch (e) {
    console.warn('Firebase init failed:', e.message)
    return null
  }
}

export async function requestFcmToken() {
  if (!messaging) return null
  try {
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    })
    return token
  } catch (e) {
    console.warn('FCM token failed:', e.message)
    return null
  }
}

export function onFcmMessage(callback) {
  if (!messaging) return () => {}
  return onMessage(messaging, callback)
}
