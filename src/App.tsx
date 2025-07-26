//import { useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Hero from './components/Hero'
import Navigation from './components/Navigation'
import FeaturedProjects from './components/FeaturedProjects'
import About from './components/About'
import Work from './components/Work'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Article from './components/Article'
import Create from './components/Create'

import euWahl from './assets/EU_wahl.jpg'
import euWahlVideo from './assets/Eu Wahl Loop.mp4'
import zeitreise from './assets/Zeitreise.jpg'
import book from './assets/book.avif'
import qr from './assets/qr.png'
import rk from './assets/rk.png'
import eyes from './assets/eyes.png'

function App() {
  const allProjects = [
    {
      id: 0,
      title: 'Trailer for EU election campaign',
      slug: 'eu-election-trailer',
      category: 'Trailer Campaign',
      excerpts: 'Trailer for EU election campaign',
      published: '2024-05-01',
      description: 'Trailer for EU election campaign',
      color: 'bg-blue',
      image: euWahl,
      video: euWahlVideo,
      sequence: "./book", // path to the sequence folder
      sequenceFrames: [0, 500], // [First frame, last frame]
      content: [
        {
          type: 'heading',
          content: 'Trailer for EU election campaign',
          level: 1
        },
        {
          type: 'paragraph',
          content: 'Trailer for EU election campaign'
        },
        {
          type: 'paragraph',
          content: 'Trailer for EU election campaign'
        },
        {
          type: 'image',
          alt: 'Trailer for EU election campaign',
          src: euWahl
        },
        {
          type: 'video',
          src: euWahlVideo,
          thumbnail: euWahl,
          alt: 'Trailer for EU election campaign'
        }
      ]
    },
    {
      id: 1,
      title: 'Show Design for History Documentary Series',
      slug: 'history-documentary-design',
      category: 'Show Design',
      excerpts: 'Show Design for History Documentary Series',
      image: zeitreise
    },
    {
      id: 2,
      title: 'Book 3D-Modeling & Animation for TV Spot',
      slug: 'book-3d-animation',
      category: 'Book',
      image: book,
      sequence: "./book/book_", // path to the sequence folder
      sequenceFrames: [0, 500], // [First frame, last frame]
  
    },
    {
      id: 3,
      title: 'Multiple Projects won an Eyes and Ears Award 2024',
      slug: 'eyes-and-ears-award-2024',
      category: 'Award',
      image: eyes,
      bgColor: 'bg-blue'
    },
    {
      id: 4,
      title: 'Generating advanced QR-Codes with Stable Diffusion',
      slug: 'generating-advanced-qr-codes-with-stable-diffusion',
      category: 'Artificial Intelligence',
      image: qr,
      bgColor: 'bg-blue',
    },
    {
      id: 5,
      title: 'Relaunching a Berlin Lawyers Corporate Design and Website',
      slug: 'relaunching-a-berlin-lawyers-corporate-design-and-website',
      category: 'UX&UI, Development',
      image: rk,
      bgColor: 'bg-azure'
    },
    {
      id: 6,
      title: 'Automating Video Workflows in Trailer Production for TV Channel',
      slug: 'automating-video-workflows-in-trailer-production-for-tv-channel',
      category: 'Automation',
      image: 'http://localhost:3845/assets/6449251a7ee4e321b136b307c80bb87669c81841.png',
      bgColor: 'bg-orange'
    }
  ]
  const data = {
    projects: [
      allProjects[0],
      allProjects[1],
      allProjects[2]
    ],
    featuredProjects: [
      allProjects[3],
      allProjects[4],
      allProjects[5],
      allProjects[6]
    ]
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#1C1D20] w-full">
        <Routes>
          {/* Home Page */}
          <Route path="/" element={
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
          } />
          
          {/* Article Pages */}
          <Route path="/project/:slug" element={<Article />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App 