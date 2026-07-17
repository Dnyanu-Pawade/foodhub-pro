import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '@/services/api'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function AdminAnalyticsPage() {
  const { t } = useTranslation()
  const [gmv, setGmv]                   = useState({})
  const [topRestaurants, setTopRest]    = useState([])
  const [topCustomers, setTopCust]      = useState([])
  const [cityData, setCityData]         = useState({})
  const [days, setDays]                 = useState(30)

  useEffect(() => {
    api.get(`/admin/analytics/gmv?days=${days}`).then(r => setGmv(r.data))
    api.get('/admin/analytics/top-restaurants?limit=10').then(r => setTopRest(r.data))
    api.get('/admin/analytics/top-customers?limit=10').then(r => setTopCust(r.data))
    api.get('/admin/analytics/orders-by-city').then(r => setCityData(r.data))
  }, [days])

  const gmvChart = {
    labels: Object.keys(gmv).map(d => d.slice(5)),
    datasets: [{ label: 'GMV (₹)', data: Object.values(gmv), backgroundColor: '#f97316', borderRadius: 4 }]
  }

  const cityChart = {
    labels: Object.keys(cityData),
    datasets: [{ label: 'Orders', data: Object.values(cityData), backgroundColor: '#6366f1', borderRadius: 4 }]
  }

  const chartOpts = { responsive: true, plugins: { legend: { display: false } } }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold dark:text-white">📈 {t('platform_analytics')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Revenue, orders and customer insights</p>
      </div>

      {/* Day filter */}
      <div className="flex gap-2 mb-6">
        {[7, 14, 30, 90].map(d => (
          <button key={d} onClick={() => setDays(d)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium
                    ${days === d ? 'bg-primary text-white' : 'bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white'}`}>
            {d}d
          </button>
        ))}
      </div>

      {/* GMV Chart */}
      <div className="card mb-6">
        <h2 className="font-semibold mb-4 dark:text-white">Daily GMV (Gross Merchandise Value)</h2>
        {Object.keys(gmv).length > 0 && <Bar data={gmvChart} options={chartOpts} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Top Restaurants */}
        <div className="card">
          <h2 className="font-semibold mb-3 dark:text-white">Top Restaurants by {t('revenue')}</h2>
          <div className="space-y-2">
            {topRestaurants.map((r, i) => (
              <div key={r.restaurantId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-400 w-5">#{i+1}</span>
                  <span className="text-sm dark:text-white">{r.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">₹{Number(r.revenue).toFixed(0)}</p>
                  <p className="text-xs text-gray-400">{r.orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers (CLV) */}
        <div className="card">
          <h2 className="font-semibold mb-3 dark:text-white">Top Customers by Lifetime Value</h2>
          <div className="space-y-2">
            {topCustomers.map((c, i) => (
              <div key={c.userId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-400 w-5">#{i+1}</span>
                  <span className="text-sm dark:text-white">{c.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">₹{Number(c.clv).toFixed(0)}</p>
                  <p className="text-xs text-gray-400">{c.orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders by City */}
      {Object.keys(cityData).length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-4 dark:text-white">Orders by City</h2>
          <Bar data={cityChart} options={chartOpts} />
        </div>
      )}
    </div>
  )
}
