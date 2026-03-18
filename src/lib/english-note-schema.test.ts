import { describe, expect, it } from 'vitest'

import {
  buildSanitizedExamplesHtmlFromImportedHtml,
  normalizeEnglishNoteFields,
} from './english-note-schema'

describe('normalizeEnglishNoteFields', () => {
  it('prefers canonical examples_html over legacy collocations', () => {
    expect(
      normalizeEnglishNoteFields({
        word: 'anchor',
        translation: 'якорь',
        examples_html: '<ul><li>Use the <b>anchor</b>.</li></ul>',
        collocations: '<ul><li>stale legacy example</li></ul>',
      })
    ).toEqual({
      word: 'anchor',
      translation: 'якорь',
      examples_html: '<ul><li>Use the <b>anchor</b>.</li></ul>',
    })
  })
})

describe('buildSanitizedExamplesHtmlFromImportedHtml', () => {
  it('sanitizes imported html into escaped list markup', () => {
    expect(
      buildSanitizedExamplesHtmlFromImportedHtml(
        '<ul><li>Drop the <b>anchor</b>.</li><li><script>alert(1)</script>Storm ahead</li></ul>'
      )
    ).toEqual('<ul><li>Drop the anchor.</li><li>alert(1) Storm ahead</li></ul>')
  })

  it('falls back to sanitized plain text when there are no list items', () => {
    expect(
      buildSanitizedExamplesHtmlFromImportedHtml('<div>Carry <b>on</b></div>\n<div>Move <i>forward</i></div>')
    ).toEqual('<ul><li>Carry on</li><li>Move forward</li></ul>')
  })
})
