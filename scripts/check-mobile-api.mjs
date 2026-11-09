// Smoke-checks the Android API as the seeded test user: sign in → home → due session.
// Usage: node scripts/check-mobile-api.mjs [apiBase=http://localhost:3000] [--grade]
// --grade also submits one "good" review for the first card (changes the test user's schedule).
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..')
const apiBase = process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:3000'
const grade = process.argv.includes('--grade')
const read = (file) => Object.fromEntries(
  fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/).filter((l) => /^[A-Za-z_]+=/.test(l)).map((l) => {
    let v = l.slice(l.indexOf('=') + 1).trim()
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1)
    return [l.slice(0, l.indexOf('=')), v.replace(/\\n$/, '')]
  }),
)
const env = read('.env.local')
const creds = read('android/test-user.properties')

const auth = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: creds.email, password: creds.password }),
}).then((r) => r.json())
if (!auth.access_token) throw new Error(`sign-in failed: ${auth.error_description ?? auth.msg ?? 'unknown'}`)
const bearer = { Authorization: `Bearer ${auth.access_token}` }

const unauth = await fetch(`${apiBase}/api/mobile/home`)
console.log('no token →', unauth.status)

const home = await fetch(`${apiBase}/api/mobile/home?tz=Europe/Prague`, { headers: bearer }).then((r) => r.json())
for (const d of home.decks) console.log(`deck ${d.name}: due=${d.due} total=${d.total} done=${d.completedToday}`)

const first = home.decks.find((d) => d.due > 0)
const session = await fetch(`${apiBase}/api/mobile/decks/${first.id}/session?mode=due`, { headers: bearer }).then((r) => r.json())
console.log(`session ${session.deck.name}: ${session.cards.length} cards`)
for (const c of session.cards.slice(0, 3)) console.log(`  [${c.cardType}/${c.state}] ${c.front} → ${c.back} | ex=${c.examples.length} syn=${c.synonyms.length} | ${c.meta}`)

const extraDeck = home.decks.find((d) => d.completedToday)
if (extraDeck) {
  const extra = await fetch(`${apiBase}/api/mobile/decks/${extraDeck.id}/session?mode=extra&limit=20`, { headers: bearer }).then((r) => r.json())
  console.log(`extra ${extra.deck.name}: ${extra.cards.length} cards`)
}

console.log(`audio: ${session.cards.filter((c) => c.audioUrl).length}/${session.cards.length} cards have a recording`)
console.log(`requeue rows: ${session.requeue?.length}; with ${session.cards.length - 1} left, again→${JSON.stringify(session.requeue?.[session.cards.length - 1]?.again)} hard→${JSON.stringify(session.requeue?.[session.cards.length - 1]?.hard)}`)

if (grade) {
  // The same grade twice with one review id: the second must be a no-op on the server.
  const reviewId = crypto.randomUUID()
  for (const attempt of ['first', 'retry']) {
    const res = await fetch(`${apiBase}/api/mobile/reviews`, {
      method: 'POST',
      headers: { ...bearer, 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: session.cards[0].cardId, rating: 'good', durationMs: 4200, reviewId }),
    })
    console.log(`grade ${attempt} →`, res.status, await res.text())
  }
}
