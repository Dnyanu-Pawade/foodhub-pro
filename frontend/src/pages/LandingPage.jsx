import { Link, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useEffect, useState, useRef } from 'react'

const FEATURES = [
  { icon: '🚀', title: 'Lightning Fast',    desc: 'Average 30-min delivery to your door, guaranteed' },
  { icon: '🍕', title: '500+ Restaurants',  desc: 'Food, groceries, pharmacy — all in one app' },
  { icon: '💳', title: 'Secure Payments',   desc: 'UPI, cards, wallet, cash on delivery' },
  { icon: '📍', title: 'Live GPS Tracking', desc: 'Watch your order move on a real-time map' },
  { icon: '⭐', title: 'Loyalty Rewards',   desc: 'Earn points on every order, redeem for discounts' },
  { icon: '🔐', title: 'Safe & Verified',   desc: 'OTP delivery, FSSAI verified restaurants' },
]

const TESTIMONIALS = [
  { name: 'Priya S.',    city: 'Pune',      rating: 5, text: 'Best food delivery app! Order arrived in 25 minutes, still hot. Love the live tracking.' },
  { name: 'Rahul M.',   city: 'Mumbai',    rating: 5, text: 'The loyalty points system is amazing. I\'ve saved ₹500 already this month!' },
  { name: 'Sneha K.',   city: 'Bangalore', rating: 5, text: 'Table booking feature is so convenient. No more waiting in queues at my favourite restaurant.' },
  { name: 'Amit D.',    city: 'Delhi',     rating: 4, text: 'Great variety of restaurants. The search and filters make it easy to find exactly what I want.' },
]

const CITIES = ['Mumbai','Delhi','Bangalore','Pune','Hyderabad','Chennai','Kolkata','Ahmedabad','Jaipur','Surat']

const HOW_IT_WORKS = [
  { step: '01', emoji: '📍', title: 'Set your location',   desc: 'Enter your city or share GPS location' },
  { step: '02', emoji: '🍽️', title: 'Browse & choose',    desc: 'Pick from 500+ restaurants near you' },
  { step: '03', emoji: '🛒', title: 'Place your order',    desc: 'Add items, apply coupons, pay securely' },
  { step: '04', emoji: '🎉', title: 'Enjoy your meal',     desc: 'Delivered hot in ~30 minutes' },
]

function useCountUp(target, duration = 1500) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      let start = 0
      const step = target / (duration / 16)
      const timer = setInterval(() => {
        start += step
        if (start >= target) { setCount(target); clearInterval(timer) }
        else setCount(Math.floor(start))
      }, 16)
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])
  return [count, ref]
}

function StatCard({ value, suffix, label }) {
  const numeric = parseInt(value) || 0
  const [count, ref] = useCountUp(numeric)
  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl md:text-5xl font-extrabold text-white">{count.toLocaleString()}{suffix}</p>
      <p className="text-orange-200 text-sm mt-1">{label}</p>
    </div>
  )
}

