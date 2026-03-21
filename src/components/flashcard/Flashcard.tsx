"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { LevelBadge, type CEFRLevel } from "./LevelBadge"
import { FrequencyBar } from "./FrequencyBar"
import { PlayButton } from "./PlayButton"
import { RatingButtons } from "./RatingButtons"
import { ExamplesList } from "./ExamplesList"

export interface FlashcardProps {
  // Content
  expression: string
  translation: string
  examples: string[] // 2 sentences, may contain <b> tags
  level: CEFRLevel
  partOfSpeech: string
  gender?: string // Czech only (mužský, ženský, střední)
  frequency: number // 1-10
  style: string // e.g. '🎓 Neutrální'
  note?: string // Grammar note, Czech only
  synonyms?: string[]
  antonyms?: string[]
  audioUrl?: string
  imageUrl?: string
  language: "czech" | "english"

  // State
  direction: "recognition" | "production"
  isRevealed: boolean
  onReveal: () => void
  onRate: (rating: 1 | 2 | 3 | 4) => void
  onPlayAudio?: () => void

  // FSRS scheduling info (shown on rating buttons)
  intervals?: {
    again: string
    hard: string
    good: string
    easy: string
  }

  // Header action (e.g. Edit note button)
  headerAction?: React.ReactNode
  previewMode?: boolean
  mobileActionsSticky?: boolean
  renderRatingButtons?: boolean
  className?: string
}

