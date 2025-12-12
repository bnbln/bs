import React, { useRef } from 'react'
import { NextSeo } from 'next-seo'
import { motion, useInView } from 'framer-motion'
import { Mail, Linkedin } from 'lucide-react'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import ContactForm from '../components/ContactForm'

const ContactPage = () => {
  const containerRef = useRef(null)
  
  return (
    <>
      <NextSeo
        title="Contact - Benedikt Schnupp"
        description="Get in touch for freelance projects, collaborations, or just to say hi."
      />
      
      <div className="bg-[#1C1D20] min-h-screen">
        <div className="bg-white min-h-screen flex flex-col justify-between relative z-10 shadow-2xl mb-0 md:mb-[500px]">
        <Navigation theme="light" />
        
        <main className="flex-grow pt-32 pb-20 px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px] relative w-full overflow-hidden">
             <div className="max-w-[1400px] mx-auto relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
                    
                    {/* Left Column: Headline & Info */}
                    <div className="lg:col-span-5 flex flex-col">
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="mb-12"
                        >
                             <div className="w-[60px] h-[60px] rounded-full bg-cover bg-center mb-8" style={{ backgroundImage: `url('/assets/portrait.webp')` }} />
                             
                             <h1 className="text-[12vw] sm:text-[9vw] md:text-[7vw] lg:text-[5.5vw] leading-[0.9] tracking-tight font-bold font-space-grotesk text-black mb-8 mix-blend-exclusion">
                                Let's start a project.
                             </h1>
                             
                             <p className="text-xl font-inter text-neutral-600 max-w-md leading-relaxed mb-12">
                                I'm currently available for freelance projects. Open to discuss new opportunities, collaborations, or just connecting.
                             </p>

                             <div className="flex flex-col gap-6">
                                <div className="space-y-1">
                                    <div className="text-xs font-semibold uppercase tracking-widest text-neutral-400 font-inter">Email</div>
                                    <a href="mailto:mail@benediktschnupp.com" className="text-lg font-space-grotesk font-medium text-black hover:opacity-70 transition-opacity">
                                        mail@benediktschnupp.com
                                    </a>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs font-semibold uppercase tracking-widest text-neutral-400 font-inter">Socials</div>
                                    <div className="flex gap-4">
                                        <a href="https://linkedin.com/in/benedikt-schnupp-928112116" target="_blank" rel="noopener noreferrer" className="text-lg font-space-grotesk font-medium text-black hover:opacity-70 transition-opacity flex items-center gap-2">
                                            <Linkedin className="w-5 h-5" /> LinkedIn
                                        </a>
                                    </div>
                                </div>
                             </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Form */}
                    <div className="lg:col-span-6 lg:col-start-7 pt-10 lg:pt-20">
                         <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                         >
                            <ContactForm />
                         </motion.div>
                    </div>

                </div>
             </div>
        </main>
      </div>

      <Footer />
    </div>
    </>
  )
}

export default ContactPage
