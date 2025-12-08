import React, { useRef } from 'react'
import { GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import FeaturedProjects from '../components/FeaturedProjects'
import { getProjectsData, Project } from '../lib/markdown'
import { ArrowUpRight, Mail, Linkedin, Copy, Calendar, Award, Briefcase, GraduationCap } from 'lucide-react'

interface AboutPageProps {
  data: {
    featuredProjects: Project[]
  }
}

const AboutPage = ({ data }: AboutPageProps) => {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: "-10%" })
  const [copied, setCopied] = React.useState(false)

  const copyEmail = () => {
    navigator.clipboard.writeText('mail@benediktschnupp.com')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const skills = [
    "Web Development", "React / Next.js", "Three.js / WebGL",
    "Motion Design", "3D Modeling", "Generative AI",
    "Branding", "UI/UX Design", "After Effects"
  ]

  const timelineEvents = [
    {
      year: "1994 - 2014",
      title: "Born & Raised in Berlin",
      description: "Growing up in the vibrant heart of Germany, I developed an early passion for technology and creativity.",
      icon: <Award className="w-5 h-5" />
    },
    {
      year: "2014",
      title: "Abitur",
      location: "Wald-Gymnasium Westend, Berlin-Charlottenburg",
      description: "Completed my secondary education with a focus on arts and sciences.",
      icon: <GraduationCap className="w-5 h-5" />
    },
    {
      year: "2014 - 2019",
      title: "Bachelor of Arts",
      subject: "Medienmanagement & Kommunikationsdesign",
      location: "Hochschule für Medien (SRH Berlin)",
      description: "Deep dive into the intersection of design, strategy, and technology.",
      icon: <GraduationCap className="w-5 h-5" />
    },
    {
      year: "2019 - Present",
      title: "Freelance Creative Developer",
      description: "Working with Artists, Media Brands, and Ad Agencies on Brand, UX/UI, Motion, 3D, Frontend-Dev, and AI Projects.",
      icon: <Briefcase className="w-5 h-5" />
    }
  ]

  return (
    <>
      <NextSeo
        title="About | Benedikt Schnupp"
        description="Learn more about Benedikt Schnupp - a creative Motion Designer & Front-End Developer based in Berlin."
        openGraph={{
          title: 'About | Benedikt Schnupp',
          description: 'Learn more about Benedikt Schnupp - a creative Motion Designer & Front-End Developer based in Berlin.',
          url: 'https://benediktschnupp.com/about',
          images: [
            {
              url: 'https://benediktschnupp.com/assets/portrait.webp',
              width: 1200,
              height: 630,
              alt: 'Benedikt Schnupp',
            },
          ],
        }}
      />

      <div className="min-h-screen bg-[#1C1D20] w-full">
        {/* Main Content - Slides over the footer on desktop, sits above it on mobile */}
        <div className="relative z-10 bg-[#F5F5F5] shadow-2xl mb-0 md:mb-[500px] min-h-screen flex flex-col">
           <Navigation theme="light" />

        <main className="w-full">
           {/* Header Section */}
           <section className="relative pt-[200px] pb-24 px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px] max-w-[1600px] mx-auto">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                  <h1 className="text-[10vw] sm:text-[8vw] md:text-[6vw] lg:text-[5vw] leading-[0.9] tracking-tight font-bold font-space-grotesk mb-8">
                    <div>Designing</div>
                    <div className="text-neutral-500">the Future,</div>
                    <div>One Pixel at a Time.</div>
                  </h1>
              </motion.div>
           </section>

           {/* Personal Story & Image */}
           <section className="px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px] py-12 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
             
             {/* Text Content */}
             <div className="lg:col-span-7 space-y-8">
                <motion.div
                   initial={{ y: 20, opacity: 0 }}
                   whileInView={{ y: 0, opacity: 1 }}
                   viewport={{ once: true }}
                   transition={{ duration: 0.8 }}
                >
                   <h2 className="text-3xl md:text-4xl font-space-grotesk font-medium mb-6">
                      A blend of creative vision and technical precision.
                   </h2>
                   <div className="prose prose-lg text-neutral-600 font-inter leading-relaxed">
                      <p>
                        I am an outgoing, friendly Berliner with a creative and tech-savvy mind. My journey began in this vibrant city, where I was born and raised, soaking in the diverse culture and relentless innovation that defines Berlin.
                      </p>
                      <p>
                        Through my studies in <strong>Media Management & Communication Design</strong> and years of hands-on experience, I've cultivated a unique skill set that bridges the gap between aesthetic beauty and functional code.
                      </p>
                      <p>
                        I don't just build websites; I craft digital experiences. Whether it's 3D motion graphics, complex frontend logic, or AI-driven interfaces, I approach every project with passion and a solution-oriented mindset.
                      </p>
                      <p>
                        Outside of work, I'm a maker at heart. You'll find me experimenting with <strong>3D printing</strong>, whipping up new recipes in the kitchen, or enjoying movie nights.
                      </p>
                   </div>
                </motion.div>
             </div>

             {/* Image */}
             <div className="lg:col-span-5 relative">
                <motion.div
                  className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-200"
                  initial={{ scale: 0.95, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                   <img 
                      src="/assets/IMG_8494.JPG" 
                      alt="Benedikt Schnupp" 
                      className="w-full h-full object-cover"
                   />
                </motion.div>
             </div>
           </section>

           {/* Timeline Section */}
           <section className="px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px] py-24 bg-white">
              <div className="max-w-[1000px] mx-auto">
                 <motion.h3 
                    className="text-2xl font-space-grotesk font-bold mb-16 text-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                 >
                    My Journey
                 </motion.h3>

                 <div className="relative border-l-2 border-neutral-100 pl-8 ml-4 md:ml-0 md:pl-0 space-y-16">
                    {timelineEvents.map((event, index) => (
                       <motion.div 
                          key={index}
                          className="relative md:grid md:grid-cols-12 md:gap-8 items-center"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: index * 0.1 }}
                       >
                          {/* Marker */}
                           <div className="absolute -left-[41px] top-1 md:left-1/2 md:-ml-[9px] md:top-1/2 md:-mt-4 w-5 h-5 rounded-full bg-black border-4 border-white z-10 hidden md:block" />
                           <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-black border-4 border-white z-10 md:hidden" />

                          {/* Date (Left on Desktop) */}
                          <div className="md:col-span-5 md:text-right mb-2 md:mb-0">
                             <span className="inline-block px-3 py-1 bg-neutral-100 rounded-full text-sm font-mono font-medium text-neutral-600">
                                {event.year}
                             </span>
                          </div>

                          {/* Empty Middle for Desktop Line */}
                          <div className="md:col-span-2 hidden md:block"></div>

                          {/* Content (Right on Desktop) */}
                          <div className="md:col-span-5">
                             <div className="flex items-center gap-2 mb-1">
                                {event.icon}
                                <h4 className="text-xl font-space-grotesk font-bold">{event.title}</h4>
                             </div>
                             {event.subject && <div className="text-neutral-500 font-medium">{event.subject}</div>}
                             {event.location && <div className="text-sm text-neutral-400 mb-2">{event.location}</div>}
                             <p className="text-neutral-600 leading-relaxed text-sm">
                                {event.description}
                             </p>
                          </div>
                       </motion.div>
                    ))}
                    
                    {/* Central Line for Desktop */}
                    <div className="absolute left-[50%] top-0 bottom-0 w-[2px] bg-neutral-100 -ml-[1px] hidden md:block"></div>
                 </div>
              </div>
           </section>

           {/* Skills Section */}
           <section className="px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px] py-24 bg-[#1C1D20] text-white">
              <div className="max-w-[1400px] mx-auto">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                       <h3 className="text-[8vw] sm:text-[6vw] md:text-[4vw] font-space-grotesk font-bold leading-tight mb-8">
                          Toolbox & <br /> Expertise
                       </h3>
                       <p className="text-neutral-400 text-lg max-w-lg mb-8">
                          I constantly explore new technologies to bring the best possible solutions to my clients. Here is what I work with most frequently.
                       </p>
                       
                       <div className="flex flex-wrap gap-3">
                          {skills.map((skill, index) => (
                             <span key={index} className="px-4 py-2 border border-white/20 rounded-full hover:bg-white hover:text-black transition-all cursor-default text-sm md:text-base">
                                {skill}
                             </span>
                          ))}
                       </div>
                    </div>

                    <div className="bg-white/5 p-8 md:p-12 rounded-2xl border border-white/10">
                        <div className="flex flex-col gap-6">
                            <h4 className="text-xl font-mono text-neutral-400 uppercase tracking-widest">Connect</h4>
                             <button 
                                onClick={copyEmail}
                                className="group w-full flex items-center justify-between p-4 md:p-6 bg-white text-black rounded-xl hover:bg-neutral-200 transition-all relative overflow-hidden"
                              >
                                <div className="flex flex-col items-start text-left z-10">
                                  <span className="text-xs md:text-sm text-neutral-500 mb-1">Email me</span>
                                  <span className="text-base md:text-xl font-space-grotesk font-medium break-all sm:break-normal">mail@benediktschnupp.com</span>
                                </div>
                                <div className="relative shrink-0 ml-4 z-10">
                                   <Copy className={`w-5 h-5 transition-all ${copied ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`} />
                                   <span className={`absolute top-0 right-0 font-inter text-xs bg-black text-white px-2 py-1 rounded opacity-0 transition-all ${copied ? 'opacity-100 -translate-y-8' : ''}`}>Copied!</span>
                                </div>
                              </button>

                              <div className="grid grid-cols-2 gap-4">
                                  <a 
                                    href="https://linkedin.com/in/benedikt-schnupp-928112116"
                                    target="_blank"
                                    rel="noopener noreferrer" 
                                    className="flex items-center justify-center gap-2 py-4 rounded-xl border border-white/20 hover:bg-white hover:text-black transition-colors"
                                  >
                                    <Linkedin className="w-5 h-5" />
                                    <span>LinkedIn</span>
                                  </a>
                                  <a 
                                    href="/assets/resume.pdf" // Hypothetical resume link
                                    className="flex items-center justify-center gap-2 py-4 rounded-xl border border-white/20 hover:bg-white hover:text-black transition-colors"
                                  >
                                    <ArrowUpRight className="w-5 h-5" />
                                    <span>Resume</span>
                                  </a>
                              </div>
                        </div>
                    </div>
                 </div>
              </div>
           </section>
        
            {/* Featured Projects Reuse */}
           <div className="py-12 bg-white">
                <FeaturedProjects data={data.featuredProjects} />
           </div>

        </main>

        </div>
        <Footer />
      </div>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
    const data = getProjectsData()
    return {
      props: {
        data: {
          featuredProjects: data.featuredProjects
        }
      }
    }
  }

export default AboutPage
