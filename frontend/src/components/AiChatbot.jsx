import { useState, useRef, useEffect } from 'react'
import api from '@/services/api'

const QUICK_REPLIES = ['Track my order', 'Cancel order', 'Refund status', 'Best restaurants near me', 'Apply coupon']

const BOT_RESPONSES = {
  'track': 'Go to **Orders** page to track your live order with GPS. 📍',
  'cancel': 'You can cancel an order within 2 minutes of placing it from the **Orders** page.',
  'refund': 'Refunds are processed within 5-7 business days to your original payment method.',
  'coupon': 'Try codes: **FLAT50** (50% off), **FREEDEL** (free delivery), **WELCOME50** (first order).',
  'restaurant': 'Browse restaurants on the **Home** page. Use filters for cuisine, rating, and Open Now! 🍽️',
  'default': "I'm here to help! You can ask me about orders, refunds, coupons, or restaurants. 😊",
}

function getBotReply(msg) {
  const m = msg.toLowerCase()
  if (m.includes('track') || m.includes('order status')) return BOT_RESPONSES.track
  if (m.includes('cancel')) return BOT_RESPONSES.cancel
  if (m.includes('refund')) return BOT_RESPONSES.refund
  if (m.includes('coupon') || m.includes('discount') || m.includes('offer')) return BOT_RESPONSES.coupon
  if (m.includes('restaurant') || m.includes('food') || m.includes('near')) return BOT_RESPONSES.restaurant
  return BOT_RESPONSES.default
}

export default function AiChatbot() {
  const [open, setOpen]       = useState(false)
  const [messages, setMessages] = useState([{ from: 'bot', text: "Hi! 👋 I'm FoodBot. How can I help you today?" }])
  const [input, setInput]     = useState('')
  const [typing, setTyping]   = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    setMessages(m => [...m, { from: 'user', text: msg }])
    setTyping(true)

    // Try AI endpoint first, fallback to local
    try {
      const { data } = await api.post('/ai/chat', { message: msg })
      setTimeout(() => {
        setTyping(false)
        setMessages(m => [...m, { from: 'bot', text: data.reply }])
      }, 600)
    } catch {
      setTimeout(() => {
        setTyping(false)
        setMessages(m => [...m, { from: 'bot', text: getBotReply(msg) }])
      }, 800)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(!open)}
              className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform"
              aria-label="Chat with FoodBot">
        {open ? '✕' : '🤖'}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
             style={{ height: '420px' }}>
          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="text-white font-semibold text-sm">FoodBot</p>
              <p className="text-orange-100 text-xs">AI Assistant • Always online</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                  m.from === 'user'
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-2xl rounded-bl-sm">
                  <span className="flex gap-1">
                    {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto">
            {QUICK_REPLIES.map(q => (
              <button key={q} onClick={() => send(q)}
                      className="shrink-0 text-xs px-2.5 py-1 border border-primary text-primary rounded-full hover:bg-primary hover:text-white transition-colors">
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t dark:border-gray-700 flex gap-2">
            <input className="input flex-1 text-sm py-2" placeholder="Ask me anything..."
                   value={input} onChange={e => setInput(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && send()} />
            <button onClick={() => send()} className="btn-primary px-3 py-2 text-sm">Send</button>
          </div>
        </div>
      )}
    </>
  )
}
