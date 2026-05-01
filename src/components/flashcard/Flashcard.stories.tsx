import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { fn, within, userEvent, expect } from "storybook/test"
import { Flashcard } from "./Flashcard"
import type { FlashcardProps } from "./Flashcard"
import type { CEFRLevel } from "./LevelBadge"

// ── Shared sample data ────────────────────────────────────────────────────────

const CZECH_DATA = {
  expression: "konev",
  translation: "лейка",
  examples: [
    "Na zahradě jsme použili <b>konev</b> na zalévání květin.",
    "Děti si hrály s vodou z <b>konve</b>.",
  ],
  level: "A1" as CEFRLevel,
  partOfSpeech: "podstatné jméno",
  gender: "ženský",
  frequency: 7,
  style: "🎓 Neutrální",
  note: "č. mn.: konve",
  language: "czech" as const,
  intervals: { again: "<10m", hard: "<15m", good: "18d", easy: "29d" },
}

const ENGLISH_DATA = {
  expression: "cauldron",
  translation: "котёл ведьмы",
  examples: [
    "The witch stirred her bubbling <b>cauldron</b>.",
    "Smoke rose from the <b>cauldron</b> filled with a strange potion.",
  ],
  level: "B1" as CEFRLevel,
  partOfSpeech: "noun",
  frequency: 4,
  style: "🎓 Neutral / Folklore or fantasy object",
  language: "english" as const,
  intervals: { again: "<10m", hard: "<15m", good: "21d", easy: "42d" },
}

// ── Interactive wrapper ───────────────────────────────────────────────────────

function InteractiveFlashcard(props: Omit<FlashcardProps, "isRevealed" | "onReveal" | "onRate">) {
  const [isRevealed, setIsRevealed] = useState(false)

  return (
    <div className="p-6 min-w-[28rem]">
      <Flashcard
        {...props}
        isRevealed={isRevealed}
        onReveal={() => setIsRevealed(true)}
        onRate={(r) => {
          console.log("Rated:", r)
          setIsRevealed(false)
        }}
      />
    </div>
  )
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<typeof Flashcard> = {
  title: "Flashcard/Flashcard",
  component: Flashcard,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: {
    onReveal: fn(),
    onRate: fn(),
  },
}
export default meta

type Story = StoryObj<typeof Flashcard>

// ── Czech stories ─────────────────────────────────────────────────────────────

export const CzechRecognitionFront: Story = {
  name: "Czech · Recognition · Front",
  render: (args) => <InteractiveFlashcard {...args} />,
  args: {
    ...CZECH_DATA,
    direction: "recognition",
    isRevealed: false,
  },
}

export const CzechRecognitionBack: Story = {
  name: "Czech · Recognition · Back",
  render: (args) => <InteractiveFlashcard {...args} />,
  args: {
    ...CZECH_DATA,
    direction: "recognition",
    isRevealed: true,
  },
}

export const CzechProductionFront: Story = {
  name: "Czech · Production · Front",
  render: (args) => <InteractiveFlashcard {...args} />,
  args: {
    ...CZECH_DATA,
    direction: "production",
    isRevealed: false,
  },
}

export const CzechProductionBack: Story = {
  name: "Czech · Production · Back",
  render: (args) => <InteractiveFlashcard {...args} />,
  args: {
    ...CZECH_DATA,
    direction: "production",
    isRevealed: true,
  },
}

// ── English stories ───────────────────────────────────────────────────────────

export const EnglishRecognitionFront: Story = {
  name: "English · Recognition · Front",
  render: (args) => <InteractiveFlashcard {...args} />,
  args: {
    ...ENGLISH_DATA,
    direction: "recognition",
    isRevealed: false,
  },
}

export const EnglishRecognitionBack: Story = {
  name: "English · Recognition · Back",
  render: (args) => <InteractiveFlashcard {...args} />,
  args: {
    ...ENGLISH_DATA,
    direction: "recognition",
    isRevealed: true,
  },
}

export const EnglishProductionFront: Story = {
  name: "English · Production · Front",
  render: (args) => <InteractiveFlashcard {...args} />,
  args: {
    ...ENGLISH_DATA,
    direction: "production",
    isRevealed: false,
  },
}

export const EnglishProductionBack: Story = {
  name: "English · Production · Back",
  render: (args) => <InteractiveFlashcard {...args} />,
  args: {
    ...ENGLISH_DATA,
    direction: "production",
    isRevealed: true,
  },
}

// ── With audio ────────────────────────────────────────────────────────────────

export const WithAudio: Story = {
  render: (args) => <InteractiveFlashcard {...args} />,
  args: {
    ...CZECH_DATA,
    direction: "recognition",
    isRevealed: false,
    audioUrl: "https://example.com/konev.mp3",
    onPlayAudio: fn(),
  },
}

// ── Themes ────────────────────────────────────────────────────────────────────

export const LightTheme: Story = {
  render: (args) => (
    <div data-theme="light" className="bg-background min-h-screen">
      <InteractiveFlashcard {...args} />
    </div>
  ),
  args: {
    ...CZECH_DATA,
    direction: "recognition",
    isRevealed: false,
  },
  parameters: { backgrounds: { default: "light" } },
}

export const DarkTheme: Story = {
  render: (args) => (
    <div data-theme="dark" className="dark bg-background min-h-screen">
      <InteractiveFlashcard {...args} />
    </div>
  ),
  args: {
    ...CZECH_DATA,
    direction: "recognition",
    isRevealed: false,
  },
  parameters: { backgrounds: { default: "dark" } },
}

// ── All CEFR levels ───────────────────────────────────────────────────────────

const ALL_LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"]

export const AllCEFRLevels: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6 p-6">
      {ALL_LEVELS.map((level) => {
        const [revealed, setRevealed] = useState(false)
        return (
          <div key={level} className="w-[22rem]">
            <Flashcard
              {...CZECH_DATA}
              level={level}
              direction="recognition"
              isRevealed={revealed}
              onReveal={() => setRevealed(true)}
              onRate={() => setRevealed(false)}
            />
          </div>
        )
      })}
    </div>
  ),
}

