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

  const data = {
    projects: [
      {
        id: 1,
        title: 'Trailer for EU election campaign',
        slug: 'eu-election-trailer',
        featured: true,
        image: euWahl,
        video: euWahlVideo,
      },
      {
        id: 2,
        title: 'Show Design for History Documentary Series',
        slug: 'history-documentary-design',
        featured: true,
        image: zeitreise
      },
      {
        id: 3,
        title: 'Book 3D-Modeling & Animation for TV Spot',
        slug: 'book-3d-animation',
        featured: true,
        image: book,
        sequence: true,
        sequenceFrames: [0, 500] // [First frame, last frame]
      }
    ],
    featuredProjects: [
      {
        id: 4,
        category: 'Award',
        title: 'Multiple Projects won an Eyes and Ears Award 2024',
        image: eyes,
        bgColor: 'bg-blue'
      },
      {
        id: 5,
        category: 'Artificial Intelligence',
        title: 'Generating advanced QR-Codes with Stable Diffusion',
        image: qr,
        bgColor: 'bg-blue'
      },
      {
        id: 8,
        category: 'Clients',
        title: 'Relaunching a Berlin Lawyers Corporate Design and Website',
        image: rk,
        bgColor: 'bg-azure'
      },
      {
        id: 9,
        category: 'Clients',
        title: 'Automating Video Workflows in Trailer Production for TV Channel',
        image: 'http://localhost:3845/assets/6449251a7ee4e321b136b307c80bb87669c81841.png',
        bgColor: 'bg-orange'
      }
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