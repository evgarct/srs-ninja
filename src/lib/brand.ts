import type { Metadata, Viewport } from 'next'
import type { MetadataRoute } from 'next'
import brandConfig from '../../brand.config.json'

export const brand = brandConfig

export function resolveBrandAppOrigin() {
  return process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}

export function buildBrandMetadata(appOrigin = resolveBrandAppOrigin()): Metadata {
  return {
    metadataBase: new URL(appOrigin),
    applicationName: brand.name,
    title: {
      default: brand.name,
      template: `%s · ${brand.name}`,
    },
    description: brand.tagline,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: brand.shortName,
    },
    openGraph: {
      title: brand.name,
      description: brand.tagline,
      siteName: brand.name,
      images: [brand.assets.openGraphImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: brand.name,
      description: brand.tagline,
      images: [brand.assets.twitterImage],
    },
    icons: {
      icon: [
        { url: brand.assets.faviconIco, sizes: 'any' },
        { url: brand.assets.favicon16, sizes: '16x16', type: 'image/png' },
        { url: brand.assets.favicon32, sizes: '32x32', type: 'image/png' },
        { url: brand.assets.faviconSvg, type: 'image/svg+xml' },
        { url: brand.assets.icon192, sizes: '192x192', type: 'image/png' },
        { url: brand.assets.icon512, sizes: '512x512', type: 'image/png' },
      ],
      apple: [{ url: brand.assets.appleTouchIcon, sizes: '180x180', type: 'image/png' }],
      other: [{ rel: 'mask-icon', url: brand.assets.safariPinnedTab, color: brand.themeColor }],
    },
  }
}

export const brandViewport: Viewport = {
  themeColor: brand.themeColor,
}

export function buildBrandManifest(): MetadataRoute.Manifest {
  return {
    name: brand.name,
    short_name: brand.shortName,
    description: brand.tagline,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: brand.backgroundColor,
    theme_color: brand.themeColor,
    icons: [
      {
        src: brand.assets.icon192,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: brand.assets.icon512,
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: brand.assets.appleTouchIcon,
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