// ── Rating buttons visible ────────────────────────────────────────────────────

export const RatingButtonsVisible: Story = {
  render: (args) => <InteractiveFlashcard {...args} />,
  args: {
    ...CZECH_DATA,
    direction: "recognition",
    isRevealed: true,
  },
}

export const MobileAppReview: Story = {
  render: (args) => (
    <div className="min-h-screen bg-muted/20 p-3">
      <div className="relative mx-auto max-w-[24rem] overflow-hidden rounded-[30px] border border-foreground/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))] p-3 shadow-[0_18px_60px_-34px_hsl(var(--foreground)/0.55)]">
        <div className="pointer-events-none absolute left-1/2 top-0 h-full w-44 -translate-x-1/2 bg-[linear-gradient(180deg,rgba(255,248,214,0.00),rgba(255,248,214,0.16),rgba(193,231,255,0.28),rgba(255,255,255,0.40),rgba(193,231,255,0.20),rgba(255,248,214,0.00))] blur-2xl" />
        <InteractiveFlashcard {...args} mobileActionsSticky />
      </div>
    </div>
  ),
  args: {
    ...ENGLISH_DATA,
    direction: "recognition",
    isRevealed: true,
    audioUrl: "https://example.com/bow.mp3",
    onPlayAudio: fn(),
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
}

export const MobileTouchReview: Story = {
  render: (args) => (
    <div className="mx-auto w-[22rem] max-w-full p-3">
      <InteractiveFlashcard {...args} />
    </div>
  ),
  args: {
    ...ENGLISH_DATA,
    direction: "recognition",
    isRevealed: false,
    audioUrl: "https://example.com/cauldron.mp3",
    onPlayAudio: fn(),
  },
}

// ── Interaction tests (hidden from sidebar, run in CI) ────────────────────────

export const RevealFlow: Story = {
  name: "Czech · Reveal Flow",
  render: (args) => <InteractiveFlashcard {...args} />,
  args: {
    ...CZECH_DATA,
    direction: "recognition",
    isRevealed: false,
  },
  tags: ["!dev"],
  parameters: { a11y: { test: "error" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Card is in front state — reveal button visible, no rating group yet
    const revealBtn = await canvas.findByRole("button", { name: /Reveal answer/i })
    expect(canvas.queryByRole("group", { name: /Rate your recall/i })).toBeNull()
    // Click to reveal the answer
    await userEvent.click(revealBtn)
    // Rating button group should now appear
    const ratingGroup = await canvas.findByRole("group", { name: /Rate your recall/i })
    // All 4 rating buttons are present
    expect(within(ratingGroup).getAllByRole("button")).toHaveLength(4)
    await canvas.findByRole("button", { name: /Again/i })
    await canvas.findByRole("button", { name: /Good/i })
  },
}

export const KeyboardRevealAndRate: Story = {
  name: "Czech · Keyboard Reveal & Rate",
  render: (args) => <InteractiveFlashcard {...args} />,
  args: {
    ...CZECH_DATA,
    direction: "recognition",
    isRevealed: false,
  },
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Reveal via Space key (window-level keydown handler)
    await canvas.findByRole("button", { name: /Reveal answer/i })
    await userEvent.keyboard(" ")
    // Rating group appears after reveal
    await canvas.findByRole("group", { name: /Rate your recall/i })
    // Press digit 3 to rate "Good" (window-level handler)
    await userEvent.keyboard("3")
    // After rating, InteractiveFlashcard resets isRevealed → card returns to front
    await canvas.findByRole("button", { name: /Reveal answer/i })
  },
}
