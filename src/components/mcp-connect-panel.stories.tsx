import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { McpConnectPanel } from './mcp-connect-panel'

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
    appOrigin: 'https://srs.example.com',
    endpointUrl: 'https://srs.example.com/api/mcp',
    connectionUrl: 'https://srs.example.com/api/mcp?token=secret-value',
    hasPersonalConfig: true,
    missingEnv: [],
    requiresPublicOrigin: false,
  },
}

export const NeedsSetup: Story = {
  args: {
    appOrigin: 'http://localhost:3000',
    endpointUrl: 'http://localhost:3000/api/mcp',
    connectionUrl: null,
    hasPersonalConfig: false,
    missingEnv: ['MCP_SHARED_SECRET', 'MCP_USER_ID'],
    requiresPublicOrigin: true,
  },
}
