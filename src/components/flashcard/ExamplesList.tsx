import * as React from "react"

interface ExamplesListProps {
  examples: string[]
  className?: string
}

export function ExamplesList({ examples, className }: ExamplesListProps) {
  return (
    <ul
      className={`space-y-2 text-sm text-foreground/75 ${className ?? ""}`}
      aria-label="Example sentences"
    >
      {examples.map((example, index) => (
        <li key={index} className="flex gap-2 leading-relaxed">
          <span
            className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-foreground/30"
            aria-hidden="true"
          />
          {/* Safe-ish: examples are from our own DB, only <b> tags are used */}
          <span dangerouslySetInnerHTML={{ __html: example }} />
        </li>
      ))}
    </ul>
  )
}
