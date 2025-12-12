export const defaultSEO = {
  titleTemplate: '%s | Benedikt Schnupp - Motion Designer & Developer',
  defaultTitle: 'Benedikt Schnupp - Motion Designer & Developer',
  description: 'Creative Motion Designer & Front-End Developer with 10+ years of experience in branding, motion design and modern web development. Based in Berlin, Germany.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://benediktschnupp.com',
    siteName: 'Benedikt Schnupp Portfolio',
    title: 'Benedikt Schnupp - Motion Designer & Developer',
    description: 'Creative Motion Designer & Front-End Developer with 10+ years of experience in branding, motion design and modern web development.',
    images: [
      {
        url: 'https://benediktschnupp.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Benedikt Schnupp - Motion Designer & Developer',
      },
    ],
  },
  twitter: {
    cardType: 'summary_large_image',
  },
  additionalMetaTags: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    },
    {
      name: 'theme-color',
      content: '#1C1D20',
    },
  ],
  additionalLinkTags: [
    {
      rel: 'icon',
      href: '/favicon.ico',
    },
    {
      rel: 'apple-touch-icon',
      href: '/apple-touch-icon.png',
      sizes: '180x180',
    },
    {
      rel: 'manifest',
      href: '/site.webmanifest',
    },
  ],
} 