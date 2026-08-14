import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { McpConnectPanel } from './mcp-connect-panel'
import { brand } from '@/lib/brand'

const meta: Meta<typeof McpConnectPanel> = {
  title: 'Import/McpConnectPanel',
  component: McpConnectPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
}

export default meta

type Story = StoryObj<typeof McpConnectPanel>

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
