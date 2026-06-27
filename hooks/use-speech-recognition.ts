'use client'

import { useState, useEffect, useCallback } from 'react'

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [recognition, setRecognition] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = false
        recognitionInstance.interimResults = true
        recognitionInstance.lang = 'en-US'

        recognitionInstance.onresult = (event: any) => {
          let currentTranscript = ''
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript
          }
          setTranscript(currentTranscript)
        }

        recognitionInstance.onend = () => {
          setIsListening(false)
        }

        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error', event.error)
          setIsListening(false)
        }

        setRecognition(recognitionInstance)
      } else {
        console.warn('Speech recognition not supported in this browser.')
      }
    }
  }, [])

  const startListening = useCallback(() => {
    if (recognition) {
      setTranscript('')
      setIsListening(true)
      recognition.start()
    }
  }, [recognition])

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop()
      setIsListening(false)
    }
  }, [recognition])

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported: !!recognition,
    setTranscript
  }
}
