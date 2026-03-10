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
import Skills from '../components/Skills'
import { buildCanonical, buildPageSeo, getSeoConfig } from '../lib/seo'
import { getAllWorkHubContent, type WorkHubContent } from '../lib/work-hub-content'

interface HomeProps {
  data: {
    projects: Project[]
    featuredProjects: Project[]
  }
  hubContent: WorkHubContent[]
}

export default function Home({ data, hubContent }: HomeProps) {
  const seoConfig = getSeoConfig()
  const homeSeo = buildPageSeo(seoConfig, 'home')
  const siteUrl = buildCanonical(seoConfig, '/')
  const defaultOgImage = buildCanonical(seoConfig, seoConfig.assets.ogDefaultImage)

  return (
    <>
      <NextSeo {...homeSeo} />
      <StructuredData
        type="person"
        data={{
          name: 'Benedikt Schnupp',
          jobTitle: 'Senior Designer & Developer',
          description: seoConfig.site.defaultDescription,
          url: siteUrl,
          image: defaultOgImage,
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
        <div className="relative z-10 bg-[#FAFAFA] shadow-2xl mb-0 md:mb-[500px] pb-24 md:pb-40">
          <Navigation />
          <Hero />
          <About />
          <Work data={data.projects} />
          {/* <Create /> */}
          <Skills hubContent={hubContent} />
          <Contact />
          <FeaturedProjects data={data.featuredProjects} />
        </div>

        {/* Footer - Relative on Mobile, Fixed Reveal on Desktop */}
        <Footer />
      </div>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const data = getProjectsData()
  const hubContent = await getAllWorkHubContent()

  return {
    props: {
      data,
      hubContent
    }
  }
} 
