import { GetServerSideProps } from 'next'
import { getAllProjects } from '../lib/markdown'

const Sitemap = () => null

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const projects = getAllProjects()
  const baseUrl = 'https://benediktschnupp.com'

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>${baseUrl}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
      </url>
      ${projects
        .map((project) => {
          return `
            <url>
              <loc>${baseUrl}/project/${project.slug}</loc>
              <lastmod>${new Date(project.published).toISOString()}</lastmod>
              <changefreq>monthly</changefreq>
              <priority>0.8</priority>
            </url>
          `
        })
        .join('')}
    </urlset>`

  res.setHeader('Content-Type', 'text/xml')
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate')
  res.write(sitemap)
  res.end()

  return {
    props: {},
  }
}

export default Sitemap 