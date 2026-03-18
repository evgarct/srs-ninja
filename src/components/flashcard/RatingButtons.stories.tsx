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
