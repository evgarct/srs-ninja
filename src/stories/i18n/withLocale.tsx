import type { Decorator, ArgTypes } from '@storybook/nextjs-vite'
import { NextIntlClientProvider } from 'next-intl'
import enMessages from '../../../messages/en.json'
import ruMessages from '../../../messages/ru.json'
import csMessages from '../../../messages/cs.json'
import type { Locale } from '@/i18n/config'

export const messagesByLocale: Record<Locale, typeof enMessages> = {
  en: enMessages,
  ru: ruMessages,
  cs: csMessages,
}

export const localeArgType: ArgTypes = {
  locale: {
    control: 'select',
    options: ['ru', 'en', 'cs'] satisfies Locale[],
    description: 'Язык интерфейса',
    table: { defaultValue: { summary: 'ru' } },
  },
}

export const withLocale: Decorator = (Story, context) => {
  const locale = ((context.args as { locale?: string }).locale ?? 'ru') as Locale
  const messages = messagesByLocale[locale]
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Story />
    </NextIntlClientProvider>
  )
}
