import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Writing Coach — Train Your Thinking',
  description: 'A deliberate practice system for writing structured arguments under pressure.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0"
        />
      </head>
      <body>
        {children}
        {/* Noise texture — sits on top of everything, multiply blend so white vanishes */}
        <div aria-hidden="true" style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          pointerEvents: 'none',
          mixBlendMode: 'multiply',
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style={{ display: 'block' }}>
            <defs>
              <filter id="q-noise" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
                <feTurbulence type="fractalNoise" baseFrequency="0.13333334028720856 0.13333334028720856" stitchTiles="stitch" numOctaves="3" result="noise" seed="1367"/>
                <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise"/>
                <feComponentTransfer in="alphaNoise" result="coloredNoise1">
                  <feFuncA type="discrete" tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0"/>
                </feComponentTransfer>
                <feFlood floodColor="#DBDFFF" result="color1Flood"/>
                <feComposite operator="in" in2="coloredNoise1" in="color1Flood" result="color1"/>
                <feMerge>
                  <feMergeNode in="SourceGraphic"/>
                  <feMergeNode in="color1"/>
                </feMerge>
              </filter>
            </defs>
            {/* White base — multiply makes white transparent, dots become visible */}
            <rect width="100%" height="100%" fill="white" filter="url(#q-noise)"/>
          </svg>
        </div>
      </body>
    </html>
  )
}
