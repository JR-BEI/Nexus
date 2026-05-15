'use client'

import { useEffect, useRef, useState } from 'react'

type RecordingState = 'idle' | 'listening' | 'processing' | 'complete'

interface VoiceRecorderProps {
  onTranscript: (text: string) => void
  loading?: boolean
}

function MicIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function formatTime(ms: number) {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, '0')
  const s = (total % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function VoiceRecorder({ onTranscript, loading = false }: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  // External loading prop overrides internal state to show processing
  const effectiveState: RecordingState = loading ? 'processing' : state

  useEffect(() => {
    if (state === 'listening') {
      startTimeRef.current = Date.now()
      setElapsed(0)
      timerRef.current = window.setInterval(() => {
        setElapsed(Date.now() - startTimeRef.current)
      }, 250)
    } else if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [state])

  const startRecording = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        chunksRef.current = []
        stream.getTracks().forEach((track) => track.stop())
        setState('processing')
        await sendToTranscription(audioBlob)
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setState('listening')
    } catch (err) {
      console.error('Error accessing microphone:', err)
      setError('Could not access microphone. Please check permissions.')
      setState('idle')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === 'listening') {
      mediaRecorderRef.current.stop()
    }
  }

  const sendToTranscription = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob)

      const response = await fetch('/api/transcribe', { method: 'POST', body: formData })
      if (!response.ok) throw new Error('Transcription failed')

      const data = await response.json()
      onTranscript(data.transcript)
      setState('complete')
    } catch (err) {
      console.error('Transcription error:', err)
      setError('Transcription failed. Please try again.')
      setState('idle')
    }
  }

  const handleToggle = () => {
    if (effectiveState === 'idle' || effectiveState === 'complete') startRecording()
    else if (effectiveState === 'listening') stopRecording()
  }

  return (
    <div className="mic-stage">
      <div className={`mic-rings mic-rings-${effectiveState}`}>
        <div className="mic-ring mic-ring-1" />
        <div className="mic-ring mic-ring-2" />
        <div className="mic-ring mic-ring-3" />
      </div>
      <button
        className={`mic-button mic-button-${effectiveState}`}
        onClick={handleToggle}
        disabled={effectiveState === 'processing'}
        aria-label={effectiveState === 'listening' ? 'Stop recording' : 'Start recording'}
      >
        {effectiveState === 'processing' ? (
          <svg className="mic-spinner" width="28" height="28" viewBox="0 0 28 28" aria-hidden>
            <circle
              cx="14"
              cy="14"
              r="11"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="20 60"
              strokeLinecap="round"
            />
          </svg>
        ) : effectiveState === 'listening' ? (
          <div className="w-6 h-6 bg-white rounded-sm" />
        ) : (
          <MicIcon />
        )}
      </button>
      <p className="mic-caption">
        {effectiveState === 'idle' && 'Click the microphone to start recording'}
        {effectiveState === 'listening' && (
          <>
            Listening… <span className="mic-timer">{formatTime(elapsed)}</span>
          </>
        )}
        {effectiveState === 'processing' && 'Processing your recording…'}
        {effectiveState === 'complete' && 'Recording captured. Review below.'}
      </p>
      {error && <div className="mic-error">{error}</div>}
    </div>
  )
}
