import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { fn } from "storybook/test"
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
  name: "With Audio",
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
  name: "Light Theme",
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
  name: "Dark Theme",
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
  name: "All CEFR Levels",
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
  name: "Rating Buttons Visible",
  render: (args) => <InteractiveFlashcard {...args} />,
  args: {
    ...CZECH_DATA,
    direction: "recognition",
    isRevealed: true,
  },
}
