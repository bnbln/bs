import { GetStaticPaths, GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import { getStaticProjectPaths, getProjectWithHtml, Project, getAllProjects } from '../../lib/markdown'
import StructuredData from '../../components/StructuredData'
import Article from '../../components/Article'
import { buildCanonical, buildProjectSeo, getSeoConfig } from '../../lib/seo'

interface ProjectPageProps {
  project: Project
  allProjects: Project[]
}

export default function ProjectPage({ project, allProjects }: ProjectPageProps) {
  const seoConfig = getSeoConfig()
  const projectSeo = buildProjectSeo(seoConfig, project)
  const heroImage = project.heroImage || project.image || seoConfig.pages.project.ogImageFallback || seoConfig.assets.ogDefaultImage
  const absoluteHeroImage = buildCanonical(seoConfig, heroImage)
  const articleDescription = project.excerpts || seoConfig.pages.project.descriptionFallback || seoConfig.site.defaultDescription

  return (
    <>
      <NextSeo {...projectSeo} />
      <StructuredData
        type="article"
        data={{
          headline: project.title,
          description: articleDescription,
          image: absoluteHeroImage,
          datePublished: project.published,
          mainEntityOfPage: projectSeo.canonical,
          author: {
            '@type': 'Person',
            name: 'Benedikt Schnupp',
          },
          publisher: {
            '@type': 'Person',
            name: 'Benedikt Schnupp',
          },
        }}
      />
      <Article project={project} allProjects={allProjects} heroPriority />
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getStaticProjectPaths()

  return {
    paths,
    fallback: false
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  if (!params?.slug || typeof params.slug !== 'string') {
    return {
      notFound: true
    }
  }

  const project = await getProjectWithHtml(params.slug)
  const allProjects = getAllProjects()
  
  return {
    props: {
      project,
      allProjects
    }
  }
}
