import React from 'react'
import { GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import FeaturedProjects from '../components/FeaturedProjects'

const Shuffle = dynamic(() => import('../components/Shuffle'), { ssr: false })
import { getProjectsData, Project } from '../lib/markdown'
import { ArrowUpRight, Linkedin, Copy, Calendar, Award, Briefcase, GraduationCap } from 'lucide-react'

interface AboutPageProps {
  data: {
    featuredProjects: Project[]
  }
}

interface TimelineEvent {
  year: string
  title: string
  description: string
  icon: React.ReactNode
  location?: string
  subject?: string
  track?: string
}

const AboutPage = ({ data }: AboutPageProps) => {
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

  const baseTimelineEvents: TimelineEvent[] = [
    {
      year: "1996 - 2014",
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
    }
  ]

  const agencyTrackEvents: TimelineEvent[] = [
    {
      year: "2019",
      title: "Internship Brand Communication",
      location: "Spring UG",
      description: "My first professional role in brand communication.",
      icon: <Briefcase className="w-5 h-5" />,
      track: "Agency / Inhouse"
    },
    {
      year: "2020 - 2022",
      title: "Motion & Brand Designer",
      location: "WELT-Gruppe",
      description: "Built motion and brand assets for editorial and commercial formats.",
      icon: <Briefcase className="w-5 h-5" />,
      track: "Agency / Inhouse"
    },
    {
      year: "2022 - 2026",
      title: "Senior Motion & Brand Designer",
      location: "PREMIUM-GRUPPE",
      description: "Leading motion and brand work across campaigns, digital products, and new formats.",
      icon: <Briefcase className="w-5 h-5" />,
      track: "Agency / Inhouse"
    }
  ]

  const freelanceTrackEvents: TimelineEvent[] = [
    {
      year: "2019",
      title: "Launching my first Website",
      description: "Started building and publishing my own web projects.",
      icon: <Calendar className="w-5 h-5" />,
      track: "Freelance / Studio"
    },
    {
      year: "2020 - Now",
      title: "Freelance Creative Developer",
      description: "Working with Artists, Media Brands, and Ad Agencies on Brand, UX/UI, Motion, 3D, Frontend-Dev, and AI Projects.",
      icon: <Briefcase className="w-5 h-5" />,
      track: "Freelance / Studio"
    },
    {
      year: "2025",
      title: "Launching Creative Studio DUO",
      description: "Publishing Apps and Websites for Clients.",
      icon: <Calendar className="w-5 h-5" />,
      track: "Freelance / Studio"
    }
  ]

  const mobileBranchEvents = [...agencyTrackEvents, ...freelanceTrackEvents]

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
                    <div>Designing the Future</div>
                    <Shuffle
                      text="one Pixel at a Time."
                      tag="span"
                      shuffleDirection="right"
                      duration={0.35}
                      animationMode="evenodd"
                      shuffleTimes={1}
                      ease="power3.out"
                      stagger={0.03}
                      threshold={0.1}
                      triggerOnce={true}
                      triggerOnHover={true}
                      respectReducedMotion={true}
                      textAlign="left"
                      className="!text-[10vw] !sm:text-[8vw] !md:text-[6vw] !lg:text-[5vw] !leading-[0.9] !tracking-tight font-bold font-space-grotesk !normal-case"
                    />
                  </h1>
              </motion.div>
           </section>

           {/* Personal Story & Image */}
           <section className="px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px] py-12 max-w-[1600px] mx-auto flex flex-col-reverse lg:grid lg:grid-cols-12 gap-12 items-start">
             
             {/* Text Content */}
             <div className="lg:col-span-7 space-y-8 order-2 lg:order-1">
                <motion.div
                   initial={{ y: 20, opacity: 0 }}
                   whileInView={{ y: 0, opacity: 1 }}
                   viewport={{ once: true }}
                   transition={{ duration: 0.8 }}
                >
                   <h2 className="text-3xl md:text-5xl font-space-grotesk font-medium mb-6 pr-12">
                      A blend of creative vision and technical precision.
                   </h2>
                   <div className="prose prose-lg text-neutral-600 font-inter leading-relaxed">
                      <p>
                        I am an outgoing, friendly Berliner with a creative and tech-savvy mind. My journey began in this vibrant city, where I was born and raised, soaking in the diverse culture and relentless innovation that defines Berlin.
                      </p>
                      <br />
                      <p>
                        Through my studies in <strong>Media Management & Communication Design</strong> and years of hands-on experience, I've cultivated a unique skill set that bridges the gap between aesthetic beauty and functional code.
                        I don't just build websites; I craft digital experiences. Whether it's 3D motion graphics, complex frontend logic, or AI-driven interfaces, I approach every project with passion and a solution-oriented mindset.
                      </p>
                      <br />
                      <p>
                        Outside of work, I'm a maker at heart. You'll find me experimenting with <strong>3D printing</strong>, whipping up new recipes in the kitchen, or enjoying movie nights.
                      </p>
                   </div>
                </motion.div>
             </div>

             {/* Image */}
             <div className="lg:col-span-5 relative order-1 lg:order-2 lg:-mt-32">
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

                 <div className="hidden md:block">
                    <div className="relative space-y-16">
                       {baseTimelineEvents.map((event, index) => (
                          <motion.div
                             key={`${event.year}-${event.title}`}
                             className="relative grid grid-cols-12 gap-8 items-center"
                             initial={{ opacity: 0, x: -20 }}
                             whileInView={{ opacity: 1, x: 0 }}
                             viewport={{ once: true }}
                             transition={{ duration: 0.6, delay: index * 0.1 }}
                          >
                             <div className="absolute left-1/2 -ml-[9px] top-1/2 -mt-4 w-5 h-5 rounded-full bg-black border-4 border-white z-10" />

                             <div className="col-span-5 text-right">
                                <span className="inline-block px-3 py-1 bg-neutral-100 rounded-full text-sm font-mono font-medium text-neutral-600">
                                   {event.year}
                                </span>
                             </div>

                             <div className="col-span-2"></div>

                             <div className="col-span-5">
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

                       <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-neutral-100 -translate-x-1/2" />
                    </div>

                    <div className="relative mt-10">
                       <div className="absolute left-1/2 top-0 h-6 w-[2px] bg-neutral-100 -translate-x-1/2" />
                       <div className="absolute left-1/2 top-6 h-[2px] w-8 bg-neutral-100 -translate-x-full" />
                       <div className="absolute left-1/2 top-6 h-[2px] w-8 bg-neutral-100" />

                       <div className="grid grid-cols-2 gap-16 pt-8">
                          <div className="relative pr-12 space-y-14">
                             <div className="absolute right-0 top-10 bottom-0 w-[2px] bg-neutral-100" />
                             <div className="mr-8 text-right">
                                <span className="inline-block px-3 py-1 bg-neutral-100 rounded-full text-[11px] font-mono font-medium text-neutral-500 uppercase tracking-[0.14em]">
                                   Agency / Inhouse
                                </span>
                             </div>

                             {agencyTrackEvents.map((event, index) => (
                                <motion.div
                                   key={`${event.year}-${event.title}`}
                                   className="relative text-right"
                                   initial={{ opacity: 0, x: -20 }}
                                   whileInView={{ opacity: 1, x: 0 }}
                                   viewport={{ once: true }}
                                   transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
                                >
                                   <div className="absolute right-0 top-2 w-5 h-5 rounded-full bg-black border-4 border-white z-10 translate-x-1/2" />
                                   <div className="mr-8">
                                      <span className="inline-block px-3 py-1 bg-neutral-100 rounded-full text-sm font-mono font-medium text-neutral-600 mb-3">
                                         {event.year}
                                      </span>
                                      <div className="flex items-center justify-end gap-2 mb-1">
                                         <h4 className="text-xl font-space-grotesk font-bold">{event.title}</h4>
                                         {event.icon}
                                      </div>
                                      {event.subject && <div className="text-neutral-500 font-medium">{event.subject}</div>}
                                      {event.location && <div className="text-sm text-neutral-400 mb-2">{event.location}</div>}
                                      <p className="text-neutral-600 leading-relaxed text-sm">
                                         {event.description}
                                      </p>
                                   </div>
                                </motion.div>
                             ))}
                          </div>

                          <div className="relative pl-12 space-y-14">
                             <div className="absolute left-0 top-10 bottom-0 w-[2px] bg-neutral-100" />
                             <div className="ml-8">
                                <span className="inline-block px-3 py-1 bg-neutral-100 rounded-full text-[11px] font-mono font-medium text-neutral-500 uppercase tracking-[0.14em]">
                                   Freelance / Studio
                                </span>
                             </div>

                             {freelanceTrackEvents.map((event, index) => (
                                <motion.div
                                   key={`${event.year}-${event.title}`}
                                   className="relative"
                                   initial={{ opacity: 0, x: 20 }}
                                   whileInView={{ opacity: 1, x: 0 }}
                                   viewport={{ once: true }}
                                   transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
                                >
                                   <div className="absolute left-0 top-2 w-5 h-5 rounded-full bg-black border-4 border-white z-10 -translate-x-1/2" />
                                   <div className="ml-8">
                                      <span className="inline-block px-3 py-1 bg-neutral-100 rounded-full text-sm font-mono font-medium text-neutral-600 mb-3">
                                         {event.year}
                                      </span>
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
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="md:hidden relative border-l-2 border-neutral-100 pl-8 ml-4 space-y-12">
                    {baseTimelineEvents.map((event, index) => (
                       <motion.div
                          key={`${event.year}-${event.title}`}
                          className="relative"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: index * 0.08 }}
                       >
                          <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-black border-4 border-white z-10" />

                          <span className="inline-block px-3 py-1 bg-neutral-100 rounded-full text-sm font-mono font-medium text-neutral-600 mb-3">
                             {event.year}
                          </span>
                          <div className="flex items-center gap-2 mb-1">
                             {event.icon}
                             <h4 className="text-xl font-space-grotesk font-bold">{event.title}</h4>
                          </div>
                          {event.subject && <div className="text-neutral-500 font-medium">{event.subject}</div>}
                          {event.location && <div className="text-sm text-neutral-400 mb-2">{event.location}</div>}
                          <p className="text-neutral-600 leading-relaxed text-sm">
                             {event.description}
                          </p>
                       </motion.div>
                    ))}

                    <motion.div
                       className="relative"
                       initial={{ opacity: 0, x: -20 }}
                       whileInView={{ opacity: 1, x: 0 }}
                       viewport={{ once: true }}
                       transition={{ duration: 0.6, delay: 0.2 }}
                    >
                       <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-black border-4 border-white z-10" />
                       <span className="inline-block px-3 py-1 bg-neutral-100 rounded-full text-[11px] font-mono font-medium text-neutral-500 uppercase tracking-[0.14em]">
                          Branching Paths
                       </span>
                       <p className="text-sm text-neutral-500 mt-2">
                          After graduation, my journey continues on two parallel tracks.
                       </p>
                    </motion.div>

                    {mobileBranchEvents.map((event, index) => (
                       <motion.div
                          key={`${event.track}-${event.year}-${event.title}`}
                          className="relative"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.24 + index * 0.06 }}
                       >
                          <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-black border-4 border-white z-10" />

                          {(index === 0 || event.track !== mobileBranchEvents[index - 1].track) && (
                             <span className="inline-block text-[11px] font-mono font-medium text-neutral-500 uppercase tracking-[0.14em] mb-2">
                                {event.track}
                             </span>
                          )}

                          <div>
                             <span className="inline-block px-3 py-1 bg-neutral-100 rounded-full text-sm font-mono font-medium text-neutral-600 mb-3">
                                {event.year}
                             </span>
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
