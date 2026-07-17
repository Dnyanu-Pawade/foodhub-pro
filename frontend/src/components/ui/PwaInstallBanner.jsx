import { useEffect, useState } from 'react'
import { usePwaInstall } from '@/hooks/usePwaInstall'

export default function PwaInstallBanner() {
  const { canInstall, install } = usePwaInstall()
  const [show, setShow]         = useState(false)
  const [dismissed, setDismiss] = useState(false)

  useEffect(() => {
    const visits = parseInt(localStorage.getItem('visitCount') || '0') + 1
    localStorage.setItem('visitCount', visits)
    const wasDismissed = localStorage.getItem('pwaDismissed') === 'true'
    if (visits >= 2 && !wasDismissed) setShow(true)
  }, [])

  const dismiss = () => {
    setDismiss(true)
    localStorage.setItem('pwaDismissed', 'true')
  }

  if (!canInstall || !show || dismissed) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 z-50 flex items-center gap-3">
      <span className="text-3xl">🍽️</span>
      <div className="flex-1">
        <p className="font-semibold text-sm dark:text-white">Install FoodHub Pro</p>
        <p className="text-xs text-gray-500">Add to home screen for faster access</p>
      </div>
      <div className="flex gap-2">
        <button onClick={dismiss} className="text-xs text-gray-400 hover:text-gray-600 px-2">Later</button>
        <button onClick={install} className="btn-primary text-xs px-3 py-1.5">Install</button>
      </div>
    </div>
  )
}
