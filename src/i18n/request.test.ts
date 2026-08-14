import { describe, expect, it } from 'vitest'

import { detectLocaleFromAcceptLanguage } from './request'

describe('locale detection', () => {
  it('detects Turkish regional browser locales', () => {
    expect(detectLocaleFromAcceptLanguage('tr-TR,tr;q=0.9,en;q=0.8')).toBe('tr')
  })

  it('keeps the supported-language priority order from the header', () => {
    expect(detectLocaleFromAcceptLanguage('de-DE,de;q=0.9,tr;q=0.8')).toBe('tr')
  })
})
