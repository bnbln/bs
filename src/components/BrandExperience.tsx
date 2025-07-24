import React from 'react'
import { motion } from 'framer-motion'
import GridMotion from './GridMotion'

const brands = [
  { name: 'WELT', image: 'http://localhost:3845/assets/7c3844c561def42f2dda63f8d8b64f536f9e2b32.png', width: 'w-32', height: 'h-[45px]', backgroundColor: '#003a5a' },
  { name: 'Business Insider', image: 'http://localhost:3845/assets/44c7194279e504a6d5479b93d1cf51d590d49c1e.png', width: 'w-[181px]', height: 'h-[95px]', backgroundColor: 'white'  },
  { name: 'BM', text: 'BM', width: 'w-32', height: 'h-[45px]', backgroundColor: 'white' },
  { name: 'Politico', image: 'http://localhost:3845/assets/2f11168a714a16334e04f0d7fb6af62727867736.png', width: 'w-[143px]', height: 'h-[81px]', backgroundColor: '#D71920' },
  { name: 'Rechtsklarheit.de', text: 'Rechtsklarheit.de', width: 'w-auto', height: 'h-auto', backgroundColor: '#182341' },
  { name: 'N24', image: 'http://localhost:3845/assets/9be11a37bfb23ea6c94c0ac52bd8325999cf599d.png', width: 'w-[124px]', height: 'h-[60px]', backgroundColor: 'white' },
  { name: 'Auf Augenhöhe', image: 'http://localhost:3845/assets/84c124e7ac54ed261174808b34cfe900fdcf94b2.png', width: 'w-[104px]', height: 'h-[67px]', backgroundColor: 'white' },
  { name: 'Dekra', image: 'http://localhost:3845/assets/1fda2c319346dbb13219dc8e5d107bc5b24bde51.png', width: 'w-[145px]', height: 'h-[41.461px]', backgroundColor: '#008B4D' },
  { name: 'Snapchat', image: 'http://localhost:3845/assets/1ca1ba05e36df11bfdb6cf2c6a85e132ff5ab697.png', width: 'w-[73px]', height: 'h-[73px]', backgroundColor: '#FFFC01' },
  { name: 'Gründerszene', image: 'http://localhost:3845/assets/4c5f76d086f756e7603bc72bad23ff84ac969c98.png', width: 'w-[204px]', height: 'h-[42px]', backgroundColor: 'white' }
]

const BrandExperience = () => {
  // Create items array with brand objects, distributed across the grid
  const items = [
    // Row 1: First 7 brands
    brands[0],
    brands[1],
    brands[2],
    brands[3],
    brands[4],
    brands[5],
    brands[6],
    
    // Row 2: Last 3 brands + 4 repeated brands
    brands[7],
    brands[8],
    brands[9],
    brands[0],
    brands[1],
    brands[2],
    brands[3],
    
    // Row 3: Repeated brands
    brands[4],
    brands[5],
    brands[6],
    brands[7],
    brands[8],
    brands[9],
    brands[0],
    
    // Row 4: Repeated brands
    brands[1],
    brands[2],
    brands[3],
    brands[4],
    brands[5],
    brands[6],
    brands[7],
  ];

  return (
    <section className="bg-white h-[50vh] relative w-full">
      {/* Section Title */}
      {/* <motion.h2 
        className="absolute left-1/2 top-7 translate-x-[-50%] translate-y-[-50%] text-black font-space-grotesk font-bold text-[20px] leading-[41.22px] whitespace-pre z-10"
        initial={{ y: -30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        Brand experience
      </motion.h2> */}

      {/* GridMotion Component */}
      <div className="absolute inset-0 z-0">
        <GridMotion items={items} gradientColor="rgba(0,0,0,0.1)" />
      </div>
    </section>
  )
}

export default BrandExperience 