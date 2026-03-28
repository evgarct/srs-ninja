import { ImageResponse } from 'next/og'
import { brand } from '@/lib/brand'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: brand.backgroundColor,
          color: brand.logo.lightStroke,
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '72px 84px',
            gap: '48px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '620px' }}>
            <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: -3 }}>{brand.name}</div>
            <div style={{ fontSize: 32, lineHeight: 1.3, color: '#4b4b4b' }}>
              {brand.tagline}
            </div>
          </div>

          <div
            style={{
              width: 320,
              height: 320,
              borderRadius: 72,
              background: brand.logo.lightStroke,
              position: 'relative',
              display: 'flex',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 50,
                left: 112,
                width: 142,
                height: 142,
                borderRadius: 28,
                background: brand.backgroundColor,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 86,
                left: 76,
                width: 142,
                height: 142,
                borderRadius: 28,
                background: brand.backgroundColor,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 120,
                left: 40,
                width: 170,
                height: 142,
                borderRadius: 28,
                background: brand.logo.lightStroke,
                border: `16px solid ${brand.backgroundColor}`,
                boxSizing: 'border-box',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 74,
                bottom: 82,
                width: 96,
                height: 16,
                borderRadius: 999,
                background: brand.backgroundColor,
              }}
            />
          </div>
        </div>
      </div>
    ),
    size
  )
}
