import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { FrequencyBar } from "./FrequencyBar"

const meta: Meta<typeof FrequencyBar> = {
  title: "Flashcard/FrequencyBar",
  component: FrequencyBar,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    frequency: { control: { type: "range", min: 1, max: 10, step: 1 } },
  },
}
export default meta

type Story = StoryObj<typeof FrequencyBar>

export const Default: Story = { args: { frequency: 7 } }
export const Low: Story = { args: { frequency: 2 } }
export const High: Story = { args: { frequency: 9 } }
export const Max: Story = { args: { frequency: 10 } }
export const Min: Story = { args: { frequency: 1 } }
