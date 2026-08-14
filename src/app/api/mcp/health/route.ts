import { NextResponse } from 'next/server'
import { getMcpProtectedResourceMetadata } from '@/lib/mcp-oauth'
import { brand } from '@/lib/brand'
export const dynamic = 'force-dynamic'
export function GET() {
  try {
    const metadata = getMcpProtectedResourceMetadata()
    return NextResponse.json({ status: 'ok', service: brand.mcp.serverName, version: '0.2.0', oauth: true, resource: metadata.resource })
  } catch { return NextResponse.json({ status: 'configuration_error', oauth: false }, { status: 503 }) }
}
