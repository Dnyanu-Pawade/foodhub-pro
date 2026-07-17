import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { FiSend } from 'react-icons/fi'

export default function ChatPage() {
  const { restaurantId } = useParams()
  const { user } = useSelector(s => s.auth)
  const [messages,  setMessages]  = useState([])
  const [input,     setInput]     = useState('')
  const [connected, setConnected] = useState(false)
  const [restName,  setRestName]  = useState('')
  const stompRef  = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    api.get(`/restaurants/${restaurantId}`).then(r => setRestName(r.data.name)).catch(() => {})
    // Load history
    api.get(`/chat/${restaurantId}/history`).then(r => setMessages(r.data || [])).catch(() => {})

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      onConnect: () => {
        setConnected(true)
        client.subscribe(`/topic/chat/${restaurantId}`, msg => {
          setMessages(prev => [...prev, JSON.parse(msg.body)])
        })
        stompRef.current = client
      },
      onDisconnect: () => setConnected(false),
    })
    client.activate()
    return () => client.deactivate()
  }, [restaurantId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    const text = input.trim()
    if (!text || !stompRef.current) return
    stompRef.current.publish({
      destination: `/app/chat/${restaurantId}`,
      body: JSON.stringify({ senderId: user.id, senderName: user.fullName, message: text }),
    })
    setInput('')
  }

  const isMe = (msg) => msg.senderId === user?.id

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div className="card mb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
          {restName?.[0] || '🍽'}
        </div>
        <div className="flex-1">
          <p className="font-semibold dark:text-white">{restName || 'Restaurant'}</p>
          <p className={`text-xs ${connected ? 'text-green-500' : 'text-gray-400'}`}>
            {connected ? '🟢 Connected' : '⚪ Connecting...'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {messages.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">💬</p>
            <p className="text-sm">Start a conversation with the restaurant</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${isMe(msg) ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm
              ${isMe(msg)
                ? 'bg-primary text-white rounded-br-sm'
                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm shadow-sm'}`}>
              {!isMe(msg) && (
                <p className="text-xs font-semibold text-primary mb-1">{msg.senderName}</p>
              )}
              <p>{msg.message}</p>
              {msg.sentAt && (
                <p className={`text-xs mt-1 ${isMe(msg) ? 'text-white/70' : 'text-gray-400'}`}>
                  {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input className="input flex-1" placeholder="Type a message..."
               value={input}
               onChange={e => setInput(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && send()} />
        <button onClick={send} disabled={!connected || !input.trim()}
                className="btn-primary px-4 flex items-center gap-1 disabled:opacity-50">
          <FiSend size={16} />
        </button>
      </div>
    </div>
  )
}
