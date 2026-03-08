import { GetServerSideProps } from 'next'
import { getAllProjects } from '../lib/markdown'
import { buildSitemap, getSeoConfig } from '../lib/seo'

const Sitemap = () => null

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const projects = getAllProjects()
  const seoConfig = getSeoConfig()
  const sitemap = buildSitemap(seoConfig, projects)

  res.setHeader('Content-Type', 'text/xml')
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate')
  res.write(sitemap)
  res.end()

  return {
    props: {},
  }
}

export default Sitemap 
