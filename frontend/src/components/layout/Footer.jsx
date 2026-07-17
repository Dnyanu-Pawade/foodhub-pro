import { Link, useLocation } from 'react-router-dom'

const HIDE_ON = ['/login', '/register', '/landing']

export default function Footer() {
  const { pathname } = useLocation()
  if (HIDE_ON.includes(pathname)) return null

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-12 py-6 pb-20 md:pb-6">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2 font-bold text-primary text-base">
          🍽️ FoodHub Pro
        </div>
        <div className="flex gap-5 flex-wrap justify-center">
          <Link to="/terms"   className="hover:text-primary transition">Terms</Link>
          <Link to="/privacy" className="hover:text-primary transition">Privacy</Link>
          <a href="mailto:support@foodhubpro.in" className="hover:text-primary transition">Support</a>
        </div>
        <p className="text-xs">© {new Date().getFullYear()} FoodHub Pro</p>
      </div>
    </footer>
  )
}
