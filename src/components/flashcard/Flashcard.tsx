"use client"

import * as React from "react"
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
  audioUrl,
  language,
  direction,
  isRevealed,
  onReveal,
  onRate,
  onPlayAudio,
  intervals,
}: FlashcardProps) {
  const isCzech = language === "czech"

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

  // What shows as the large headline
  const primaryWord = isProduction && !isRevealed ? translation : expression

  // Whether the primary word (expression) row exists
  const showExpressionRow = isRecognition || (isProduction && isRevealed)

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
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
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
  }, [isRevealed, onReveal, onRate])

  return (
    <div className="flex flex-col gap-4 w-full max-w-xl mx-auto select-none">
      {/* ── Card body ── */}
      <div
        role={!isRevealed ? "button" : undefined}
        tabIndex={!isRevealed ? 0 : undefined}
        aria-label={!isRevealed ? "Reveal answer (Space)" : undefined}
        onClick={!isRevealed ? onReveal : undefined}
        onKeyDown={
          !isRevealed
            ? (e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault()
                  onReveal()
                }
              }
            : undefined
        }
        className={[
          "relative rounded-2xl border border-foreground/10",
          "bg-card text-card-foreground",
          "shadow-sm ring-1 ring-foreground/5",
          "transition-all duration-200",
          !isRevealed
            ? "cursor-pointer hover:shadow-md hover:ring-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            : "cursor-default",
        ].join(" ")}
      >
        <div className="flex flex-col gap-5 p-6">
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
                className="overflow-hidden transition-all duration-300 ease-out"
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

          {/* ── Reveal hint (front only) ── */}
          {!isRevealed && (
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
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: isRevealed ? "10rem" : "0",
          opacity: isRevealed ? 1 : 0,
          pointerEvents: isRevealed ? "auto" : "none",
        }}
      >
        <RatingButtons onRate={onRate} intervals={intervals} />
      </div>
    </div>
  )
}
