import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ExamplesList } from "./ExamplesList"

const meta: Meta<typeof ExamplesList> = {
  title: "Flashcard/ExamplesList",
  component: ExamplesList,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
}
export default meta

type Story = StoryObj<typeof ExamplesList>

export const Czech: Story = {
  args: {
    examples: [
      "Na zahradě jsme použili <b>konev</b> na zalévání květin.",
      "Děti si hrály s vodou z <b>konve</b>.",
    ],
  },
}

export const English: Story = {
  args: {
    examples: [
      "The witch stirred her bubbling <b>cauldron</b>.",
      "Smoke rose from the <b>cauldron</b> filled with a strange potion.",
    ],
  },
}

export const SingleExample: Story = {
  args: {
    examples: ["She placed the <b>cauldron</b> over the fire."],
  },
}
