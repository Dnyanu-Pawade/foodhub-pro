import { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import api from '@/services/api'
import toast from 'react-hot-toast'

export default function OwnerAnalyticsPage() {
  const [restaurants, setRestaurants] = useState([])
  const [selected,    setSelected]    = useState(null)
  const [stats,       setStats]       = useState(null)
  const [days,        setDays]        = useState(7)
  const [loading,     setLoading]     = useState(false)
  const revenueRef = useRef(null)
  const itemsRef   = useRef(null)
  const revenueChart = useRef(null)
  const itemsChart   = useRef(null)

  useEffect(() => {
    api.get('/owner/restaurants').then(r => {
      setRestaurants(r.data)
      if (r.data.length > 0) setSelected(r.data[0])
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    api.get(`/owner/analytics/${selected.id}?days=${days}`)
      .then(r => { setStats(r.data); setLoading(false) })
      .catch(() => { toast.error('Failed to load analytics'); setLoading(false) })
  }, [selected, days])

  useEffect(() => {
    if (!stats || !revenueRef.current) return
    import('chart.js').then(({ Chart, CategoryScale, LinearScale, BarElement,
                               LineElement, PointElement, Tooltip, Legend,
                               BarController, LineController }) => {
      Chart.register(CategoryScale, LinearScale, BarElement, LineElement,
                     PointElement, Tooltip, Legend, BarController, LineController)

      if (revenueChart.current) revenueChart.current.destroy()
      revenueChart.current = new Chart(revenueRef.current, {
        type: 'bar',
        data: {
          labels: Object.keys(stats.dailyRevenue).map(d => d.slice(5)),
          datasets: [{
            label: 'Revenue (₹)',
            data: Object.values(stats.dailyRevenue).map(Number),
            backgroundColor: '#f97316cc',
            borderColor: '#f97316',
            borderWidth: 2,
            borderRadius: 6,
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      })

      if (itemsRef.current && stats.topItems.length > 0) {
        if (itemsChart.current) itemsChart.current.destroy()
        itemsChart.current = new Chart(itemsRef.current, {
          type: 'bar',
          data: {
            labels: stats.topItems.map(i => i.name),
            datasets: [{
              label: 'Orders',
              data: stats.topItems.map(i => i.count),
              backgroundColor: ['#f97316','#fb923c','#fdba74','#fed7aa','#ffedd5'],
              borderRadius: 6,
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            plugins: { legend: { display: false } },
          }
        })
      }
    })
    return () => {
      revenueChart.current?.destroy()
      itemsChart.current?.destroy()
    }
  }, [stats])

  const STAT_CARDS = stats ? [
    { label: 'Today Orders',   value: stats.todayOrders,    color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: "Today's Revenue", value: `₹${Number(stats.todayRevenue).toFixed(0)}`, color: 'text-primary', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { label: 'Total Orders',   value: stats.totalOrders,    color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { label: 'Total Revenue',  value: `₹${Number(stats.totalRevenue).toFixed(0)}`, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Pending',        value: stats.pendingOrders,  color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { label: 'Acceptance Rate', value: `${stats.acceptanceRate}%`, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ] : []

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold dark:text-white">Restaurant Analytics</h1>
        <div className="flex gap-2">
          {restaurants.length > 1 && restaurants.map(r => (
            <button key={r.id} onClick={() => setSelected(r)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border
                      ${selected?.id === r.id ? 'bg-primary text-white border-primary' : 'border-gray-200 dark:border-gray-600 dark:text-gray-300'}`}>
              {r.name}
            </button>
          ))}
          {[7, 14, 30].map(d => (
            <button key={d} onClick={() => setDays(d)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border
                      ${days === d ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-200 dark:border-gray-600 dark:text-gray-300'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[...Array(6)].map((_, i) => <div key={i} className="card animate-pulse h-20 bg-gray-100 dark:bg-gray-700" />)}
        </div>
      ) : stats && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {STAT_CARDS.map(c => (
              <div key={c.label} className={`card ${c.bg}`}>
                <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Revenue chart */}
            <div className="card">
              <h2 className="font-semibold mb-4 dark:text-white">Daily Revenue (Last {days} days)</h2>
              <canvas ref={revenueRef} />
            </div>

            {/* Top items */}
            <div className="card">
              <h2 className="font-semibold mb-4 dark:text-white">Top Selling Items</h2>
              {stats.topItems.length > 0
                ? <canvas ref={itemsRef} />
                : <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
              }
            </div>
          </div>

          {/* Peak hours heatmap */}
          <div className="card">
            <h2 className="font-semibold mb-4 dark:text-white">Peak Hours</h2>
            <div className="grid grid-cols-12 gap-1">
              {Array.from({ length: 24 }, (_, h) => {
                const count = stats.peakHours[h] || 0
                const max   = Math.max(...Object.values(stats.peakHours), 1)
                const intensity = Math.round((count / max) * 9)
                const bg = intensity === 0 ? 'bg-gray-100 dark:bg-gray-700'
                         : intensity < 3   ? 'bg-orange-100'
                         : intensity < 6   ? 'bg-orange-300'
                         : intensity < 8   ? 'bg-orange-500'
                         : 'bg-orange-700'
                return (
                  <div key={h} title={`${h}:00 — ${count} orders`}
                       className={`${bg} rounded aspect-square flex items-center justify-center text-xs font-medium
                         ${intensity > 5 ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                    {h}
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">Darker = more orders. Hover for details.</p>
          </div>
        </>
      )}
    </div>
  )
}
