import { getDraftFieldContract, validateDraftCandidate, type DraftCandidateInput } from '@/lib/draft-import'
import type { McpDeck } from '@/lib/mcp-decks'
import type { Language } from '@/lib/types'

const examples: Record<Language, DraftCandidateInput> = {
  english: {
    fields: {
      word: 'journey', translation: 'путешествие', level: 'A2', part_of_speech: 'noun',
      popularity: '8', style: 'neutral', synonyms: ['trip'], antonyms: [],
      examples_html: '<ul><li>Our <b>journey</b> starts tomorrow.</li><li>The <b>journey</b> was comfortable.</li></ul>',
    },
    tags: ['travel', 'A2'],
  },
  czech: {
    fields: {
      word: 'cesta', translation: 'путь; поездка', level: 'A2', part_of_speech: 'podstatné jméno',
      gender: 'ženský', popularity: '8', style: 'neutrální', examples_html: '<ul><li>Čeká nás dlouhá <b>cesta</b>.</li><li>Tato <b>cesta</b> je bezpečná.</li></ul>',
    },
    tags: ['cestování', 'A2'],
  },
  turkish: {
    fields: {
      word: 'yolculuk', translation: 'путешествие', level: 'A2', part_of_speech: 'isim',
      popularity: '8', style: 'neutral', synonyms: ['seyahat'], antonyms: [],
      usage_pattern: 'yolculuğa çıkmak', grammar_note: 'Yönelme hâliyle sık kullanılır.',
      examples_html: '<ul><li><b>Yolculuk</b> yarın başlıyor.</li><li>Uzun <b>yolculuk</b> güzeldi.</li></ul>',
    },
    tags: ['seyahat', 'A2'],
  },
}

export function getValidDraftExample(language: Language) {
  const example = examples[language]
  const result = validateDraftCandidate(language, example)
  if (!result.candidate) throw new Error(`Invalid built-in ${language} MCP example`)
  return example
}

export function buildDeckContract(deck: McpDeck) {
  const language = deck.language as Language
  const contract = getDraftFieldContract(language)
  const exampleItem = getValidDraftExample(language)
  const selector = { language: deck.language, name: deck.name }

  return {
    deck,
    contract: {
      keys: contract.keys,
      requiredKeys: contract.requiredKeys,
      fields: contract.fields.map((field) => ({
        key: field.key,
        label: field.label,
        type: field.type,
        required: field.required,
        options: field.options ? [...field.options] : undefined,
        hint: field.hint,
      })),
    },
    instructions: [
      'Use field keys exactly as returned; use exact enum values from options.',
      'Put note fields in item.fields and taxonomy labels in item.tags.',
      'Call save_draft_notes with a language selector when it is unique; add exact name if multiple decks share a language.',
      'Saved notes are drafts. The user reviews and approves them in Echo, or asks you to call approve_drafts.',
      'To change existing notes (fields or tags), call update_notes or edit_note_tags; never save duplicates.',
    ],
    exampleItem,
    saveExample: { ...selector, items: [exampleItem], metadata: { topic: 'example' } },
  }
}

export function buildEchoGuide(deck?: McpDeck) {
  return {
    safety: 'MCP can create decks, read, create, edit, voice, approve and delete your Echo notes and drafts, review cards, and read statistics. Approve or delete when the user (or their standing instructions) asks; deletion needs confirm: true and approved-note deletion also removes review history. ElevenLabs keys and voices are set only in Echo settings.',
    workflow: [
      'Call list_decks when the requested deck is not obvious.',
      'Use language to select a unique deck; otherwise add its exact name or deckId.',
      'Call get_deck_contract before generating notes.',
      'Call save_draft_notes and tell the user to review the new draft batch in Echo.',
    ],
    managementWorkflow: [
      'Find notes with list_notes (approved, draft or all; filter by tags, states or text) or list_draft_notes / list_draft_batches.',
      'Edit fields or tags with update_notes (per note) or edit_note_tags (many notes, or a whole batch by batchId).',
      'Publish drafts with approve_drafts (or create published notes directly with create_notes); resolve open similar-note conflicts first with resolve_draft_conflict.',
      'Voice notes with generate_note_audio (check get_audio_settings if it fails); call again while remaining > 0.',
      'Delete with delete_notes or delete_draft_batch, always with confirm: true after the user asked.',
    ],
    tools: {
      list_decks: 'Lists only the authenticated user\'s decks and recommended selectors.',
      get_echo_guide: 'Explains the workflow and can include a selected deck contract and example.',
      get_deck_contract: 'Returns fields, required keys, enum values, and a valid save example.',
      save_draft_notes: 'Creates drafts; it never publishes notes.',
      list_draft_batches: 'Lists the user\'s draft import batches, optionally by deck.',
      list_draft_notes: 'Lists the user\'s draft notes, optionally by deck or batch.',
      list_notes: 'Lists notes of a deck (approved, draft or all) with fields, tags, memory state and cards; filters by tags, states and text.',
      get_note: 'Returns one note with fields, tags, memory state and cards.',
      update_notes: 'Edits fields (partial patch) and tags of drafts or approved notes; approved notes keep their review history.',
      edit_note_tags: 'Adds, removes or replaces tags on many notes, or on every note of a draft batch.',
      approve_drafts: 'Publishes drafts by noteIds or batchId, like Approve in Echo.',
      resolve_draft_conflict: 'Keeps both, ignores, or applies a draft to the similar existing note.',
      delete_notes: 'Deletes notes (confirm: true); approved notes lose their cards and review history.',
      delete_draft_batch: 'Deletes a draft-only batch (confirm: true).',
      create_notes: 'Creates notes that are study cards right away (saved and approved in one step).',
      generate_note_audio: 'Voices notes without audio (or force-regenerates) with the user\'s ElevenLabs voice; repeat while remaining > 0.',
      get_audio_settings: 'Shows whether ElevenLabs is connected and which voice each language uses.',
      create_deck: 'Creates a deck with a study and a translation language.',
      get_dashboard: 'Home screen numbers per deck: due, total, drafts, done today.',
      get_study_stats: 'Statistics page: today, card states, weekly activity and streak, daily reviews.',
      complete_review_session: 'Marks today\'s session for a deck as done after the last card.',
      get_review_session: 'Loads due cards, manual-study cards (tags, states, audio) or extra-study cards for a spoken review, with question, answer and accepted variants.',
      submit_review: 'Grades one card (again/hard/good/easy) and updates the spaced-repetition schedule like the app.',
    },
    reviewWorkflow: [
      'Call get_review_session with a deck selector (mode due, or mode tag with tags).',
      'Read each question, check the spoken answer against acceptedAnswers ignoring diacritics, and judge by sound.',
      'Call submit_review immediately after each card.',
      'Call complete_review_session after the last card so the deck shows as done today.',
    ],
    selectorExamples: [
      { language: 'turkish' },
      { language: 'turkish', name: 'Turkish A2' },
      { deckId: 'UUID returned by list_decks' },
    ],
    selectedDeck: deck ? buildDeckContract(deck) : null,
  }
}
