import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 text-center px-4">
        <div className="text-7xl mb-4">😵</div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Something went wrong</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
          {this.state.error?.message || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/' }}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition"
        >
          Go Home
        </button>
      </div>
    )
  }
}
