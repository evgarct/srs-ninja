import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getDeckWithStats } from '@/lib/actions/decks'
import { getNotesByDeck } from '@/lib/actions/notes'
import Link from 'next/link'
import { buttonVariants } from '@/lib/button-variants'
import { Badge } from '@/components/ui/badge'
import { getNoteTitle } from '@/lib/note-fields'
import type { Language } from '@/lib/types'
import { DeleteNoteButton } from '@/components/delete-note-button'

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ deck, dueCards, totalCards, totalNotes }, notes] = await Promise.all([
    getDeckWithStats(id),
    getNotesByDeck(id),
  ])

  if (!deck) redirect('/')

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-1">
        <Link href="/" className="text-muted-foreground hover:text-foreground text-sm">← Главная</Link>
      </div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{deck.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {totalNotes} нотов · {totalCards} карточек · {dueCards} к повторению
          </p>
        </div>
        <div className="flex gap-2">
          {dueCards > 0 && (
            <Link href={`/review/${id}`} className={buttonVariants()}>
              Учить ({dueCards})
            </Link>
          )}
          <Link href={`/notes/new?deckId=${id}`} className={buttonVariants({ variant: 'outline' })}>
            + Нот
          </Link>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-2">Нет нотов</p>
          <p className="text-sm">Добавьте первый нот или импортируйте из Anki</p>
          <div className="flex gap-2 justify-center mt-4">
            <Link href={`/notes/new?deckId=${id}`} className={buttonVariants({ variant: 'outline' })}>
              Добавить нот
            </Link>
            <Link href="/import" className={buttonVariants({ variant: 'outline' })}>
              Импорт из Anki
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => {
            const fields = note.fields as Record<string, string>
            const title = getNoteTitle(fields, deck.language as Language)
            const cards = note.cards as Array<{ id: string; card_type: string; state: string }>
            return (
              <div
                key={note.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:border-foreground/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{title}</p>
                  <div className="flex gap-1 mt-1">
                    {fields.level && (
                      <Badge variant="outline" className="text-xs">{fields.level}</Badge>
                    )}
                    {fields.part_of_speech && (
                      <Badge variant="outline" className="text-xs">{fields.part_of_speech}</Badge>
                    )}
                    {cards.map((c) => (
                      <Badge
                        key={c.id}
                        variant={c.state === 'new' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {c.card_type === 'recognition' ? '👁' : '✍️'} {c.state}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 ml-3 shrink-0">
                  <Link
                    href={`/notes/${note.id}/edit`}
                    className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                  >
                    Изменить
                  </Link>
                  <DeleteNoteButton noteId={note.id} deckId={id} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
