import { NextResponse } from 'next/server'
import { resolveMcpContext } from '@/lib/mcp-auth'
import { handleMcpRequest } from '@/lib/mcp-server'
import { getMcpAuthenticateHeader } from '@/lib/mcp-oauth'

export const dynamic = 'force-dynamic'

async function processMcpRequest(request: Request) {
  const context = await resolveMcpContext(request)

  if (!context) {
    return NextResponse.json(
      { error: 'invalid_token', error_description: 'Connect Echo with OAuth and send the access token as a Bearer token.' },
      { status: 401, headers: { 'WWW-Authenticate': getMcpAuthenticateHeader() } }
    )
  }

  return handleMcpRequest(request, context)
}

export async function GET(request: Request) {
  return processMcpRequest(request)
}

export async function POST(request: Request) {
  return processMcpRequest(request)
}

export async function DELETE(request: Request) {
  return processMcpRequest(request)
}
