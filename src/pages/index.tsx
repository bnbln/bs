import { GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import { getProjectsData, Project } from '../lib/markdown'
import StructuredData from '../components/StructuredData'
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
    <>
      <NextSeo
        description="Creative Motion Designer & Front-End Developer with 7+ years of experience in branding, motion design and modern web development. Based in Berlin, Germany."
        openGraph={{
          title: 'Benedikt Schnupp - Motion Designer & Developer',
          description: 'Creative Motion Designer & Front-End Developer with 7+ years of experience in branding, motion design and modern web development.',
          images: [
            {
              url: 'https://benediktschnupp.com/og-image.jpg',
              width: 1200,
              height: 630,
              alt: 'Benedikt Schnupp Portfolio',
            },
          ],
        }}
      />
      <StructuredData
        type="person"
        data={{
          name: 'Benedikt Schnupp',
          jobTitle: 'Motion Designer & Developer',
          description: 'Creative Motion Designer & Front-End Developer with 7+ years of experience in branding, motion design and modern web development.',
          url: 'https://benediktschnupp.com',
          worksFor: {
            '@type': 'Organization',
            name: 'Freelance',
          },
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Berlin',
            addressCountry: 'Germany',
          },
        }}
      />
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
    </>
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