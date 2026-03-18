'use client'

import { useState } from 'react'
import { Loader2, RefreshCw, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'

interface BatchResult {
  total: number
  generated: number
  skipped: number
  errors: number
  error?: string
  errorMessages?: string[]
  generatedAudio?: Array<{ noteId: string; audioUrl: string }>
}

export function GenerateAudioButton({
  deckId,
  noteIds,
  pendingCount,
  onComplete,
  stateOverride,
  resultOverride,
}: {
  deckId: string
  noteIds: string[]
  pendingCount: number
  onComplete?: (result: BatchResult) => void
  stateOverride?: 'idle' | 'loading' | 'done' | 'error'
  resultOverride?: BatchResult | null
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<BatchResult | null>(null)
  const effectiveState = stateOverride ?? state
  const effectiveResult = resultOverride ?? result

  async function handleClick() {
    if (stateOverride) return

    setState('loading')
    try {
      const res = await fetch('/api/tts/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckId, noteIds }),
      })
      const data = (await res.json()) as BatchResult
      if (!res.ok) {
        toast.error(data.error ?? data.errorMessages?.[0] ?? 'Audio generation failed')
        setState('error')
        return
      }
      setResult(data)
      setState('done')
      if (data.errors > 0) {
        toast.error(data.errorMessages?.[0] ?? `Audio generated with ${data.errors} errors`)
      } else if (data.generated > 0) {
        toast.success(`Generated audio for ${data.generated} notes`)
      }
      onComplete?.(data)
    } catch {
      toast.error('Audio generation failed')
      setState('error')
    }
  }

  const tooltipText =
    effectiveState === 'done' && effectiveResult
      ? `Generated audio for ${effectiveResult.generated} notes${effectiveResult.errors > 0 ? `, ${effectiveResult.errors} errors` : ''}`
      : pendingCount > 0
        ? `Generate audio for ${pendingCount} filtered notes without audio`
        : 'All filtered notes already have audio'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <span>
              <Button
                variant="outline"
                onClick={handleClick}
                disabled={effectiveState === 'loading' || pendingCount === 0}
              >
                {effectiveState === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating
                    <span className="text-xs text-muted-foreground">({pendingCount})</span>
                  </>
                ) : effectiveState === 'error' ? (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Retry Audio
                    <span className="text-xs text-muted-foreground">({pendingCount})</span>
                  </>
                ) : effectiveState === 'done' && effectiveResult ? (
                  <>
                    <Volume2 className="w-4 h-4" />
                    Audio
                    <span className="text-xs text-muted-foreground">({effectiveResult.generated})</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    Generate Audio
                    <span className="text-xs text-muted-foreground">({pendingCount})</span>
                  </>
                )}
              </Button>
            </span>
          }
        >
          <span className="sr-only">Generate audio</span>
        </TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
