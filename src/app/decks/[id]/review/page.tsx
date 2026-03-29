import { renderSharedReviewPage } from '@/app/review/shared-review-page'
import type { ReviewSessionSearchParams } from '@/lib/review-session-route'

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<ReviewSessionSearchParams>
}) {
  const { id: deckId } = await params
  return renderSharedReviewPage(deckId, await searchParams)
}
