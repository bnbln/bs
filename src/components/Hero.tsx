import React from 'react'
import { motion } from 'framer-motion'
import ScrollVelocity from './ScrollVelocity'
const locationIcon = '/assets/locationBackground.svg'
const worldIcon = '/assets/World Icon.svg'
const arrowIcon = '/assets/arrow.svg'

const Hero = ({ title = "Benedikt Schnupp", location = "Berlin, Germany" }: { title?: string, location?: string }) => {
  return (
    <section className="relative h-[90vh] md:h-[100vh] w-full overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/assets/heroimage.webp')`
        }}
      />
      
      {/* Title - ScrollVelocity text */}
      <motion.div 
        className="absolute md:bottom-[122px] sm:bottom-[380px] bottom-[200px] left-[-260px] z-10" 
        style={{ height: '150px' }}
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        <ScrollVelocity
          texts={[`${title} – `]}
          velocity={-50}
          className="hero-text text-white font-space-grotesk font-bold"
          parallaxClassName=""
          scrollerClassName=""
          parallaxStyle={{ height: '150px' }}
          scrollerStyle={{ 
            height: '150px', 
            lineHeight: '150px',
            fontSize: 'inherit',
            fontFamily: 'inherit',
            fontWeight: 'inherit'
          }}
          numCopies={8}
        />
      </motion.div>

      {/* Info Section - Updated layout based on Figma design */}
      <motion.div 
        className="absolute  md:bottom-[308.794px] bottom-[0px] left-[-1px] right-0 z-10 px-0 md:pr-10"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between gap-5 flex-wrap">
          {/* Location Badge */}
          <div className="relative h-[95.206px] w-[278.229px] shrink-0">
            {/* Location Icon */}
            <div className="absolute left-0 top-0 h-[95.206px] w-[278.229px]">
              <img 
                src={locationIcon}
                alt="Location"
                className="block max-w-none size-full"
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  console.log('Location icon failed to load, using fallback');
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            
            {/* Location Text */}
            <div className="absolute left-[50px] top-[46.997px] translate-y-[-50%] w-[110px] h-[59px] flex items-center">
              <p className="text-white font-space-grotesk font-medium text-[14.375px] leading-[16.5px]">
                Located in {location}
              </p>
            </div>

            {/* World Icon */}
            <div className="absolute left-[213px] top-[31px] h-[34px] w-[34px]">
              <img 
                src={worldIcon}
                alt="World Icon"
                className="block max-w-none size-full"
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  console.log('World icon failed to load, using fallback');
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </div>

          {/* Role Section */}
          <div className="flex flex-col gap-14 items-start justify-start px-4 py-0 shrink-0">
            {/* Arrow Icon */}
            <div className="relative h-[15.077px] w-[15.077px] shrink-0">
              <div className="absolute bottom-[-6.251%] left-[-4.42%] right-[-6.248%] top-[-4.42%]">
                <img 
                  src={arrowIcon}
                  alt="Arrow"
                  className="block max-w-none size-full"
                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                    console.log('Arrow icon failed to load, using fallback');
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
            
            {/* Role Text */}
            <div className="flex flex-col gap-[5px] items-start justify-start text-white font-inter font-normal text-[26.873px] leading-[41.22px] text-nowrap">
              <div className="flex flex-col justify-center shrink-0">
                <p className="block leading-[41.22px] text-nowrap whitespace-pre">
                  Motion Designer
                </p>
              </div>
              <div className="flex flex-col justify-center shrink-0">
                <p className="block leading-[41.22px] text-nowrap whitespace-pre">
                  & Developer
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex items-end justify-between w-full p-[2.5rem]">
          {/* Role Section - Bottom Left */}
          <div className="flex flex-col gap-8 items-start justify-start">
            {/* Arrow Icon */}
            <div className="relative h-[15.077px] w-[15.077px] shrink-0">
              <div className="absolute bottom-[-6.251%] left-[-4.42%] right-[-6.248%] top-[-4.42%]">
                <img 
                  src={arrowIcon}
                  alt="Arrow"
                  className="block max-w-none size-full"
                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                    console.log('Arrow icon failed to load, using fallback');
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
            
            {/* Role Text */}
            <div className="flex flex-col gap-[5px] items-start justify-start text-white font-inter font-normal text-[20px] leading-[30px] text-nowrap">
              <div className="flex flex-col justify-center shrink-0">
                <p className="block leading-[30px] text-nowrap whitespace-pre">
                  Motion Designer
                </p>
              </div>
              <div className="flex flex-col justify-center shrink-0">
                <p className="block leading-[30px] text-nowrap whitespace-pre">
                  & Developer
                </p>
              </div>
            </div>
          </div>

          {/* World Icon - Bottom Right */}
          <div className="h-[34px] w-[34px]">
            <img 
              src={worldIcon}
              alt="World Icon"
              className="block max-w-none size-full"
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                console.log('World icon failed to load, using fallback');
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      </motion.div>
    </section>
  )
}

export default Hero 