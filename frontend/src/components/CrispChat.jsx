import { useEffect } from 'react'
import { useSelector } from 'react-redux'

// Get your free Crisp ID at https://crisp.chat (free tier: unlimited chats)
const CRISP_WEBSITE_ID = import.meta.env.VITE_CRISP_ID || ''

export default function CrispChat() {
  const { user } = useSelector(s => s.auth)

  useEffect(() => {
    if (!CRISP_WEBSITE_ID) return

    window.$crisp = []
    window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID

    const s = document.createElement('script')
    s.src = 'https://client.crisp.chat/l.js'
    s.async = true
    document.head.appendChild(s)

    return () => {
      // Cleanup on unmount
      if (window.$crisp) window.$crisp.push(['do', 'chat:hide'])
    }
  }, [])

  // Identify logged-in user to Crisp
  useEffect(() => {
    if (!window.$crisp || !user) return
    window.$crisp.push(['set', 'user:email', [user.email]])
    window.$crisp.push(['set', 'user:nickname', [user.fullName || user.username]])
    if (user.phone) window.$crisp.push(['set', 'user:phone', [user.phone]])
  }, [user])

  return null
}
