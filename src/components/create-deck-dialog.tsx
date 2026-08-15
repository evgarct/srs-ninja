'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createDeck } from '@/lib/actions/decks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Language, TranslationLanguage } from '@/lib/types'
import { getAvailableTranslationLanguages } from '@/lib/deck-languages'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

interface CreateDeckDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
}

export function CreateDeckDialog({ open, onOpenChange }: CreateDeckDialogProps) {
  const [name, setName] = useState('')
  const [language, setLanguage] = useState<Language>('czech')
  const [translationLanguage, setTranslationLanguage] = useState<TranslationLanguage>('russian')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const t = useTranslations('createDeck')
  const languageItems = [
    { value: 'czech' as const, label: t('langCzech') },
    { value: 'english' as const, label: t('langEnglish') },
    { value: 'turkish' as const, label: t('langTurkish') },
  ]
  const translationLabelKeys: Record<TranslationLanguage, 'translationRussian' | 'translationEnglish' | 'translationCzech' | 'translationTurkish'> = {
    russian: 'translationRussian',
    english: 'translationEnglish',
    czech: 'translationCzech',
    turkish: 'translationTurkish',
  }
  const translationItems = getAvailableTranslationLanguages(language).map((value) => ({
    value,
    label: t(translationLabelKeys[value]),
  }))

  function handleLanguageChange(value: Language) {
    setLanguage(value)
    if (value === translationLanguage) {
      setTranslationLanguage('russian')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await createDeck(name.trim(), language, translationLanguage)
      onOpenChange(false)
      setName('')
      router.refresh()
    } catch {
      toast.error(t('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">{t('name')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="deck-language">{t('language')}</Label>
            <Select items={languageItems} value={language} onValueChange={(v) => v && handleLanguageChange(v as Language)}>
              <SelectTrigger id="deck-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {languageItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="translation-language">{t('translationLanguage')}</Label>
            <Select
              items={translationItems}
              value={translationLanguage}
              onValueChange={(v) => v && setTranslationLanguage(v as TranslationLanguage)}
            >
              <SelectTrigger id="translation-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {translationItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? t('creating') : t('create')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
