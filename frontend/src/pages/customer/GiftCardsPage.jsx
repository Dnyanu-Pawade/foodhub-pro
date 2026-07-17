import { useEffect, useState } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'

export default function GiftCardsPage() {
  const [tab, setTab]         = useState('buy')
  const [myCards, setMyCards] = useState([])
  const [amount, setAmount]   = useState(500)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [message, setMessage] = useState('')
  const [redeemCode, setRedeemCode] = useState('')
  const [buying, setBuying]   = useState(false)

  useEffect(() => {
    api.get('/gift-cards/my').then(r => setMyCards(r.data)).catch(() => setMyCards([]))
  }, [])

  const buy = async (e) => {
    e.preventDefault()
    setBuying(true)
    try {
      await api.post('/gift-cards/purchase', { amount, recipientEmail, message })
      toast.success('Gift card sent! 🎁')
      setRecipientEmail(''); setMessage('')
      api.get('/gift-cards/my').then(r => setMyCards(r.data))
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setBuying(false) }
  }

  const redeem = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post('/gift-cards/redeem', { code: redeemCode })
      toast.success(`₹${data.amount} added to your wallet! 🎉`)
      setRedeemCode('')
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid code') }
  }

  const AMOUNTS = [250, 500, 1000, 2000, 5000]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">🎁 Gift Cards</h1>

      <div className="flex gap-2 mb-6">
        {[['buy','🎁 Buy'],['redeem','✅ Redeem'],['my','📋 My Cards']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === k ? 'bg-primary text-white' : 'bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'buy' && (
        <form onSubmit={buy} className="card space-y-4">
          <h2 className="font-semibold dark:text-white">Send a Gift Card</h2>
          <div>
            <p className="text-sm text-gray-500 mb-2">Select Amount</p>
            <div className="flex gap-2 flex-wrap">
              {AMOUNTS.map(a => (
                <button key={a} type="button" onClick={() => setAmount(a)}
                        className={`px-4 py-2 rounded-lg font-medium border ${amount === a ? 'bg-primary text-white border-primary' : 'border-gray-200 dark:border-gray-600 dark:text-white'}`}>
                  ₹{a}
                </button>
              ))}
              <input type="number" className="input w-28" placeholder="Custom" value={amount}
                     onChange={e => setAmount(Number(e.target.value))} />
            </div>
          </div>
          <input className="input" type="email" placeholder="Recipient Email" required value={recipientEmail}
                 onChange={e => setRecipientEmail(e.target.value)} />
          <textarea className="input" placeholder="Personal message (optional)" rows={3} value={message}
                    onChange={e => setMessage(e.target.value)} />

          {/* Preview */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white">
            <p className="text-sm opacity-80">FoodHub Pro Gift Card</p>
            <p className="text-4xl font-bold mt-1">₹{amount}</p>
            {message && <p className="text-sm mt-3 opacity-90 italic">"{message}"</p>}
            <p className="text-xs mt-4 opacity-70">Valid for 1 year • Use on any order</p>
          </div>

          <button type="submit" disabled={buying} className="btn-primary w-full">
            {buying ? 'Processing...' : `🎁 Send Gift Card — ₹${amount}`}
          </button>
        </form>
      )}

      {tab === 'redeem' && (
        <form onSubmit={redeem} className="card space-y-4">
          <h2 className="font-semibold dark:text-white">Redeem a Gift Card</h2>
          <p className="text-sm text-gray-500">Enter the gift card code to add balance to your wallet.</p>
          <input className="input text-center text-xl font-bold tracking-widest uppercase" placeholder="XXXX-XXXX-XXXX"
                 value={redeemCode} onChange={e => setRedeemCode(e.target.value.toUpperCase())} required />
          <button type="submit" className="btn-primary w-full">✅ Redeem Gift Card</button>
        </form>
      )}

      {tab === 'my' && (
        <div className="space-y-3">
          {myCards.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-2">🎁</p><p>No gift cards yet</p>
            </div>
          )}
          {myCards.map(c => (
            <div key={c.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-primary text-xl">₹{c.amount}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${c.redeemed ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                  {c.redeemed ? 'Redeemed' : 'Active'}
                </span>
              </div>
              <p className="text-sm font-mono text-gray-600 dark:text-gray-400">{c.code}</p>
              <p className="text-xs text-gray-400 mt-1">
                {c.sentTo ? `Sent to ${c.sentTo}` : 'Received'} • Expires {new Date(c.expiresAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
