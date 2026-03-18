import { NextResponse } from 'next/server'
import { resolveMcpContext } from '@/lib/mcp-auth'
import { handleMcpRequest } from '@/lib/mcp-server'

export const dynamic = 'force-dynamic'

async function processMcpRequest(request: Request) {
  const context = await resolveMcpContext(request)

  if (!context) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide a valid session or MCP shared secret.' },
      { status: 401 }
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
