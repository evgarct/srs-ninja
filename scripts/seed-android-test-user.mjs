// Seeds (or re-seeds) the Android test user with decks in every home-screen state.
// Usage: node scripts/seed-android-test-user.mjs [path/to/.env.local]
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Credentials go to the
// gitignored android/test-user.properties (created on first run, reused afterwards).
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..')
const envPath = process.argv[2] ?? path.join(root, '.env.local')
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => {
      const key = line.slice(0, line.indexOf('='))
      let value = line.slice(line.indexOf('=') + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
      return [key, value.replace(/\\n$/, '')]
    }),
)
const url = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')

const credsPath = path.join(root, 'android', 'test-user.properties')
const creds = fs.existsSync(credsPath)
  ? Object.fromEntries(fs.readFileSync(credsPath, 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]))
  : { email: 'android-test@echo.test', password: crypto.randomBytes(18).toString('base64url') }

const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }
async function call(method, p, body, extra = {}) {
  const response = await fetch(`${url}${p}`, { method, headers: { ...headers, ...extra }, body: body ? JSON.stringify(body) : undefined })
  const text = await response.text()
  if (!response.ok) throw new Error(`${method} ${p}: ${response.status} ${text}`)
  return text ? JSON.parse(text) : null
}
const rest = (method, table, body, query = '') => call(method, `/rest/v1/${table}${query}`, body, { Prefer: 'return=representation' })

// 1. The user: create once, keep the password in sync with the local file.
const existing = await call('GET', `/auth/v1/admin/users?per_page=1000`)
let user = existing.users.find((u) => u.email === creds.email)
if (!user) {
  user = await call('POST', '/auth/v1/admin/users', { email: creds.email, password: creds.password, email_confirm: true })
} else {
  await call('PUT', `/auth/v1/admin/users/${user.id}`, { password: creds.password, email_confirm: true })
}
fs.writeFileSync(credsPath, `# Android test user (seeded by scripts/seed-android-test-user.mjs). Never commit.\nemail=${creds.email}\npassword=${creds.password}\n`)

// 2. Wipe the test user's data, children first.
for (const table of ['reviews', 'review_session_completions', 'cards', 'notes', 'decks']) {
  await rest('DELETE', table, null, `?user_id=eq.${user.id}`)
}

const day = 86_400_000
const at = (offsetDays) => new Date(Date.now() + offsetDays * day).toISOString()
const reviewed = (offsetDays) => ({ state: 'review', stability: 6.2, difficulty: 5.1, reps: 3, scheduled_days: 6, elapsed_days: 6, last_review: at(offsetDays - 6), due_at: at(offsetDays) })
const fresh = (offsetDays = -0.01) => ({ state: 'new', due_at: at(offsetDays) })

const english = (word, translation, examples, extra = {}) => ({
  word,
  translation,
  level: extra.level ?? 'B1',
  style: extra.style ?? 'neutral',
  part_of_speech: extra.pos ?? 'noun',
  popularity: extra.popularity ?? 6,
  ...(extra.synonyms ? { synonyms: extra.synonyms } : {}),
  examples_html: `<ul>${examples.map((e) => `<li>${e}</li>`).join('')}</ul>`,
})

