import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { fetchLoyalty } from '@/features/loyalty/loyaltySlice'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { FiStar, FiGift, FiArrowUpRight, FiArrowDownLeft } from 'react-icons/fi'

export default function LoyaltyPage() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { availablePoints, totalPoints, worthRupees, history, loading } = useSelector(s => s.loyalty)
  const [redeemPoints, setRedeemPoints] = useState(50)
  const [redeeming, setRedeeming] = useState(false)

  useEffect(() => { dispatch(fetchLoyalty()) }, [])

  const handleRedeem = async () => {
    if (redeemPoints < 10) { toast.error('Minimum 10 points'); return }
    if (redeemPoints > availablePoints) { toast.error('Insufficient points'); return }
    setRedeeming(true)
    try {
      const { data } = await api.post(`/loyalty/redeem?points=${redeemPoints}`)
      toast.success(`Redeemed ${redeemPoints} pts = ₹${data.discountAmount} wallet credit!`)
      dispatch(fetchLoyalty())
    } catch (err) {
      toast.error(err.response?.data?.message || 'Redemption failed')
    } finally { setRedeeming(false) }
  }

  const QUICK_REDEEM = [10, 25, 50, 100]

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white flex items-center gap-2">
        <FiStar className="text-yellow-500" /> {t('loyalty_points')}
      </h1>

      {/* Balance cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
          <p className="text-sm opacity-80">{t('available_points')}</p>
          <p className="text-4xl font-bold mt-1">{availablePoints}</p>
          <p className="text-xs opacity-70 mt-1">Worth ₹{worthRupees.toFixed(2)}</p>
        </div>
        <div className="card bg-gradient-to-br from-gray-700 to-gray-900 text-white">
          <p className="text-sm opacity-80">{t('total_earned')}</p>
          <p className="text-4xl font-bold mt-1">{totalPoints}</p>
          <p className="text-xs opacity-70 mt-1">All time points</p>
        </div>
      </div>

      {/* How it works */}
      <div className="card mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
        <h2 className="font-semibold mb-2 text-yellow-800 dark:text-yellow-300">{t('how_it_works')}</h2>
        <div className="grid grid-cols-3 gap-3 text-center text-xs text-yellow-700 dark:text-yellow-400">
          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-2xl mb-1">🛒</p>
            <p>Earn 1 pt per ₹10 spent</p>
          </div>
          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-2xl mb-1">⭐</p>
            <p>1 point = ₹0.50 value</p>
          </div>
          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-2xl mb-1">🎁</p>
            <p>Redeem min 10 points</p>
          </div>
        </div>
      </div>

      {/* Redeem */}
      {availablePoints >= 10 && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-3 dark:text-white flex items-center gap-2">
            <FiGift className="text-primary" /> {t('redeem')}
          </h2>
          <div className="flex gap-2 mb-3 flex-wrap">
            {QUICK_REDEEM.filter(p => p <= availablePoints).map(p => (
              <button key={p} onClick={() => setRedeemPoints(p)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors
                        ${redeemPoints === p ? 'bg-primary text-white border-primary' : 'border-gray-200 dark:border-gray-600 dark:text-gray-300'}`}>
                {p} pts = ₹{(p * 0.5).toFixed(0)}
              </button>
            ))}
            <input type="number" className="input w-24 text-sm" min={10} max={availablePoints}
                   value={redeemPoints} onChange={e => setRedeemPoints(Number(e.target.value))} />
          </div>
          <button onClick={handleRedeem} disabled={redeeming}
                  className="btn-primary w-full">
            {redeeming ? 'Redeeming...' : `Redeem ${redeemPoints} pts → ₹${(redeemPoints * 0.5).toFixed(2)} wallet credit`}
          </button>
        </div>
      )}

      {/* History */}
      <h2 className="font-semibold mb-3 dark:text-white">{t('points_history')}</h2>
      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => (
          <div key={i} className="card animate-pulse h-12 bg-gray-100 dark:bg-gray-700" />
        ))}</div>
      ) : history.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          Place your first order to start earning points!
        </div>
      ) : (
        <div className="space-y-2">
          {history.map(tx => (
            <div key={tx.id} className="card flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center
                ${tx.type === 'EARN' || tx.type === 'BONUS' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {tx.type === 'EARN' || tx.type === 'BONUS'
                  ? <FiArrowDownLeft size={16} />
                  : <FiArrowUpRight size={16} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium dark:text-white">{tx.description}</p>
                <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className={`font-bold text-sm ${tx.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.points > 0 ? '+' : ''}{tx.points} pts
                </p>
                <p className="text-xs text-gray-400">Balance: {tx.balanceAfter}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
