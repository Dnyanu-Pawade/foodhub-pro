import { useEffect, useState } from 'react'
import api from '@/services/api'

export default function OwnerGstPage() {
  const [restaurants, setRestaurants] = useState([])
  const [selected, setSelected]       = useState(null)
  const [report, setReport]           = useState(null)
  const [month, setMonth]             = useState(() => new Date().toISOString().slice(0, 7))

  useEffect(() => {
    api.get('/owner/restaurants').then(r => {
      setRestaurants(r.data)
      if (r.data.length > 0) setSelected(r.data[0])
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    api.get(`/owner/gst-report?restaurantId=${selected.id}&month=${month}`)
      .then(r => setReport(r.data)).catch(() => setReport(null))
  }, [selected, month])

  const printReport = () => window.print()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold dark:text-white">📊 GST Report</h1>
        <div className="flex gap-2 items-center">
          <input type="month" className="input" value={month} onChange={e => setMonth(e.target.value)} />
          <button onClick={printReport} className="btn-outline">🖨️ Print</button>
        </div>
      </div>

      {restaurants.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {restaurants.map(r => (
            <button key={r.id} onClick={() => setSelected(r)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${selected?.id === r.id ? 'bg-primary text-white' : 'border-gray-200 dark:border-gray-600 dark:text-white'}`}>
              {r.name}
            </button>
          ))}
        </div>
      )}

      {report ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Sales', value: `₹${Number(report.totalSales).toFixed(2)}`, color: 'text-blue-600' },
              { label: 'Taxable Amount', value: `₹${Number(report.taxableAmount).toFixed(2)}`, color: 'text-indigo-600' },
              { label: 'CGST (2.5%)', value: `₹${Number(report.cgst).toFixed(2)}`, color: 'text-orange-600' },
              { label: 'SGST (2.5%)', value: `₹${Number(report.sgst).toFixed(2)}`, color: 'text-primary' },
            ].map(s => (
              <div key={s.label} className="card text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="card">
            <h2 className="font-semibold mb-4 dark:text-white">Monthly Breakdown — {month}</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-2 text-gray-500">Date</th>
                  <th className="text-right py-2 text-gray-500">Orders</th>
                  <th className="text-right py-2 text-gray-500">Sales</th>
                  <th className="text-right py-2 text-gray-500">CGST</th>
                  <th className="text-right py-2 text-gray-500">SGST</th>
                  <th className="text-right py-2 text-gray-500">Total Tax</th>
                </tr>
              </thead>
              <tbody>
                {(report.dailyBreakdown || []).map((row, i) => (
                  <tr key={i} className="border-b dark:border-gray-700 last:border-0">
                    <td className="py-2 dark:text-gray-300">{row.date}</td>
                    <td className="py-2 text-right dark:text-gray-300">{row.orders}</td>
                    <td className="py-2 text-right dark:text-gray-300">₹{Number(row.sales).toFixed(2)}</td>
                    <td className="py-2 text-right dark:text-gray-300">₹{Number(row.cgst).toFixed(2)}</td>
                    <td className="py-2 text-right dark:text-gray-300">₹{Number(row.sgst).toFixed(2)}</td>
                    <td className="py-2 text-right font-medium dark:text-white">₹{Number(row.totalTax).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">📊</p>
          <p>No GST data for {month}</p>
        </div>
      )}
    </div>
  )
}
