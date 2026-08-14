import { NextResponse } from 'next/server'
import { getMcpProtectedResourceMetadata } from '@/lib/mcp-oauth'
export const dynamic = 'force-dynamic'
export function GET() {
  try { return NextResponse.json(getMcpProtectedResourceMetadata(), { headers: { 'Cache-Control': 'public, max-age=300' } }) }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'OAuth metadata is not configured' }, { status: 503 }) }
}
