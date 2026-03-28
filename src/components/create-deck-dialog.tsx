'use client'

import { useState, type ReactElement } from 'react'
import { useRouter } from 'next/navigation'
import { createDeck } from '@/lib/actions/decks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Language } from '@/lib/types'

interface CreateDeckDialogProps {
  trigger?: ReactElement
}

export function CreateDeckDialog({ trigger }: CreateDeckDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [language, setLanguage] = useState<Language>('czech')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await createDeck(name.trim(), language)
      setOpen(false)
      setName('')
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? <Button />}>+ Новая колода</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать колоду</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Название</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Чешский B1"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Язык</Label>
            <Select value={language} onValueChange={(v) => v && setLanguage(v as Language)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="czech">🇨🇿 Чешский</SelectItem>
                <SelectItem value="english">🇬🇧 Английский</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Создаём...' : 'Создать'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
