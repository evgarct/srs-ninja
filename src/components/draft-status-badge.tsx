'use client'

import { Badge } from '@/components/ui/badge'
import type { DraftNoteStatus, ImportBatchStatus } from '@/lib/draft-import'

export function DraftStatusBadge({
  status,
}: {
  status: DraftNoteStatus | ImportBatchStatus
}) {
  if (status === 'approved') {
    return <Badge variant="secondary">Approved</Badge>
  }

  if (status === 'partially_approved') {
    return <Badge variant="outline">Partially approved</Badge>
  }

  if (status === 'archived') {
    return <Badge variant="outline">Archived</Badge>
  }

  return <Badge variant="outline">Draft</Badge>
}
