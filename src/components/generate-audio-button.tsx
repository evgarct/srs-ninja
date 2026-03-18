'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface BatchResult {
  total: number
  generated: number
  skipped: number
  errors: number
  generatedAudio?: Array<{ noteId: string; audioUrl: string }>
}

export function GenerateAudioButton({
  deckId,
  onComplete,
}: {
  deckId: string
  onComplete?: (result: BatchResult) => void
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<BatchResult | null>(null)

  async function handleClick() {
    setState('loading')
    try {
      const res = await fetch('/api/tts/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckId }),
      })
      if (!res.ok) {
        setState('error')
        return
      }
      const data: BatchResult = await res.json()
      setResult(data)
      setState('done')
      onComplete?.(data)
    } catch {
      setState('error')
    }
  }

  if (state === 'loading') {
    return (
      <Button variant="outline" disabled>
        🔊 Generating audio…
      </Button>
    )
  }

  if (state === 'done' && result) {
    return (
      <span className="text-sm text-muted-foreground">
        🔊 {result.generated} generated{result.errors > 0 ? `, ${result.errors} errors` : ''}
      </span>
    )
  }

  if (state === 'error') {
    return (
      <Button variant="outline" onClick={handleClick}>
        🔊 Retry audio
      </Button>
    )
  }

  return (
    <Button variant="outline" onClick={handleClick}>
      🔊 Generate Audio
    </Button>
  )
}
