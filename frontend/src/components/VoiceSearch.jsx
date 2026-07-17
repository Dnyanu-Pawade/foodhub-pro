import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function VoiceSearch() {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef(null)
  const navigate = useNavigate()

  const start = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { toast.error('Voice search not supported in this browser'); return }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => setListening(true)
    recognition.onend   = () => setListening(false)
    recognition.onerror = () => { setListening(false); toast.error('Voice error, try again') }

    recognition.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join('')
      setTranscript(text)
      if (e.results[e.results.length - 1].isFinal) {
        setListening(false)
        navigate(`/search?q=${encodeURIComponent(text)}`)
        setTranscript('')
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const stop = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  return (
    <div className="relative">
      <button onClick={listening ? stop : start}
              className={`p-2 rounded-full transition-all ${listening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              title="Voice Search">
        🎤
      </button>
      {transcript && (
        <div className="absolute top-10 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm shadow-lg whitespace-nowrap z-50">
          "{transcript}"
        </div>
      )}
    </div>
  )
}
