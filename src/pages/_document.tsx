import Document, { Html, Head, Main, NextScript } from 'next/document'
import { getSeoConfig, toHtmlLang } from '../lib/seo'

const seoConfig = getSeoConfig()
const htmlLang = toHtmlLang(seoConfig.site.locale)

export default class MyDocument extends Document {
  render() {
    return (
      <Html {...({ lang: htmlLang } as any)}>
        <Head>
          {/* Local fonts - no external font loading needed */}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
} 
