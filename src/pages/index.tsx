import { GetStaticProps } from 'next'
import { getProjectsData, Project } from '../lib/markdown'
import Hero from '../components/Hero'
import Navigation from '../components/Navigation'
import FeaturedProjects from '../components/FeaturedProjects'
import About from '../components/About'
import Work from '../components/Work'
import Contact from '../components/Contact'
import Footer from '../components/Footer'
import Create from '../components/Create'

interface HomeProps {
  data: {
    projects: Project[]
    featuredProjects: Project[]
  }
}

export default function Home({ data }: HomeProps) {
  return (
    <div className="min-h-screen bg-[#1C1D20] w-full">
      <div className="mb-[403px]" style={{ zIndex: -1 }}>
        <Navigation />
        <Hero />
        <About />
        <Work data={data.projects} />
        <Create />
        <div className="featured-projects">
          <FeaturedProjects data={data.featuredProjects} />
        </div>
        <Contact />
        <Footer />
      </div>
    </div>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const data = getProjectsData()
  
  return {
    props: {
      data
    }
  }
} 