import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { PlayButton } from "./PlayButton"
import { fn } from "storybook/test"

const meta: Meta<typeof PlayButton> = {
  title: "Flashcard/PlayButton",
  component: PlayButton,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { onPlay: fn() },
}
export default meta

type Story = StoryObj<typeof PlayButton>

export const Default: Story = {}
export const Disabled: Story = { args: { disabled: true } }
