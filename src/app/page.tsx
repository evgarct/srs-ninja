import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">SRS Ninja</h1>
      <p className="text-muted-foreground mb-8">
        Welcome back, {user.email}
      </p>
      <div className="flex gap-4">
        <div className="rounded-lg border p-6 text-center">
          <h2 className="text-2xl font-semibold">🇨🇿 Czech</h2>
          <p className="text-muted-foreground mt-2">0 cards due</p>
        </div>
        <div className="rounded-lg border p-6 text-center">
          <h2 className="text-2xl font-semibold">🇬🇧 English</h2>
          <p className="text-muted-foreground mt-2">0 cards due</p>
        </div>
      </div>
    </main>
  )
}