export default function LandingPage() {
  const { user } = useSelector(s => s.auth)
  const [stats, setStats] = useState({ restaurants: 500, orders: 10000, cities: 20, partners: 1200 })
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  useEffect(() => {
    // Use static stats — no auth needed on landing page
    const t = setInterval(() => setActiveTestimonial(i => (i + 1) % TESTIMONIALS.length), 4000)
    return () => clearInterval(t)
  }, [])

  if (user) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 overflow-x-hidden">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-orange-500 via-orange-500 to-red-500 text-white overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-600/30 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              🔥 India's fastest growing food platform
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-5">
              Delicious food,<br />
              <span className="text-yellow-300">delivered fast</span>
            </h1>
            <p className="text-lg md:text-xl text-orange-100 mb-8 max-w-lg">
              Order from 500+ restaurants, grocery stores & pharmacies. Live GPS tracking, loyalty rewards, and table booking — all in one app.
            </p>
            <div className="flex gap-3 justify-center md:justify-start flex-wrap">
              <Link to="/register"
                    className="bg-white text-orange-600 font-bold px-8 py-3.5 rounded-xl text-base hover:bg-orange-50 transition shadow-xl shadow-orange-900/30 flex items-center gap-2">
                🚀 Order Now — It's Free
              </Link>
              <Link to="/login"
                    className="border-2 border-white/60 text-white font-semibold px-8 py-3.5 rounded-xl text-base hover:bg-white/10 transition backdrop-blur-sm">
                Sign In
              </Link>
            </div>
            <p className="text-orange-200 text-sm mt-4">✅ No subscription required &nbsp;•&nbsp; 🎁 Use code <span className="font-bold text-white">WELCOME50</span> for 50% off</p>
          </div>

          {/* Hero illustration */}
          <div className="flex-shrink-0 relative">
            <div className="w-64 h-64 md:w-80 md:h-80 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center text-9xl shadow-2xl border border-white/20">
              🍔
            </div>
            {/* Floating badges */}
            <div className="absolute -top-4 -left-6 bg-white text-gray-800 rounded-2xl px-3 py-2 shadow-xl text-sm font-bold flex items-center gap-2 animate-bounce">
              ⭐ 4.8 Rating
            </div>
            <div className="absolute -bottom-4 -right-4 bg-green-500 text-white rounded-2xl px-3 py-2 shadow-xl text-sm font-bold flex items-center gap-2">
              🛵 30 min delivery
            </div>
            <div className="absolute top-1/2 -right-8 bg-yellow-400 text-gray-900 rounded-2xl px-3 py-2 shadow-xl text-xs font-bold">
              🎉 10k+ orders
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats counter ─────────────────────────────────────────────────── */}
      <section className="bg-gray-900 py-14 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCard value={stats.restaurants} suffix="+" label="Restaurants" />
          <StatCard value={stats.orders}      suffix="+" label="Orders Delivered" />
          <StatCard value={stats.cities}      suffix="+"  label="Cities" />
          <StatCard value={stats.partners}    suffix="+"  label="Delivery Partners" />
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Simple & Fast</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-2 dark:text-white">How it works</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-orange-200 dark:bg-orange-900/40 z-0" />
            {HOW_IT_WORKS.map((h, i) => (
              <div key={h.step} className="relative z-10 text-center">
                <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex items-center justify-center text-4xl mx-auto mb-4 border-2 border-orange-100 dark:border-orange-900/30">
                  {h.emoji}
                </div>
                <span className="text-xs font-bold text-primary bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full">{h.step}</span>
                <h3 className="font-bold text-gray-800 dark:text-white mt-2 mb-1">{h.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features grid ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Everything you need</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-2 dark:text-white">Why FoodHub Pro?</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title}
                   className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 dark:border-gray-700">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
                <h3 className="font-bold text-gray-800 dark:text-white mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-orange-50 dark:bg-orange-900/10">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">What customers say</span>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-2 mb-10 dark:text-white">Loved by thousands</h2>

          <div className="relative min-h-[160px]">
            {TESTIMONIALS.map((t, i) => (
              <div key={i}
                   className={`absolute inset-0 transition-all duration-500 ${i === activeTestimonial ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-orange-100 dark:border-orange-900/30">
                  <div className="flex justify-center mb-3">
                    {'★'.repeat(t.rating).split('').map((s, j) => (
                      <span key={j} className="text-yellow-400 text-xl">{s}</span>
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-lg italic mb-4">"{t.text}"</p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                      {t.name[0]}
                    </div>
                    <span className="font-semibold text-gray-800 dark:text-white">{t.name}</span>
                    <span className="text-gray-400 text-sm">· {t.city}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${i === activeTestimonial ? 'bg-primary w-6' : 'bg-gray-300'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Cities ────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold dark:text-white">Available in your city</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Serving 20+ cities across India</p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {CITIES.map(city => (
              <Link key={city} to="/register"
                    className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors shadow-sm">
                📍 {city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── For restaurant owners ─────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="text-6xl flex-shrink-0">🏪</div>
          <div className="flex-1 text-center md:text-left">
            <span className="text-orange-400 font-semibold text-sm uppercase tracking-wider">For Restaurant Owners</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-2 mb-4">Grow your restaurant with us</h2>
            <p className="text-gray-400 mb-6 text-lg">
              Join 500+ restaurants on FoodHub Pro. Get real-time orders, analytics dashboard, inventory management, employee tracking, and direct customer chat.
            </p>
            <div className="flex flex-wrap gap-3 mb-6 justify-center md:justify-start">
              {['📊 Analytics Dashboard','🔔 Real-time Orders','💸 Weekly Payouts','📦 Inventory Mgmt','⭐ Review Management'].map(f => (
                <span key={f} className="bg-white/10 text-white text-sm px-3 py-1.5 rounded-full">{f}</span>
              ))}
            </div>
            <Link to="/register"
                  className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3.5 rounded-xl text-base transition shadow-lg shadow-orange-500/30">
              Partner with us — Free →
            </Link>
          </div>
        </div>
      </section>

      {/* ── App download ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gradient-to-br from-orange-500 to-red-500 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Get the app</h2>
          <p className="text-orange-100 mb-8 text-lg">Install as PWA instantly — no app store needed. Works on Android & iOS.</p>
          <div className="flex gap-4 justify-center flex-wrap mb-8">
            <a href="https://play.google.com/store" target="_blank" rel="noreferrer"
               className="flex items-center gap-3 bg-black/40 backdrop-blur-sm border border-white/30 text-white px-6 py-3.5 rounded-xl font-medium hover:bg-black/60 transition">
              <span className="text-2xl">▶</span>
              <div className="text-left">
                <p className="text-xs text-white/70">Get it on</p>
                <p className="font-bold">Google Play</p>
              </div>
            </a>
            <a href="https://apps.apple.com" target="_blank" rel="noreferrer"
               className="flex items-center gap-3 bg-black/40 backdrop-blur-sm border border-white/30 text-white px-6 py-3.5 rounded-xl font-medium hover:bg-black/60 transition">
              <span className="text-2xl"></span>
              <div className="text-left">
                <p className="text-xs text-white/70">Download on the</p>
                <p className="font-bold">App Store</p>
              </div>
            </a>
          </div>
          <Link to="/register"
                className="inline-block bg-white text-orange-600 font-bold px-10 py-4 rounded-xl text-lg hover:bg-orange-50 transition shadow-2xl">
            Start ordering now — it's free 🚀
          </Link>
          <p className="text-orange-200 text-sm mt-4">First order 50% off with code <span className="font-bold text-white">WELCOME50</span></p>
        </div>
      </section>
    </div>
  )
}