export function Flashcard({
  expression,
  translation,
  examples,
  level,
  partOfSpeech,
  gender,
  frequency,
  style,
  note,
  synonyms,
  antonyms,
  audioUrl,
  language,
  direction,
  isRevealed,
  onReveal,
  onRate,
  onPlayAudio,
  intervals,
  headerAction,
  previewMode = false,
  mobileActionsSticky = false,
  renderRatingButtons = true,
  className,
}: FlashcardProps) {
  const isCzech = language === "czech"
  const [isPressingReveal, setIsPressingReveal] = React.useState(false)

  /**
   * Visibility matrix:
   *
   *                  recognition/front  recognition/back  production/front  production/back
   * primaryWord         expression         expression        translation      expression
   * secondaryWord       —                  translation       —                translation
   * examples            ✓                  ✓                 —                ✓
   * playButton          only if audioUrl   only if audioUrl  —                only if audioUrl
   */
  const isRecognition = direction === "recognition"
  const isProduction = direction === "production"

  // Secondary line (parenthesised translation) visible only after reveal
  const showSecondaryTranslation = isRevealed
  const secondaryText = `(${translation})`

  // For production front: the headline IS the translation
  const showProductionFront = isProduction && !isRevealed

  // Show examples after reveal in production, always in recognition
  const showExamples = isRecognition || (isProduction && isRevealed)

  // Play button: only when expression is visible
  const expressionVisible = isRecognition || (isProduction && isRevealed)
  const showPlayButton = expressionVisible && !!audioUrl && !!onPlayAudio

  // Keyboard shortcuts
  React.useEffect(() => {
    if (previewMode) return

    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      )
        return

      if (!isRevealed && (e.key === " " || e.key === "Spacebar")) {
        e.preventDefault()
        onReveal()
      }

      if (isRevealed) {
        if (e.key === "1") onRate(1)
        else if (e.key === "2") onRate(2)
        else if (e.key === "3") onRate(3)
        else if (e.key === "4") onRate(4)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isRevealed, onReveal, onRate, previewMode])

  return (
    <div
      className={cn(
        "flex flex-col gap-4 w-full mx-auto select-none",
        previewMode ? "max-w-none" : "max-w-xl",
        className
      )}
    >
      {/* ── Card body ── */}
      <div
        role={!previewMode && !isRevealed ? "button" : undefined}
        tabIndex={!previewMode && !isRevealed ? 0 : undefined}
        aria-label={!previewMode && !isRevealed ? "Reveal answer (Space)" : undefined}
        onClick={!previewMode && !isRevealed ? onReveal : undefined}
        onPointerDown={
          !previewMode && !isRevealed
            ? () => setIsPressingReveal(true)
            : undefined
        }
        onPointerUp={!previewMode && !isRevealed ? () => setIsPressingReveal(false) : undefined}
        onPointerCancel={!previewMode && !isRevealed ? () => setIsPressingReveal(false) : undefined}
        onPointerLeave={!previewMode && !isRevealed ? () => setIsPressingReveal(false) : undefined}
        onKeyDown={
          !previewMode && !isRevealed
            ? (e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault()
                  setIsPressingReveal(false)
                  onReveal()
                }
              }
            : undefined
        }
        className={[
          "relative rounded-2xl border border-foreground/10",
          "bg-card text-card-foreground",
          "shadow-sm ring-1 ring-foreground/5",
          "touch-manipulation [webkit-tap-highlight-color:transparent] transition-all duration-150",
          !previewMode && !isRevealed
            ? "cursor-pointer hover:shadow-md hover:ring-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            : "cursor-default",
          isPressingReveal ? "scale-[0.995] shadow-xs ring-foreground/10" : "",
        ].join(" ")}
      >
        <div className="flex flex-col gap-5 p-6 relative">
          {/* Header action (e.g. NoteEditSheet trigger) */}
          {headerAction && (
            <div className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
              {headerAction}
            </div>
          )}

          {/* ── Headline area ── */}
          <div className="flex items-start gap-3">
            {/* Play button — left of headline, only when expression visible */}
            {showPlayButton && onPlayAudio && (
              <div className="flex-shrink-0 mt-1">
                <PlayButton onPlay={onPlayAudio} />
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Primary headline word */}
              <h2 className="text-3xl font-bold tracking-tight text-foreground leading-tight break-words">
                {showProductionFront ? translation : expression}
              </h2>

              {/*
               * Secondary translation line — always in DOM to prevent layout shift.
               * Uses height transition via max-height trick.
               */}
              <div
                className="overflow-hidden transition-all duration-150 ease-out"
                style={{
                  maxHeight: showSecondaryTranslation ? "5rem" : "0",
                  opacity: showSecondaryTranslation ? 1 : 0,
                  marginTop: showSecondaryTranslation ? "0.25rem" : "0",
                }}
                aria-hidden={!showSecondaryTranslation}
              >
                <p className="text-lg text-muted-foreground font-medium">
                  {secondaryText}
                </p>
              </div>
            </div>
          </div>

          {/* ── Gradient divider ── */}
          <div
            className="h-px rounded-full"
            style={{
              background:
                "linear-gradient(90deg, hsl(var(--foreground) / 0.15) 0%, transparent 80%)",
            }}
          />

          {/* ── Example sentences ── */}
          {showExamples && examples.length > 0 && (
            <ExamplesList examples={examples} />
          )}

          {/* ── Metadata ── */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <LevelBadge level={level} />

            <span className="text-xs text-muted-foreground select-none">·</span>

            <span className="text-xs text-foreground/70 font-medium capitalize">
              {partOfSpeech}
            </span>

            {isCzech && gender && (
              <>
                <span className="text-xs text-muted-foreground select-none">·</span>
                <span className="text-xs text-foreground/70 font-medium underline decoration-dotted underline-offset-2">
                  {gender}
                </span>
              </>
            )}
          </div>

          {/* ── Frequency bar ── */}
          <FrequencyBar frequency={frequency} />

          {/* ── Style label ── */}
          <p className="text-xs text-muted-foreground -mt-2">{style}</p>

          {/* ── Grammar note (Czech only) ── */}
          {isCzech && note && (
            <div className="rounded-lg border border-foreground/8 bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground/60">Pozn.: </span>
                {note}
              </p>
            </div>
          )}

          {/* ── Synonyms & Antonyms (after reveal only) ── */}
          {isRevealed && (synonyms?.length || antonyms?.length) ? (
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              {synonyms && synonyms.length > 0 && (
                <p>
                  <span className="font-medium text-foreground/60">Synonyms: </span>
                  {synonyms.join(', ')}
                </p>
              )}
              {antonyms && antonyms.length > 0 && (
                <p>
                  <span className="font-medium text-foreground/60">Antonyms: </span>
                  {antonyms.join(', ')}
                </p>
              )}
            </div>
          ) : null}

          {/* ── Reveal hint (front only) ── */}
          {!previewMode && !isRevealed && (
            <div className="flex justify-center pt-1">
              <span className="text-xs text-muted-foreground/50 tracking-wide">
                Press{" "}
                <kbd className="rounded border border-foreground/10 bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                  Space
                </kbd>{" "}
                or click to reveal
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Rating buttons — outside the card, animate in ── */}
      {!previewMode && renderRatingButtons && (
        <>
          <div
            className="overflow-hidden transition-all duration-150 ease-out md:block"
            style={{
              maxHeight: isRevealed ? "10rem" : "0",
              opacity: isRevealed ? 1 : 0,
              pointerEvents: isRevealed ? "auto" : "none",
            }}
          >
            <div className={cn(mobileActionsSticky && "hidden md:block")}>
              <RatingButtons onRate={onRate} intervals={intervals} />
            </div>
          </div>

          {mobileActionsSticky && (
            <>
              <div
                className="fixed inset-x-0 bottom-0 z-40 px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.85rem)] md:hidden"
                style={{
                  opacity: isRevealed ? 1 : 0,
                  pointerEvents: isRevealed ? "auto" : "none",
                  transform: isRevealed ? "translateY(0)" : "translateY(16px)",
                  transition: "opacity 160ms ease-out, transform 180ms ease-out",
                }}
              >
                <div className="mx-auto max-w-xl rounded-[28px] border border-foreground/10 bg-background/92 p-3 shadow-[0_-10px_35px_-26px_hsl(var(--foreground)/0.45)] backdrop-blur-xl">
                  <RatingButtons onRate={onRate} intervals={intervals} stickyMobile />
                </div>
              </div>
              {isRevealed && <div className="h-28 md:hidden" aria-hidden="true" />}
            </>
          )}
        </>
      )}
    </div>
  )
}
