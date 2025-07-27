import { GetStaticPaths, GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import { getStaticProjectPaths, getProjectWithHtml, Project } from '../../lib/markdown'
import StructuredData from '../../components/StructuredData'
import Article from '../../components/Article'
import Footer from '../../components/Footer'

interface ProjectPageProps {
  project: Project
}

export default function ProjectPage({ project }: ProjectPageProps) {
  return (
    <>
      <NextSeo
        title={project.title}
        description={project.excerpts}
        openGraph={{
          title: project.title,
          description: project.excerpts,
          images: [
            {
              url: `https://benediktschnupp.com/${project.image}`,
              width: 1200,
              height: 630,
              alt: project.title,
            },
          ],
          type: 'article',
          article: {
            publishedTime: project.published,
            section: project.category,
          },
        }}
      />
      <StructuredData
        type="article"
        data={{
          headline: project.title,
          description: project.excerpts,
          image: `https://benediktschnupp.com/${project.image}`,
          datePublished: project.published,
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
      <div className="min-h-screen bg-[#1C1D20] w-full">
        <div className="mb-[403px]" style={{ zIndex: -1 }}>
          <Article project={project} />
          <Footer />
        </div>
      </div>
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
  
  return {
    props: {
      project
    }
  }
} 