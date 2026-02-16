'use client'

import { useState, useRef } from 'react'
import Spinner from './Spinner'

interface VoiceRecorderProps {
  onTranscript: (text: string) => void
  loading?: boolean
}

export default function VoiceRecorder({ onTranscript, loading = false }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      setError(null)

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })

      // Store chunks as they arrive
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      // Handle recording stop
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        chunksRef.current = []

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())

        // Send to transcription
        await sendToTranscription(audioBlob)
      }

      // Start recording
      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
    } catch (err) {
      console.error('Error accessing microphone:', err)
      setError('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const sendToTranscription = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob)

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Transcription failed')
      }

      const data = await response.json()
      onTranscript(data.transcript)
    } catch (err) {
      console.error('Transcription error:', err)
      setError('Transcription failed. Please try again.')
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Microphone Button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={loading}
        className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
            : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20'
        } ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? (
          <Spinner size="lg" />
        ) : isRecording ? (
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 bg-white rounded" />
          </div>
        ) : (
          <svg
            className="w-16 h-16 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      {/* Status Text */}
      <div className="text-center">
        {loading && (
          <div className="text-neutral-300 font-medium">
            Transcribing audio...
          </div>
        )}
        {isRecording && !loading && (
          <div className="text-red-400 font-medium flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            Recording
          </div>
        )}
        {!isRecording && !loading && (
          <div className="text-neutral-400">
            Click the microphone to start recording
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
