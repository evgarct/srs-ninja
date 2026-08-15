export default async function ReviewLayout({
  children,
}: {
  children: React.ReactNode
  params: Promise<{ deckId: string }>
}) {
  return children
}
