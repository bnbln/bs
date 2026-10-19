import localFont from 'next/font/local'

// Space Grotesk font family
export const spaceGrotesk = localFont({
  src: [
    {
      path: '../../public/fonts/SpaceGrotesk-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/SpaceGrotesk-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/SpaceGrotesk-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-space-grotesk',
  display: 'swap',
})

// Inter font family
export const inter = localFont({
  src: [
    {
      path: '../../public/fonts/Inter-ExtraLight.woff2',
      weight: '200',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Inter-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Inter-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Inter-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Inter-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
  display: 'swap',
}) 