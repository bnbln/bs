import { GetStaticPaths, GetStaticProps } from 'next'
import { getStaticProjectPaths, getProjectWithHtml, Project } from '../../lib/markdown'
import Article from '../../components/Article'

interface ProjectPageProps {
  project: Project
}

export default function ProjectPage({ project }: ProjectPageProps) {
  return <Article project={project} />
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