'use client'

import { ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  getFsrsStateLabel,
  type AudioFilter,
  type FsrsState,
} from '@/lib/deck-notes'
import type { Language } from '@/lib/types'
import { useTranslations } from 'next-intl'

interface DeckFiltersBarProps {
  deckLanguage: Language
  availableTags: string[]
  tagQuery: string
  activeTags: string[]
  activeStates: FsrsState[]
  activeAudioFilter: AudioFilter
  fsrsFilters: FsrsState[]
  isRefreshing?: boolean
  onTagQueryChange: (value: string) => void
  onClearTagSearchAndFilter: () => void
  onResetTags: () => void
  onToggleTag: (tag: string) => void
  onResetStates: () => void
  onToggleState: (state: FsrsState) => void
  onAudioFilterChange: (filter: AudioFilter) => void
}

export function formatTagLabelForLanguage(tag: string, deckLanguage: Language) {
  if (deckLanguage === 'english' && tag.startsWith('ENGLISH::')) {
    return tag.slice('ENGLISH::'.length)
  }

  if (deckLanguage === 'turkish' && tag.startsWith('TURKISH::')) {
    return tag.slice('TURKISH::'.length)
  }

  return tag
}

export function DeckFiltersBar({
  deckLanguage,
  availableTags,
  tagQuery,
  activeTags,
  activeStates,
  activeAudioFilter,
  fsrsFilters,
  isRefreshing = false,
  onTagQueryChange,
  onClearTagSearchAndFilter,
  onResetTags,
  onToggleTag,
  onResetStates,
  onToggleState,
  onAudioFilterChange,
}: DeckFiltersBarProps) {
  const t = useTranslations('deckFilters')
  const filteredAvailableTags = availableTags.filter((tag) =>
    formatTagLabelForLanguage(tag, deckLanguage)
      .toLowerCase()
      .includes(tagQuery.trim().toLowerCase())
  )

  const tagSummary =
    activeTags.length === 0
      ? t('allTags')
      : activeTags.length === 1
        ? formatTagLabelForLanguage(activeTags[0], deckLanguage)
        : t('tagCount', { count: activeTags.length })

  const levelSummary =
    activeStates.length === 0
      ? t('allLevels')
      : activeStates.length === 1
        ? t(`state${getFsrsStateLabel(activeStates[0])}`)
        : t('levelCount', { count: activeStates.length })

  const audioSummary =
    activeAudioFilter === 'all'
      ? t('allNotes')
      : activeAudioFilter === 'with_audio'
        ? t('withAudio')
        : t('withoutAudio')

  return (
    <section className="rounded-2xl border bg-card px-4 py-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" className="w-[280px] justify-between" title={tagSummary} />
            }
          >
            <span className="min-w-0 truncate text-left">{t('tagsTrigger', { summary: tagSummary })}</span>
            <ChevronDown className="h-4 w-4 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[280px]">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t('tags')}</DropdownMenuLabel>
              <div className="px-1.5 py-1">
                <div className="relative">
                  <Input
                    value={tagQuery}
                    onChange={(e) => onTagQueryChange(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    placeholder={t('tagSearch')}
                    className="h-8 pr-8"
                  />
                  {(tagQuery.length > 0 || activeTags.length > 0) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onClearTagSearchAndFilter()
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={t('clearTagSearch')}
                      title={t('clearTagSearch')}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <DropdownMenuCheckboxItem
                checked={activeTags.length === 0}
                onCheckedChange={onResetTags}
              >
                {t('allTags')}
              </DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {filteredAvailableTags.map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag}
                  checked={activeTags.includes(tag)}
                  onCheckedChange={() => onToggleTag(tag)}
                >
                  {formatTagLabelForLanguage(tag, deckLanguage)}
                </DropdownMenuCheckboxItem>
              ))}
              {filteredAvailableTags.length === 0 && (
                <div className="px-2 py-2 text-xs text-muted-foreground">
                  {t('nothingFound')}
                </div>
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" className="w-[280px] justify-between" title={levelSummary} />
            }
          >
            <span className="min-w-0 truncate text-left">{t('level', { summary: levelSummary })}</span>
            <ChevronDown className="h-4 w-4 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[280px]">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t('fsrsLevel')}</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={activeStates.length === 0}
                onCheckedChange={onResetStates}
              >
                {t('allLevels')}
              </DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {fsrsFilters.map((state) => (
                <DropdownMenuCheckboxItem
                  key={state}
                  checked={activeStates.includes(state)}
                  onCheckedChange={() => onToggleState(state)}
                >
                  {t(`state${getFsrsStateLabel(state)}`)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" className="w-[220px] justify-between" title={audioSummary} />
            }
          >
            <span className="min-w-0 truncate text-left">{t('audio', { summary: audioSummary })}</span>
            <ChevronDown className="h-4 w-4 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[220px]">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t('audioLabel')}</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={activeAudioFilter === 'all'}
                onCheckedChange={() => onAudioFilterChange('all')}
              >
                {t('allNotes')}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeAudioFilter === 'with_audio'}
                onCheckedChange={() => onAudioFilterChange('with_audio')}
              >
                {t('withAudio')}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeAudioFilter === 'without_audio'}
                onCheckedChange={() => onAudioFilterChange('without_audio')}
              >
                {t('withoutAudio')}
              </DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {isRefreshing && <span className="text-xs text-muted-foreground">{t('syncing')}</span>}
      </div>
    </section>
  )
}
