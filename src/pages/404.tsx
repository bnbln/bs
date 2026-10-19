import React from 'react'
import Link from 'next/link'
import { NextSeo } from 'next-seo'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import Shuffle from '../components/Shuffle'
import MagneticButton from '../components/MagneticButton'

const links = [
  { href: '/work', label: 'Selected work', description: 'Case studies across UX/UI, brand and motion.' },
  { href: '/about', label: 'About me', description: 'How I work and where I have worked.' },
  { href: '/contact', label: 'Get in touch', description: 'Have a project in mind? Let’s talk.' },
]

const NotFound = () => {
  return (
    <>
      <NextSeo title="Page not found | Benedikt Schnupp" noindex nofollow />

      <div className="bg-[#1C1D20] min-h-screen">
        <div className="bg-white min-h-screen flex flex-col justify-between relative z-10 shadow-2xl mb-0 md:mb-[500px]">
          <Navigation theme="light" />

          <main className="flex-grow pt-32 pb-20 px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px] relative w-full overflow-hidden">
            <div className="max-w-[1400px] mx-auto relative z-10">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="font-mono text-sm font-medium uppercase tracking-[0.14em] text-neutral-600 mb-6">
                  Error 404
                </p>
                <h1 className="font-space-grotesk font-bold tracking-tight text-black leading-[0.9] mb-10">
                  <span className="sr-only">Page not found</span>
                  <span aria-hidden="true" className="block text-[34vw] md:text-[24vw] lg:text-[20vw] leading-[0.8] -ml-[0.04em]">
                    <Shuffle
                      text="404"
                      tag="span"
                      shuffleDirection="right"
                      duration={0.35}
                      animationMode="evenodd"
                      shuffleTimes={2}
                      ease="power3.out"
                      stagger={0.05}
                      threshold={0.1}
                      triggerOnce={true}
                      triggerOnHover={true}
                      respectReducedMotion={true}
                      textAlign="left"
                      className="!text-[34vw] md:!text-[24vw] lg:!text-[20vw] !leading-[0.8] !tracking-tight font-bold font-space-grotesk !normal-case"
                    />
                  </span>
                  <span aria-hidden="true" className="block text-[10vw] sm:text-[8vw] md:text-[6vw] lg:text-[4.5vw] mt-6">
                    This page went off the grid.
                  </span>
                </h1>
              </motion.div>

              <motion.div
                className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="lg:col-span-5 flex flex-col gap-8">
                  <p className="font-inter text-lg md:text-xl text-neutral-600 leading-relaxed max-w-[460px]">
                    The link may be outdated, or the page has moved. Everything else is still where you left it.
                  </p>
                  <MagneticButton className="self-start">
                    <Link
                      href="/"
                      className="inline-flex items-center gap-3 rounded-full bg-black px-8 py-4 font-space-grotesk text-lg font-medium text-white transition-colors hover:bg-neutral-800"
                    >
                      Back to home
                    </Link>
                  </MagneticButton>
                </div>

                <nav aria-label="Suggested pages" className="lg:col-span-6 lg:col-start-7">
                  <ul className="border-t border-neutral-200">
                    {links.map((link) => (
                      <li key={link.href} className="border-b border-neutral-200">
                        <Link
                          href={link.href}
                          className="group flex items-center justify-between gap-6 py-6"
                        >
                          <span className="flex flex-col gap-1">
                            <span className="font-space-grotesk text-2xl md:text-3xl font-bold text-black">
                              {link.label}
                            </span>
                            <span className="font-inter text-neutral-600">{link.description}</span>
                          </span>
                          <ArrowUpRight
                            aria-hidden="true"
                            className="h-8 w-8 shrink-0 text-black transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1 group-hover:-translate-y-1"
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </motion.div>
            </div>
          </main>
        </div>

        <Footer />
      </div>
    </>
  )
}

export default NotFound
