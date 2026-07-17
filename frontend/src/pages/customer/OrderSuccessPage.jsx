import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

import toast from 'react-hot-toast'

function randomInRange(min, max) { return Math.random() * (max - min) + min }

function Confetti() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
    const pieces = Array.from({ length: 120 }, () => ({
      x: randomInRange(0, canvas.width),
      y: randomInRange(-200, 0),
      r: randomInRange(6, 14),
      d: randomInRange(2, 6),
      color: ['#f97316','#22c55e','#3b82f6','#a855f7','#ec4899','#eab308'][Math.floor(Math.random()*6)],
      tilt: randomInRange(-10, 10),
      tiltSpeed: randomInRange(0.05, 0.15),
      angle: 0,
    }))
    let raf
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pieces.forEach(p => {
        ctx.beginPath()
        ctx.lineWidth = p.r / 2
        ctx.strokeStyle = p.color
        ctx.moveTo(p.x + p.tilt + p.r / 4, p.y)
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4)
        ctx.stroke()
        p.y += p.d
        p.angle += p.tiltSpeed
        p.tilt = Math.sin(p.angle) * 15
        if (p.y > canvas.height) { p.y = -20; p.x = randomInRange(0, canvas.width) }
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    const t = setTimeout(() => cancelAnimationFrame(raf), 4000)
    return () => { cancelAnimationFrame(raf); clearTimeout(t) }
  }, [])
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />
}

export default function OrderSuccessPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { current: order } = useSelector(s => s.order)
  const [show, setShow] = useState(false)

  const orderId = location.state?.orderId || order?.id

  useEffect(() => {
    setTimeout(() => setShow(true), 100)
    if (!orderId) navigate('/')
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <Confetti />
      <div className={`card max-w-md w-full text-center transition-all duration-700
        ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-7xl mb-4 animate-bounce">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Order Placed! 🎉</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          Your order #{orderId} has been placed successfully.
        </p>
        <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-4 py-2 rounded-full text-sm font-semibold mb-6">
          🚕 Estimated delivery: {order?.avgDeliveryTimeMinutes || 30}-{(order?.avgDeliveryTimeMinutes || 30) + 10} mins
        </div>

        {order && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Restaurant</span>
              <span className="font-medium dark:text-white">{order.restaurantName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Items</span>
              <span className="font-medium dark:text-white text-right max-w-[60%]">
                {order.items?.map(i => `${i.itemName} ×${i.quantity}`).join(', ')}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold dark:text-white">Total</span>
              <span className="font-bold text-primary">₹{order.totalAmount}</span>
            </div>
          </div>
        )}

        <div className="flex gap-3 mb-3">
          <button onClick={() => navigate(`/orders/${orderId}`)}
                  className="btn-primary flex-1 py-3">
            Track Order 🛵
          </button>
          <button onClick={() => navigate('/')}
                  className="btn-outline flex-1 py-3">
            Back to Home
          </button>
        </div>
        <button onClick={() => {
          const text = `I just ordered from ${order?.restaurantName || 'a restaurant'} on FoodHub Pro! 🍽️ Order #${orderId}`
          if (navigator.share) navigator.share({ title: 'My FoodHub Order', text })
          else { navigator.clipboard.writeText(text); toast.success('Order details copied!') }
        }} className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors">
          🔗 Share this order
        </button>
      </div>
    </div>
  )
}
