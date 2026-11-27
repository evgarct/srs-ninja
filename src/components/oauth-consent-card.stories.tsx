import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { OAuthConsentCard } from './oauth-consent-card'

const meta = { title: 'Auth/OAuthConsentCard', component: OAuthConsentCard, parameters: { layout: 'centered' } } satisfies Meta<typeof OAuthConsentCard>
export default meta
type Story = StoryObj<typeof meta>

export const English: Story = { args: { authorizationId: 'authorization-preview', clientName: 'ChatGPT', clientUri: 'https://chatgpt.com', redirectUri: 'https://chatgpt.com/connector/callback', labels: { eyebrow: 'Echo MCP connection', title: 'Allow access?', description: '{client} wants to connect to your Echo account.', permissions: 'This connection can:', readDecks: 'View your deck names, languages, and field contracts.', readDrafts: 'View your draft batches and notes.', createDrafts: 'Create decks; create, edit, voice, approve, and delete notes and drafts when you ask.', noPublish: 'It cannot change or delete decks or access other accounts.', approve: 'Allow connection', deny: 'Deny', redirectLabel: 'Return address' } } }
export const Turkish: Story = { args: { ...English.args!, labels: { eyebrow: 'Echo MCP bağlantısı', title: 'Erişime izin verilsin mi?', description: '{client}, Echo hesabınıza bağlanmak istiyor.', permissions: 'Bu bağlantı şunları yapabilir:', readDecks: 'Deste adlarını, dilleri ve alan şemalarını görüntüler.', readDrafts: 'Taslak gruplarını ve notları görüntüler.', createDrafts: 'İsteğiniz üzerine deste oluşturur; notları ve taslakları oluşturur, düzenler, seslendirir, onaylar ve siler.', noPublish: 'Desteleri değiştiremez, silemez veya başka hesaplara erişemez.', approve: 'Bağlantıya izin ver', deny: 'Reddet', redirectLabel: 'Dönüş adresi' } } }