const decks = [
  {
    name: 'English Core', language: 'english', notes: [
      [english('What are you driving at?', 'На что ты намекаешь?', ["I don't understand — <b>what are you driving at</b>?", "Stop hinting and just tell me <b>what you're driving at</b>."], { level: 'B2', style: 'informal', pos: 'idiom', popularity: 7, synonyms: ['What are you getting at?', "What's your point?"] }), reviewed(-1)],
      [english('cauldron', 'котёл', ['The witch stirred her bubbling <b>cauldron</b>.', 'Smoke rose from the <b>cauldron</b> filled with a strange potion.'], { popularity: 4 }), reviewed(-2)],
      [english('to beat around the bush', 'ходить вокруг да около, не говорить прямо', ['Stop <b>beating around the bush</b> and tell me.'], { level: 'B2', style: 'informal', pos: 'idiom', synonyms: ['to dance around the topic'] }), fresh()],
      [english('harbor', 'гавань', ['The boats stayed in the <b>harbor</b> all winter.'], { synonyms: ['port', 'haven'] }), fresh()],
      [english("I'll take a rain check", 'спасибо, но давай в другой раз; вежливый отказ с намёком, что предложение в силе', ["Thanks, but <b>I'll take a rain check</b> on dinner."], { level: 'B2', style: 'informal', pos: 'idiom' }), reviewed(-0.5)],
      [english('reluctant', 'неохотный, нехотя', ['She was <b>reluctant</b> to admit she was wrong.', 'A <b>reluctant</b> smile crossed his face.'], { level: 'B2', pos: 'adjective', synonyms: ['unwilling', 'hesitant'] }), reviewed(3)],
    ],
  },
  {
    name: 'Travel English', language: 'english', notes: [
      [english('boarding pass', 'посадочный талон', ['Please have your <b>boarding pass</b> ready at the gate.'], { level: 'A2' }), fresh()],
      [english('Is this seat taken?', 'Это место занято?', ['Excuse me, <b>is this seat taken</b>?'], { level: 'A2', pos: 'phrase' }), fresh()],
      [english('layover', 'пересадка (с ожиданием)', ['We have a three-hour <b>layover</b> in Istanbul.'], { synonyms: ['stopover'] }), reviewed(4)],
    ],
  },
  {
    name: 'Advanced Turkish', language: 'turkish', completedToday: true, notes: [
      [{ word: 'Kolay gelsin', translation: 'Лёгкой работы', level: 'B1', part_of_speech: 'phrase', examples_html: '<ul><li><b>Kolay gelsin</b>, usta!</li></ul>' }, reviewed(5)],
      [{ word: 'maalesef', translation: 'к сожалению', level: 'A2', part_of_speech: 'adverb', synonyms: ['ne yazık ki'], examples_html: '<ul><li><b>Maalesef</b> yarın gelemem.</li></ul>' }, fresh(1)],
      [{ word: 'Afiyet olsun', translation: 'Приятного аппетита', level: 'A1', part_of_speech: 'phrase', examples_html: '<ul><li>Yemek hazır, <b>afiyet olsun</b>!</li></ul>' }, fresh(1)],
    ],
  },
  {
    name: 'Немецкие существительные с невероятно длинными названиями', language: 'english', notes: [
      [english('Donaudampfschifffahrtsgesellschaftskapitän', 'капитан дунайского пароходства', ['He wanted to become a <b>Donaudampfschifffahrtsgesellschaftskapitän</b>.'], { level: 'C2' }), fresh()],
    ],
  },
]

const summary = []
for (const spec of decks) {
  const [deck] = await rest('POST', 'decks', { name: spec.name, language: spec.language, translation_language: 'russian', user_id: user.id })
  for (const [fields, schedule] of spec.notes) {
    const [note] = await rest('POST', 'notes', { deck_id: deck.id, user_id: user.id, fields, status: 'approved', source: 'manual', tags: [] })
    // Both directions, like the web importer; production lags a day so it is not always due together.
    await rest('POST', 'cards', [
      { note_id: note.id, user_id: user.id, card_type: 'recognition', ...schedule },
      { note_id: note.id, user_id: user.id, card_type: 'production', ...schedule, due_at: new Date(Date.parse(schedule.due_at) + day).toISOString() },
    ])
  }
  if (spec.completedToday) {
    await rest('POST', 'review_session_completions', { deck_id: deck.id, user_id: user.id, session_type: 'due' })
  }
  summary.push(`${spec.name}: ${spec.notes.length} notes`)
}
console.log(`Seeded ${creds.email} (${user.id})\n  ${summary.join('\n  ')}\nCredentials: ${path.relative(root, credsPath)}`)
