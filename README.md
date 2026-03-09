# Benedikt Schnupp Portfolio

A modern, animated portfolio website built with React, Vite, GSAP, and Framer Motion, based on the Figma design from [https://www.figma.com/design/IwSEQvYtP7b1zkjiSTMZVs/Untitled?node-id=0-25&m=dev](https://www.figma.com/design/IwSEQvYtP7b1zkjiSTMZVs/Untitled?node-id=0-25&m=dev).

## 🎨 Features

- **Exact Figma Design Replication** - Faithfully recreates the original design
- **Smooth Animations** - GSAP and Framer Motion for professional animations
- **Responsive Design** - Tailwind CSS for modern styling
- **TypeScript** - Type-safe development
- **Fast Development** - Vite for lightning-fast builds

## 🛠️ Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **GSAP** - Advanced animations and scroll triggers
- **Framer Motion** - React animations
- **Tailwind CSS v3** - Utility-first CSS framework

## 🚀 Getting Started

### Prerequisites
- Node.js v20.5.1 or higher
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd benedikt-portfolio
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Navigation.tsx   # Header navigation with animations
│   ├── Hero.tsx        # Hero section with large title
│   ├── FeaturedProjects.tsx # Horizontal scrolling project cards
│   ├── About.tsx       # About section with large typography
│   ├── BrandExperience.tsx # Brand logos and awards
│   ├── Work.tsx        # Work portfolio with large images
│   ├── Contact.tsx     # Contact section with profile
│   └── Footer.tsx      # Footer with background image
├── App.tsx             # Main app component with GSAP setup
├── main.tsx           # Entry point
└── index.css          # Global styles and Tailwind directives
```

## 🎯 Design Features

### Hero Section
- Large animated title: "Benedikt Schnupp – Benedikt Schnupp"
- Location badge with Berlin, Germany
- Role indicators: "Senior Designer & Developer"
- Background image from Figma design

### Featured Projects
- Horizontal scrolling project cards
- 6 different projects with unique backgrounds
- Hover animations and smooth transitions
- Categories: Award, AI, Blender, Trailer Campaign, Clients

### About Section
- Large typography: "Crafting Connections through Code & Creativity"
- Detailed description of skills and services
- Action buttons for interaction

### Brand Experience
- Animated brand logos from various clients
- Awards & Recognitions section
- Staggered animations for visual appeal

### Work Portfolio
- Large project images with titles
- Smooth scroll animations
- Professional presentation

## 🎨 Customization

### Colors
The design uses specific colors from the Figma design:
- Blue: `#0000ff`
- Azure: `#172340`
- Orange: `#f18825`
- White: `#ffffff`

### Typography
- **Space Grotesk** - Headings and navigation
- **Inter** - Body text and descriptions
- **Helvetica** - Project titles
- **Vollkorn** - Brand names

### Animations
- GSAP ScrollTrigger for scroll-based animations
- Framer Motion for component animations
- Staggered animations for project cards
- Hover effects on interactive elements

## 📱 Responsive Design

The portfolio is designed to work across different screen sizes with:
- Flexible layouts using Tailwind CSS
- Responsive typography
- Mobile-friendly navigation
- Optimized images and assets

## 🚀 Build for Production

```bash
npm run build
```

This will create an optimized production build in the `dist` folder.

## 📄 License

MIT License - feel free to use this as a template for your own portfolio!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Contact

For questions or support, please open an issue in the repository.

---

**Note:** This portfolio is based on the Figma design from the provided URL and includes all the visual elements, animations, and styling from the original design.
