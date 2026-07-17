import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCities, setCity } from '@/features/city/citySlice'
import { FiMapPin, FiChevronDown } from 'react-icons/fi'

export default function CitySelector() {
  const dispatch = useDispatch()
  const { cities, selected } = useSelector(s => s.city)
  const [open, setOpen]       = useState(false)
  const [detecting, setDetecting] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    dispatch(fetchCities())
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const detectCity = () => {
    if (!navigator.geolocation) return
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`)
        const data = await res.json()
        const city = data.address?.city || data.address?.town || data.address?.village || ''
        if (city) dispatch(setCity(city))
      } catch {}
      setDetecting(false)
      setOpen(false)
    }, () => setDetecting(false))
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium hover:border-primary transition-colors min-w-[120px]">
        <FiMapPin size={14} className="text-primary flex-shrink-0" />
        <span className="truncate dark:text-white">{selected || 'Select City'}</span>
        <FiChevronDown size={14} className="text-gray-400 ml-auto flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* GPS detect */}
          <button onClick={detectCity}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-primary hover:bg-orange-50 dark:hover:bg-orange-900/20 border-b border-gray-100 dark:border-gray-700">
            <FiMapPin size={14} />
            {detecting ? 'Detecting...' : 'Use my location'}
          </button>

          {/* All cities option */}
          <button onClick={() => { dispatch(setCity('')); setOpen(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white
                    ${!selected ? 'font-bold text-primary' : ''}`}>
            All Cities
          </button>

          {/* City list */}
          <div className="max-h-48 overflow-y-auto">
            {cities.map(c => (
              <button key={c} onClick={() => { dispatch(setCity(c)); setOpen(false) }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white
                        ${selected === c ? 'font-bold text-primary bg-orange-50 dark:bg-orange-900/20' : ''}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
