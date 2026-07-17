import { useEffect, useState, useRef } from 'react'
import api from '@/services/api'

export default function FinanceDashboard() {
  const [stats, setStats]     = useState(null)
  const [month, setMonth]     = useState(() => new Date().toISOString().slice(0, 7))
  const [report, setReport]   = useState(null)
  const [tab, setTab]         = useState('overview')
  const [refunds, setRefunds] = useState([])
  const chartRef = useRef(null)
  const chartObj = useRef(null)

  useEffect(() => {
    api.get('/admin/analytics/dashboard').then(r => setStats(r.data)).catch(() => {})
    api.get('/admin/finance/refunds').then(r => setRefunds(r.data)).catch(() => setRefunds([]))
  }, [])

  useEffect(() => {
    api.get(`/admin/finance/monthly-report?month=${month}`).then(r => setReport(r.data)).catch(() => setReport(null))
  }, [month])

  useEffect(() => {
    if (!report?.dailyRevenue || !chartRef.current) return
    import('chart.js').then(({ Chart, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend, LineController }) => {
      Chart.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend, LineController)
      if (chartObj.current) chartObj.current.destroy()
      chartObj.current = new Chart(chartRef.current, {
        type: 'line',
        data: {
          labels: Object.keys(report.dailyRevenue).map(d => d.slice(8)),
          datasets: [{
            label: 'Revenue (₹)',
            data: Object.values(report.dailyRevenue).map(Number),
            borderColor: '#f97316', backgroundColor: '#f9731620',
            tension: 0.4, fill: true, pointRadius: 3,
          }]
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
      })
    })
    return () => chartObj.current?.destroy()
  }, [report])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold dark:text-white">💰 Finance Dashboard</h1>
        <input type="month" className="input" value={month} onChange={e => setMonth(e.target.value)} />
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Revenue', value: `₹${Number(stats.totalRevenue || 0).toFixed(0)}`, color: 'text-green-600' },
            { label: 'Total Orders', value: stats.totalOrders, color: 'text-blue-600' },
            { label: 'Restaurants', value: stats.totalRestaurants, color: 'text-purple-600' },
            { label: 'Pending Payouts', value: stats.pendingPayouts || 0, color: 'text-orange-600' },
          ].map(s => (
            <div key={s.label} className="card text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {['overview','gst','refunds','statements'].map(t => (
          <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-primary text-white' : 'bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white'}`}>
            {t === 'gst' ? 'GST Report' : t === 'statements' ? 'Statements' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && report && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Gross Revenue', value: `₹${Number(report.grossRevenue || 0).toFixed(2)}`, color: 'text-green-600' },
              { label: 'Platform Commission', value: `₹${Number(report.platformCommission || 0).toFixed(2)}`, color: 'text-primary' },
              { label: 'Restaurant Payouts', value: `₹${Number(report.restaurantPayouts || 0).toFixed(2)}`, color: 'text-blue-600' },
              { label: 'Delivery Payouts', value: `₹${Number(report.deliveryPayouts || 0).toFixed(2)}`, color: 'text-indigo-600' },
              { label: 'Total Refunds', value: `₹${Number(report.totalRefunds || 0).toFixed(2)}`, color: 'text-red-600' },
              { label: 'Net Revenue', value: `₹${Number(report.netRevenue || 0).toFixed(2)}`, color: 'text-emerald-600' },
            ].map(s => (
              <div key={s.label} className="card">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="card">
            <h2 className="font-semibold mb-4 dark:text-white">Daily Revenue — {month}</h2>
            <canvas ref={chartRef} />
          </div>
        </div>
      )}

      {tab === 'gst' && report && (
        <div className="card">
          <h2 className="font-semibold mb-4 dark:text-white">GST Summary — {month}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[
              { label: 'Taxable Amount', value: `₹${Number(report.taxableAmount || 0).toFixed(2)}` },
              { label: 'CGST (2.5%)', value: `₹${Number(report.cgst || 0).toFixed(2)}` },
              { label: 'SGST (2.5%)', value: `₹${Number(report.sgst || 0).toFixed(2)}` },
              { label: 'Total GST', value: `₹${Number((report.cgst || 0) + (report.sgst || 0)).toFixed(2)}` },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-xl font-bold dark:text-white">{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400">GST Rate: 5% (2.5% CGST + 2.5% SGST) on food orders as per Indian tax law.</p>
        </div>
      )}

      {tab === 'refunds' && (
        <div className="space-y-3">
          {refunds.length === 0 && <div className="text-center py-10 text-gray-400">No refunds this month</div>}
          {refunds.map(r => (
            <div key={r.id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium dark:text-white">Order #{r.orderId} — {r.customerName}</p>
                <p className="text-sm text-gray-500">{r.reason} • {new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-red-600">-₹{Number(r.amount).toFixed(2)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'statements' && (
        <div className="card">
          <h2 className="font-semibold mb-4 dark:text-white">Monthly Statement — {month}</h2>
          {report ? (
            <table className="w-full text-sm">
              <tbody className="divide-y dark:divide-gray-700">
                {[
                  ['Gross Revenue', report.grossRevenue, 'text-green-600'],
                  ['Platform Commission (15%)', report.platformCommission, 'text-primary'],
                  ['Restaurant Payouts', report.restaurantPayouts, 'text-blue-600'],
                  ['Delivery Partner Payouts', report.deliveryPayouts, 'text-indigo-600'],
                  ['Refunds Issued', report.totalRefunds, 'text-red-600'],
                  ['Net Platform Revenue', report.netRevenue, 'text-emerald-700 font-bold'],
                ].map(([label, val, cls]) => (
                  <tr key={label}>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{label}</td>
                    <td className={`py-3 text-right ${cls}`}>₹{Number(val || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="text-gray-400 text-center py-8">No data for {month}</p>}
          <button onClick={() => window.print()} className="btn-outline mt-4 text-sm">🖨️ Print Statement</button>
        </div>
      )}
    </div>
  )
}
