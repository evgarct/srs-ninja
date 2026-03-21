import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { fn } from "storybook/test"
import { RatingButtons } from "./RatingButtons"

const meta: Meta<typeof RatingButtons> = {
  title: "Flashcard/RatingButtons",
  component: RatingButtons,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { onRate: fn() },
}
export default meta

type Story = StoryObj<typeof RatingButtons>

export const WithIntervals: Story = {
  args: {
    intervals: {
      again: "<10m",
      hard: "<15m",
      good: "18d",
      easy: "29d",
    },
  },
}

export const WithoutIntervals: Story = {}

export const LongIntervals: Story = {
  args: {
    intervals: {
      again: "<10m",
      hard: "3d",
      good: "21d",
      easy: "42d",
    },
  },
}

export const MobileTouchTargets: Story = {
  args: {
    intervals: {
      again: "<1m",
      hard: "12m",
      good: "3d",
      easy: "8d",
    },
  },
  render: (args) => (
    <div className="w-[22rem] max-w-full p-3">
      <RatingButtons {...args} />
    </div>
  ),
}

export const MobileStickyBar: Story = {
  args: {
    intervals: {
      again: "<1m",
      hard: "8m",
      good: "2d",
      easy: "5d",
    },
    stickyMobile: true,
  },
  render: (args) => (
    <div className="relative min-h-[18rem] w-[24rem] max-w-full rounded-[28px] border bg-muted/30 p-3">
      <div className="h-28 rounded-[24px] border bg-background/80" />
      <div className="fixed inset-x-0 bottom-0 px-3 pt-3 pb-6">
        <div className="mx-auto max-w-[24rem] rounded-[28px] border bg-background/92 p-3 shadow-[0_-10px_35px_-26px_hsl(var(--foreground)/0.45)]">
          <RatingButtons {...args} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
}
