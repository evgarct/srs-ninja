import { describe, expect, it } from 'vitest'
import { shouldBypassAuthRedirect } from '@/lib/supabase/middleware'

describe('shouldBypassAuthRedirect', () => {
  it('allows login and auth routes through', () => {
    expect(shouldBypassAuthRedirect('/login')).toBe(true)
    expect(shouldBypassAuthRedirect('/auth/callback')).toBe(true)
  })

  it('allows MCP routes through', () => {
    expect(shouldBypassAuthRedirect('/api/mcp')).toBe(true)
    expect(shouldBypassAuthRedirect('/api/mcp/drafts')).toBe(true)
  })

  it('keeps regular app pages protected', () => {
    expect(shouldBypassAuthRedirect('/')).toBe(false)
    expect(shouldBypassAuthRedirect('/deck/123')).toBe(false)
  })
})
