import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { approveDraftNoteForUser } from '@/lib/draft-import-service'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await approveDraftNoteForUser(supabase, user.id, id)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to approve draft' },
      { status: 500 }
    )
  }
}
