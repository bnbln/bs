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
        description="Creative Motion Designer & Front-End Developer with 10+ years of experience in branding, motion design and modern web development. Based in Berlin, Germany."
        openGraph={{
          title: 'Benedikt Schnupp - Motion Designer & Developer',
          description: 'Creative Motion Designer & Front-End Developer with 10+ years of experience in branding, motion design and modern web development.',
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
          description: 'Creative Motion Designer & Front-End Developer with 10+ years of experience in branding, motion design and modern web development.',
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
        {/* Main Content - Slides over the footer on desktop, sits above it on mobile */}
        <div className="relative z-10 bg-white shadow-2xl mb-0 md:mb-[500px]">
          <Navigation />
          <Hero />
          <About />
          <div className="featured-projects">
            <FeaturedProjects data={data.featuredProjects} />
          </div>
          <Work data={data.projects} />
          <Create />
          <Contact />
        </div>
        
        {/* Footer - Relative on Mobile, Fixed Reveal on Desktop */}
        <Footer /> 
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