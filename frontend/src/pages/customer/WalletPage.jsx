import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { fetchWallet } from '@/features/wallet/walletSlice'
import { FiArrowUpRight, FiArrowDownLeft, FiGift, FiPlus } from 'react-icons/fi'
import api from '@/services/api'
import toast from 'react-hot-toast'

const TX_ICONS = {
  CREDIT:          <FiArrowDownLeft className="text-green-500" />,
  DEBIT:           <FiArrowUpRight  className="text-red-500" />,
  CASHBACK_CREDIT: <FiGift          className="text-yellow-500" />,
  CASHBACK_UNLOCK: <FiGift          className="text-green-500" />,
  REFUND:          <FiArrowDownLeft className="text-blue-500" />,
}

const TOPUP_AMOUNTS = [100, 200, 500, 1000]

function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export default function WalletPage() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { balance, pendingCashback, transactions, loading } = useSelector(s => s.wallet)
  const [topupAmount, setTopupAmount] = useState(200)
  const [topping, setTopping] = useState(false)

  useEffect(() => { dispatch(fetchWallet()) }, [])

  const handleTopup = async () => {
    setTopping(true)
    try {
      const { data } = await api.post(`/payments/wallet/topup/initiate?amount=${topupAmount}`)

      // Simulate mode — skip Razorpay SDK
      if (data.keyId === 'simulate') {
        await api.post('/payments/wallet/topup/verify', {
          razorpayOrderId:   data.razorpayOrderId,
          razorpayPaymentId: 'sim_pay_' + Date.now(),
          razorpaySignature: 'simulated',
        })
        toast.success(`₹${topupAmount} added to wallet! (simulate mode)`)
        dispatch(fetchWallet())
        setTopping(false)
        return
      }

      const ok = await loadRazorpay()
      if (!ok) { toast.error('Razorpay failed to load'); return }
      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: topupAmount * 100,
        currency: 'INR',
        order_id: data.razorpayOrderId,
        name: 'FoodHub Pro Wallet',
        description: `Add ₹${topupAmount} to wallet`,
        handler: async (response) => {
          try {
            await api.post('/payments/wallet/topup/verify', {
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature:  response.razorpay_signature,
            })
            toast.success(`₹${topupAmount} added to wallet!`)
            dispatch(fetchWallet())
          } catch { toast.error('Verification failed') }
        },
        modal: { ondismiss: () => toast('Top-up cancelled') },
      })
      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Top-up failed')
    } finally { setTopping(false) }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('my_wallet')}</h1>

      {/* Balance cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-primary to-orange-600 text-white">
          <p className="text-sm opacity-80">{t('balance')}</p>
          <p className="text-3xl font-bold mt-1">₹{Number(balance).toFixed(2)}</p>
          <p className="text-xs opacity-70 mt-2">Use at checkout</p>
        </div>
        <div className="card bg-gradient-to-br from-yellow-400 to-yellow-600 text-white">
          <p className="text-sm opacity-80">{t('pending_cashback')}</p>
          <p className="text-3xl font-bold mt-1">₹{Number(pendingCashback).toFixed(2)}</p>
          <p className="text-xs opacity-70 mt-2">Unlocks in 7 days</p>
        </div>
      </div>

      {/* Top-up */}
      <div className="card mb-6">
        <h2 className="font-semibold mb-3 flex items-center gap-2"><FiPlus /> {t('add_money')}</h2>
        <div className="flex gap-2 mb-3 flex-wrap">
          {TOPUP_AMOUNTS.map(amt => (
            <button key={amt} onClick={() => setTopupAmount(amt)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors
                      ${topupAmount === amt ? 'bg-primary text-white border-primary' : 'border-gray-200'}`}>
              ₹{amt}
            </button>
          ))}
          <input type="number" className="input w-28 text-sm" placeholder="Custom"
                 value={topupAmount} onChange={e => setTopupAmount(Number(e.target.value))} />
        </div>
        <button onClick={handleTopup} disabled={topping || topupAmount < 1}
                className="btn-primary w-full">
          {topping ? 'Processing...' : `Add ₹${topupAmount} to Wallet`}
        </button>
        <p className="text-xs text-gray-400 mt-2 text-center">
          💡 Simulate mode active — money added instantly, no real payment
        </p>
      </div>

      {/* Transactions */}
      <h2 className="font-semibold mb-3">{t('transaction_history')}</h2>
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="card animate-pulse h-14 bg-gray-100" />)}
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-10 text-gray-400">{t('no_transactions')}</div>
      ) : (
        <div className="space-y-2">
          {transactions.map(tx => (
            <div key={tx.id} className="card flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center">
                {TX_ICONS[tx.type] || <FiArrowDownLeft />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{tx.description}</p>
                <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className={`font-semibold text-sm
                  ${['CREDIT','CASHBACK_CREDIT','CASHBACK_UNLOCK','REFUND'].includes(tx.type)
                    ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'DEBIT' ? '-' : '+'}₹{Number(tx.amount).toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">Bal: ₹{Number(tx.balanceAfter).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
