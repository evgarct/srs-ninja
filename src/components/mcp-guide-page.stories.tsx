import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useTranslations } from 'next-intl'

import { McpGuidePage } from './mcp-guide-page'
import { brand } from '@/lib/brand'
import type { McpConnectionConfig } from '@/lib/mcp-connection'

function McpGuideStory(config: McpConnectionConfig) {
  const t = useTranslations('mcpGuidePage')

  return (
    <>
      <h1 className="mb-2 text-3xl font-semibold">{t('pageTitle')}</h1>
      <p className="mb-8 max-w-2xl text-muted-foreground">{t('pageDescription')}</p>
      <McpGuidePage {...config} />
    </>
  )
}

const meta: Meta<typeof McpGuideStory> = {
  title: 'Pages/MCP Guide',
  component: McpGuideStory,
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true, navigation: { pathname: '/mcp' } },
  },
  decorators: [(Story) => (
    <main className="dark min-h-screen w-full bg-background px-4 py-10 pb-28 text-foreground">
      <div className="mx-auto w-full max-w-5xl"><Story /></div>
    </main>
  )],
}

export default meta
type Story = StoryObj<typeof McpGuideStory>

export const Ready: Story = {
  args: {
    appOrigin: `https://${brand.exampleDomain}`,
    endpointUrl: `https://${brand.exampleDomain}/api/mcp`,
    healthUrl: `https://${brand.exampleDomain}/api/mcp/health`,
    oauthReady: true,
    missingEnv: [],
    requiresPublicOrigin: false,
    legacyEnabled: false,
  },
}

export const NeedsSetup: Story = {
  args: {
    appOrigin: 'http://localhost:3000',
    endpointUrl: 'http://localhost:3000/api/mcp',
    healthUrl: 'http://localhost:3000/api/mcp/health',
    oauthReady: false,
    missingEnv: ['NEXT_PUBLIC_SUPABASE_URL'],
    requiresPublicOrigin: true,
    legacyEnabled: false,
  },
}

export const Mobile: Story = {
  ...Ready,
  parameters: { viewport: { defaultViewport: 'mobile1' }, a11y: { test: 'error' } },
}
