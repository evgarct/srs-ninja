'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { shouldSuggestExtraStudy } from '@/lib/extra-study'

/**
 * Displayed on the dashboard when a deck has no cards due for review.
 *
 * Offers the user to start an extra study session with new (never-reviewed) cards.
 * Navigates to the standard review page with `mode=extra` and a `limit` query param
 * so the review page knows to fetch new cards instead of due cards.
 *
 * @param deckId - The UUID of the deck to start an extra session for.
 */
export function ExtraStudyBox({
  deckId,
  hasStudiedToday = false,
}: {
  deckId: string
  hasStudiedToday?: boolean
}) {
  const router = useRouter()
  const [showExtraOptions, setShowExtraOptions] = useState(!hasStudiedToday)
  const suggestExtraStudy = shouldSuggestExtraStudy(hasStudiedToday)

  const startExtra = (limit: number) => {
    router.push(`/review/${deckId}?mode=extra&limit=${limit}`)
  }

  return (
    <Card className="border-dashed">
      <CardContent className="pt-4 pb-4">
        <p className="text-sm text-muted-foreground mb-3">
          {suggestExtraStudy
            ? 'На сегодня всё! Готовы к новым словам?'
            : 'На сегодня уже позанимались. Если хотите, можно взять дополнительные карточки.'}
        </p>
        {!showExtraOptions ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowExtraOptions(true)}
          >
            Дополнительно
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => startExtra(10)}
            >
              +10
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => startExtra(20)}
            >
              +20
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
