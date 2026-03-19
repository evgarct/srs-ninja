import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { LevelBadge } from "./LevelBadge"
import type { CEFRLevel } from "./LevelBadge"

const meta: Meta<typeof LevelBadge> = {
  title: "Flashcard/LevelBadge",
  component: LevelBadge,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
}
export default meta

type Story = StoryObj<typeof LevelBadge>

export const A1: Story = { args: { level: "A1" } }
export const A2: Story = { args: { level: "A2" } }
export const B1: Story = { args: { level: "B1" } }
export const B2: Story = { args: { level: "B2" } }
export const C1: Story = { args: { level: "C1" } }
export const C2: Story = { args: { level: "C2" } }

export const AllLevels: Story = {
  render: () => {
    const levels: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"]
    return (
      <div className="flex flex-wrap gap-3">
        {levels.map((l) => (
          <LevelBadge key={l} level={l} />
        ))}
      </div>
    )
  },
}
