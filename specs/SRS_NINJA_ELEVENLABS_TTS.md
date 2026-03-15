# SRS Ninja — Feature: ElevenLabs TTS Audio Generation

## Context

Add text-to-speech audio to **English deck only** (for now) using ElevenLabs API. Free tier: 10,000 characters/month.
The API key should already be in `.env.local` as `ELEVENLABS_API_KEY`.

**Voice ID:** `wWWn96OtTHu1sn8SRGEr` (user's chosen voice from ElevenLabs library)
**Language:** English only (`en`)
**Model:** `eleven_flash_v2_5` (fast, 0.5 credits per character)

---

## What to Build

### 1. API Route: Generate Audio

Create `src/app/api/tts/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { noteId, text, language } = await request.json()

  if (!noteId || !text) {
    return NextResponse.json({ error: 'Missing noteId or text' }, { status: 400 })
  }

  // Single voice for English deck
  const voiceId = 'wWWn96OtTHu1sn8SRGEr'

  // Call ElevenLabs API
  const ttsResponse = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_flash_v2_5',
        language_code: 'en',
      }),
    }
  )

  if (!ttsResponse.ok) {
    const error = await ttsResponse.text()
    console.error('ElevenLabs error:', error)
    return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 })
  }

  // Get audio as buffer
  const audioBuffer = await ttsResponse.arrayBuffer()

  // Upload to Supabase Storage
  const fileName = `${user.id}/${noteId}.mp3`
  const { error: uploadError } = await supabase.storage
    .from('audio')
    .upload(fileName, audioBuffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('audio')
    .getPublicUrl(fileName)

  // Update note with audio URL
  await supabase
    .from('notes')
    .update({ 
      fields: supabase.rpc('jsonb_set_key', { 
        // Alternative: fetch note, modify fields, update
      })
    })
    .eq('id', noteId)

  // Simpler approach: update audio_cache table
  await supabase.from('audio_cache').upsert({
    note_id: noteId,
    field_key: 'expression',
    language: language,
    voice_id: voiceId,
    storage_path: publicUrl,
  }, { onConflict: 'note_id,field_key' })

  return NextResponse.json({ audioUrl: publicUrl })
}
```

### 2. Supabase Storage Bucket

Create a storage bucket for audio files. Run this SQL migration:

```sql
-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', true);

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users upload own audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access (audio files need to be playable)
CREATE POLICY "Public audio read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audio');
```

### 3. Batch Generate Audio for Existing Cards

Create `src/app/api/tts/batch/route.ts`:

```typescript
// POST /api/tts/batch
// Body: { deckId: string }
// Generates audio for all notes in a deck that don't have audio yet

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { deckId } = await request.json()

  // Get deck language
  const { data: deck } = await supabase
    .from('decks')
    .select('language')
    .eq('id', deckId)
    .single()

  // Get notes without audio
  const { data: notes } = await supabase
    .from('notes')
    .select('id, fields')
    .eq('deck_id', deckId)
    .eq('user_id', user.id)

  const { data: existingAudio } = await supabase
    .from('audio_cache')
    .select('note_id')
    .in('note_id', notes?.map(n => n.id) || [])

  const existingNoteIds = new Set(existingAudio?.map(a => a.note_id) || [])
  const notesWithoutAudio = notes?.filter(n => !existingNoteIds.has(n.id)) || []

  // Generate audio for each (with rate limiting)
  const results = []
  for (const note of notesWithoutAudio) {
    const expression = note.fields?.expression || note.fields?.term
    if (!expression) continue

    try {
      // Call our own TTS endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: note.id,
          text: expression,
          language: deck?.language,
        }),
      })

      if (response.ok) {
        results.push({ noteId: note.id, status: 'ok' })
      } else {
        results.push({ noteId: note.id, status: 'error' })
      }

      // Rate limit: wait 500ms between requests
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (e) {
      results.push({ noteId: note.id, status: 'error' })
    }
  }

  return NextResponse.json({
    total: notesWithoutAudio.length,
    generated: results.filter(r => r.status === 'ok').length,
    errors: results.filter(r => r.status === 'error').length,
  })
}
```

### 4. PlayButton Integration & Autoplay

Update the Flashcard component to actually play audio:

```typescript
// In the review page or wherever Flashcard is rendered:

// Fetch audioUrl from audio_cache table
const { data: audio } = await supabase
  .from('audio_cache')
  .select('storage_path')
  .eq('note_id', noteId)
  .eq('field_key', 'expression')
  .single()

// Audio playback function
const playAudio = () => {
  if (audio?.storage_path) {
    const audioEl = new Audio(audio.storage_path)
    audioEl.play()
  }
}

// Pass to Flashcard
<Flashcard
  audioUrl={audio?.storage_path}
  onPlayAudio={playAudio}
  // ... other props
/>
```

### IMPORTANT: Autoplay Behavior

**Rule:** When a card shows a FOREIGN language word (not the user's native language), audio plays automatically the FIRST time the card appears.

The user's native language is Russian. So:

| Direction | Front shows | Autoplay on front? | Autoplay on reveal? |
|---|---|---|---|
| Recognition front | English word | ✅ YES — auto-play when card appears | — |
| Recognition back | English word + translation | No (already played) | — |
| Production front | Russian translation | ❌ NO — native language | — |
| Production back | English word revealed | ✅ YES — auto-play when answer is revealed |

**Implementation:**

```typescript
// In the review session page:
const [hasAutoPlayed, setHasAutoPlayed] = useState(false)

// Auto-play when card appears (recognition) or when revealed (production)
useEffect(() => {
  if (hasAutoPlayed) return
  
  const shouldAutoPlay = 
    (direction === 'recognition' && !isRevealed && audioUrl) ||
    (direction === 'production' && isRevealed && audioUrl)
  
  if (shouldAutoPlay) {
    const audioEl = new Audio(audioUrl)
    audioEl.play().catch(() => {}) // catch browser autoplay restrictions
    setHasAutoPlayed(true)
  }
}, [direction, isRevealed, audioUrl, hasAutoPlayed])

// Reset autoplay flag when moving to next card
useEffect(() => {
  setHasAutoPlayed(false)
}, [currentCardId])
```

**Note:** Browsers may block autoplay without user interaction. The `catch` handles this gracefully — if autoplay is blocked, user can still press the Play button manually. After the first manual interaction on the page, autoplay usually works for subsequent cards.

**Play button always visible** when the expression is shown, regardless of autoplay. User can press it anytime to hear the word again.

### 5. "Generate Audio" Button on Review Page

Add a button that triggers batch audio generation:
- Shows on deck page or review page header
- "🔊 Generate Audio" button
- On click → calls /api/tts/batch with deckId
- Shows progress: "Generating audio... 5/15"
- Shows character usage: "~150 / 10,000 characters used this month"

---

## Environment Variable

Add to `.env.local` (user should already have this):
```
ELEVENLABS_API_KEY=sk_your_key_here
```

**IMPORTANT:** Never hardcode the API key. Always use process.env.

---

## Character Budget

Free tier: 10,000 chars/month.
- Average word length: ~8 characters
- 15 words from today's lesson: ~120 characters
- That's ~80 lessons worth of audio per month on free tier
- Display remaining character budget in the UI

---

## Voice

| Language | Voice ID | Notes |
|---|---|---|
| English | wWWn96OtTHu1sn8SRGEr | User's chosen voice from ElevenLabs library |

Czech TTS will be added in a future phase.

---

## Acceptance Criteria

- [ ] `/api/tts` endpoint generates audio for a single note
- [ ] Audio stored in Supabase Storage (`audio` bucket)
- [ ] Audio URL saved in `audio_cache` table
- [ ] `/api/tts/batch` generates audio for all notes in English deck
- [ ] PlayButton in Flashcard actually plays the audio
- [ ] **Autoplay: recognition front — audio plays when card appears**
- [ ] **Autoplay: production back — audio plays when answer is revealed**
- [ ] **No autoplay: production front (Russian shown, no foreign audio)**
- [ ] **Play button always visible when expression is shown (manual replay)**
- [ ] **Autoplay resets when moving to next card**
- [ ] Graceful handling of browser autoplay restrictions
- [ ] Rate limiting between API calls (500ms delay)
- [ ] Error handling for API failures
- [ ] Uses voice ID `wWWn96OtTHu1sn8SRGEr` for all English cards
- [ ] Character usage awareness (don't burn free tier)
- [ ] "Generate Audio" button accessible from deck/review page
- [ ] English only for now (Czech TTS in future phase)
