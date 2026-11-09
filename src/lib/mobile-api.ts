import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { getBearerToken } from '@/lib/mcp-auth'
import { mapFieldsToFlashcard } from '@/lib/flashcard-mapping'
import { getReviewRequeueWindow } from '@/lib/review-loop'
import {
  REVIEW_SWIPE_COMMIT_THRESHOLD,
  REVIEW_SWIPE_LOCK_DISTANCE,
  REVIEW_SWIPE_MAX_OFFSET,
  getReviewSwipeRating,
} from '@/lib/review-swipe'
import type { Database } from '@/lib/supabase/database.types'
import type { Language } from '@/lib/types'

/**
 * Shared pieces of the Android app API (`/api/mobile/*`).
 *
 * The app signs in with Supabase Auth directly (email + password, like the web login) and
 * sends the user's access token as a Bearer header. Every query then runs under that user's
 * RLS session, and review scheduling reuses the same server code as the web review.
 */

export type MobileContext = {
  supabase: SupabaseClient<Database>
  userId: string
}

export async function resolveMobileContext(request: Request): Promise<MobileContext | null> {
  const accessToken = getBearerToken(request)
  if (!accessToken) return null
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null
  const supabase = createSupabaseClient<Database>(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  const { data, error } = await supabase.auth.getUser(accessToken)
  if (error || !data.user) return null
  return { supabase, userId: data.user.id }
}

export function mobileUnauthorized() {
  return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })
}

/** Accepts only an IANA zone the runtime knows; anything else falls back to UTC, like the web home. */
export function parseTimeZone(value: string | null): string {
  if (!value) return 'UTC'
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value })
    return value
  } catch {
    return 'UTC'
  }
}

export type RequeueWindow = { min: number; max: number } | null

/**
 * Row `n` holds where a graded card goes back when `n` cards remain after it: `again` and `hard`
 * windows from the web's `getReviewRequeueWindow` (good/easy never requeue). The queue never grows
 * past the session size, so rows 0..size-1 cover every state.
 */
export function buildRequeueTable(sessionSize: number): Array<{ again: RequeueWindow; hard: RequeueWindow }> {
  return Array.from({ length: Math.max(sessionSize, 1) }, (_, remaining) => ({
    again: getReviewRequeueWindow(remaining, 1),
    hard: getReviewRequeueWindow(remaining, 2),
  }))
}

const RATING_NAMES = { 1: 'again', 2: 'hard', 3: 'good', 4: 'easy' } as const

/**
 * The web review's swipe (`review-swipe.ts`) for the app: past the commit distance a swipe grades
 * with the rating `getReviewSwipeRating` gives for that side; the card never travels past the max
 * offset; tracking starts after the lock distance and only for a mostly horizontal move. Ratings
 * that no swipe reaches (hard, good) stay on the buttons, as on the web.
 */
export function buildSwipeRules() {
  const left = getReviewSwipeRating(-REVIEW_SWIPE_COMMIT_THRESHOLD)
  const right = getReviewSwipeRating(REVIEW_SWIPE_COMMIT_THRESHOLD)
  return {
    commitDistance: REVIEW_SWIPE_COMMIT_THRESHOLD,
    maxOffset: REVIEW_SWIPE_MAX_OFFSET,
    lockDistance: REVIEW_SWIPE_LOCK_DISTANCE,
    left: left ? RATING_NAMES[left] : null,
    right: right ? RATING_NAMES[right] : null,
  }
}

export type MobileExample = { pre: string; hit: string; post: string }

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' }

function plain(html: string) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m)
    .replace(/\s+/g, ' ')
}

/** Splits one example around its first `<b>…</b>`, the studied phrase the app puts on a wash. */
export function splitExampleHit(html: string): MobileExample {
  const match = /<b>([\s\S]*?)<\/b>/i.exec(html)
  if (!match) return { pre: plain(html).trim(), hit: '', post: '' }
  const pre = plain(html.slice(0, match.index)).replace(/^\s+/, '')
  const post = plain(html.slice(match.index + match[0].length)).replace(/\s+$/, '')
  return { pre, hit: plain(match[1]), post }
}

export type MobileCard = {
  cardId: string
  noteId: string
  cardType: string
  state: string
  /** What the card shows first: the expression for recognition, the translation for production. */
  front: string
  back: string
  /** Target-language text to speak, whichever side is on the front. */
  spoken: string
  examples: MobileExample[]
  synonyms: string[]
  meta: string
}

type CardRow = {
  id: string
  note_id: string
  card_type: string
  state: string
  notes: { fields: unknown } | { fields: unknown }[] | null
}

export function mapCardForMobile(card: CardRow, language: Language): MobileCard {
  const note = Array.isArray(card.notes) ? card.notes[0] : card.notes
  const fields = (note?.fields ?? {}) as Record<string, unknown>
  const f = mapFieldsToFlashcard(fields, language)
  const production = card.card_type === 'production'
  const meta = [f.level, f.partOfSpeech, f.style, `${f.frequency}/10`]
    .map((part) => (part ?? '').toString().trim())
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' · ')
  return {
    cardId: card.id,
    noteId: card.note_id,
    cardType: card.card_type,
    state: card.state,
    front: production ? f.translation : f.expression,
    back: production ? f.expression : f.translation,
    spoken: f.expression,
    examples: f.examples.map(splitExampleHit).filter((e) => e.pre || e.hit || e.post),
    synonyms: f.synonyms ?? [],
    meta,
  }
}
