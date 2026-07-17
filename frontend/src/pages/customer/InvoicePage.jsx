import { useEffect, useState } from 'react'
import api from '@/services/api'
import { useSelector } from 'react-redux'

export default function InvoicePage({ orderId: propOrderId }) {
  const [order, setOrder]   = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useSelector(s => s.auth)

  const id = propOrderId || new URLSearchParams(window.location.search).get('orderId')

  useEffect(() => {
    if (!id) return
    api.get(`/orders/${id}`).then(r => setOrder(r.data)).finally(() => setLoading(false))
  }, [id])

  const print = () => window.print()

  if (loading) return <div className="text-center py-16 text-gray-400">Loading invoice...</div>
  if (!order) return <div className="text-center py-16 text-gray-400">Order not found</div>

  const gst = Number(order.subtotal) * 0.05
  const total = Number(order.subtotal) + Number(order.deliveryFee) - Number(order.discount || 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h1 className="text-2xl font-bold dark:text-white">🧾 Invoice</h1>
        <button onClick={print} className="btn-primary">🖨️ Print / Save PDF</button>
      </div>

      <div id="invoice" className="card border border-gray-200 print:shadow-none print:border-0">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-4 border-b dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-primary">FoodHub Pro</h2>
            <p className="text-sm text-gray-500">Online Food Delivery Platform</p>
            <p className="text-xs text-gray-400">GSTIN: 27AAAAA0000A1Z5</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg dark:text-white">INVOICE</p>
            <p className="text-sm text-gray-500">#INV-{String(order.id).padStart(6, '0')}</p>
            <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Bill to / From */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium mb-1">Bill To</p>
            <p className="font-medium dark:text-white">{order.customerName}</p>
            <p className="text-sm text-gray-500">{order.deliveryAddress}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium mb-1">Restaurant</p>
            <p className="font-medium dark:text-white">{order.restaurantName}</p>
            <p className="text-sm text-gray-500">Order #{order.id}</p>
            <p className="text-sm text-gray-500">Payment: {order.paymentMethod}</p>
          </div>
        </div>

        {/* Items */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="text-left py-2 text-gray-500">Item</th>
              <th className="text-center py-2 text-gray-500">Qty</th>
              <th className="text-right py-2 text-gray-500">Unit Price</th>
              <th className="text-right py-2 text-gray-500">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, i) => (
              <tr key={i} className="border-b dark:border-gray-700 last:border-0">
                <td className="py-2 dark:text-gray-300">{item.itemName}</td>
                <td className="py-2 text-center dark:text-gray-300">{item.quantity}</td>
                <td className="py-2 text-right dark:text-gray-300">₹{Number(item.unitPrice).toFixed(2)}</td>
                <td className="py-2 text-right dark:text-gray-300">₹{Number(item.totalPrice).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="space-y-1.5 text-sm border-t dark:border-gray-700 pt-4">
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Subtotal</span><span>₹{Number(order.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>CGST (2.5%)</span><span>₹{(gst / 2).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>SGST (2.5%)</span><span>₹{(gst / 2).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Delivery Fee</span><span>₹{Number(order.deliveryFee).toFixed(2)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
              <span>-₹{Number(order.discount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t dark:border-gray-700 dark:text-white">
            <span>Total</span><span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t dark:border-gray-700 text-center text-xs text-gray-400">
          <p>Thank you for ordering with FoodHub Pro! 🍽️</p>
          <p>For support: support@foodhubpro.in | This is a computer-generated invoice.</p>
        </div>
      </div>
    </div>
  )
}
