import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 text-center px-4">
      <div className="text-8xl mb-4">🍽️</div>
      <h1 className="text-6xl font-bold text-orange-500 mb-2">404</h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">Page not found</p>
      <p className="text-gray-500 dark:text-gray-500 mb-8">Looks like this page went out for delivery and never came back.</p>
      <Link to="/" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition">
        Back to Home
      </Link>
    </div>
  )
}
