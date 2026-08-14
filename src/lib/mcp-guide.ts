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
      'Saved notes are drafts. The user reviews and approves them in Echo.',
    ],
    exampleItem,
    saveExample: { ...selector, items: [exampleItem], metadata: { topic: 'example' } },
  }
}

export function buildEchoGuide(deck?: McpDeck) {
  return {
    safety: 'MCP can read your Echo decks and drafts and create draft notes. Approval, publishing, and deletion stay in Echo.',
    workflow: [
      'Call list_decks when the requested deck is not obvious.',
      'Use language to select a unique deck; otherwise add its exact name or deckId.',
      'Call get_deck_contract before generating notes.',
      'Call save_draft_notes and tell the user to review the new draft batch in Echo.',
    ],
    tools: {
      list_decks: 'Lists only the authenticated user\'s decks and recommended selectors.',
      get_echo_guide: 'Explains the workflow and can include a selected deck contract and example.',
      get_deck_contract: 'Returns fields, required keys, enum values, and a valid save example.',
      save_draft_notes: 'Creates drafts only; it never publishes notes.',
      list_draft_batches: 'Lists the user\'s draft import batches, optionally by deck.',
      list_draft_notes: 'Lists the user\'s draft notes, optionally by deck or batch.',
    },
    selectorExamples: [
      { language: 'turkish' },
      { language: 'turkish', name: 'Turkish A2' },
      { deckId: 'UUID returned by list_decks' },
    ],
    selectedDeck: deck ? buildDeckContract(deck) : null,
  }
}
