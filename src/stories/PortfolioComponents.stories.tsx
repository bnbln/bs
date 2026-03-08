import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Linkedin, Mail } from 'lucide-react'

import About from '../components/About'
import { PrimaryActionButton, SocialActionButton } from '../components/ActionButtons'
import AdaptiveVideoPlayer from '../components/AdaptiveVideoPlayer'
import Article from '../components/Article'
import BrandExperience from '../components/BrandExperience'
import Brands from '../components/Brands'
import BubbleRotatingText from '../components/BubbleRotatingText'
import Callout from '../components/Callout'
import CodeBlock from '../components/CodeBlock'
import ColorPalette from '../components/ColorPalette'
import Contact from '../components/Contact'
import ContactForm from '../components/ContactForm'
import Create from '../components/Create'
import CustomVideoPlayer from '../components/CustomVideoPlayer'
import FeaturedProjects from '../components/FeaturedProjects'
import FontSpecimen from '../components/FontSpecimen'
import Footer from '../components/Footer'
import GridMotion from '../components/GridMotion'
import GridMotionExample from '../components/GridMotionExample'
import Hero from '../components/Hero'
import LoadingScreen from '../components/LoadingScreen'
import LottiePlayer from '../components/LottiePlayer'
import MagneticButton from '../components/MagneticButton'
import Mockup from '../components/Mockup'
import Navigation from '../components/Navigation'
import RotatingText from '../components/RotatingText'
import ScrollScrubVideo from '../components/ScrollScrubVideo'
import ScrollStack, { ScrollStackItem } from '../components/ScrollStack'
import ScrollVelocity from '../components/ScrollVelocity'
import Shuffle from '../components/Shuffle'
import Skills from '../components/Skills'
import StatHighlight from '../components/StatHighlight'
import StructuredData from '../components/StructuredData'
import ThreeScene from '../components/ThreeScene'
import Work from '../components/Work'
import { brandLogos } from '../lib/brands'
import { sampleArticleProject, sampleProjects } from './storybook-fixtures'

const meta: Meta = {
  title: 'Portfolio/Components',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    controls: {
      expanded: true,
      sort: 'requiredFirst',
    },
  },
}

export default meta

const Padded = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
  <div className={dark ? 'min-h-screen bg-[#1C1D20] p-8' : 'min-h-screen bg-[#F5F5F7] p-8'}>{children}</div>
)

type ActionButtonsArgs = {
  primaryHref: string
  primaryLabel: string
  fullWidth: boolean
  primaryWrapperClassName: string
  primaryClassName: string
  socialHref: string
  socialLabel: string
  socialExternal: boolean
  socialClassName: string
}

export const ActionButtons: StoryObj<ActionButtonsArgs> = {
  args: {
    primaryHref: '/contact',
    primaryLabel: 'Start a Project',
    fullWidth: false,
    primaryWrapperClassName: '',
    primaryClassName: '',
    socialHref: 'https://linkedin.com',
    socialLabel: 'LinkedIn',
    socialExternal: true,
    socialClassName: '',
  },
  argTypes: {
    primaryHref: { control: 'text' },
    primaryLabel: { control: 'text' },
    fullWidth: { control: 'boolean' },
    primaryWrapperClassName: { control: 'text' },
    primaryClassName: { control: 'text' },
    socialHref: { control: 'text' },
    socialLabel: { control: 'text' },
    socialExternal: { control: 'boolean' },
    socialClassName: { control: 'text' },
  },
  render: (args) => (
    <Padded>
      <div className="flex flex-col items-start gap-6">
        <PrimaryActionButton
          href={args.primaryHref}
          fullWidth={args.fullWidth}
          wrapperClassName={args.primaryWrapperClassName}
          className={args.primaryClassName}
        >
          {args.primaryLabel}
        </PrimaryActionButton>
        <div className="flex gap-4">
          <SocialActionButton
            href={args.socialHref}
            icon={Linkedin}
            label={args.socialLabel}
            external={args.socialExternal}
            className={args.socialClassName}
          />
          <SocialActionButton href="mailto:mail@example.com" icon={Mail} label="Email" />
        </div>
      </div>
    </Padded>
  ),
}

export const AboutSection: StoryObj = {
  render: () => <About />,
}

type AdaptiveVideoArgs = {
  videoUrl: string
  thumbnailUrl: string
  color: string
  autoStart: boolean
  aspect: string
  className: string
  loop: boolean
  muted: boolean
  minimal: boolean
}

export const AdaptiveVideoPlayerComponent: StoryObj<AdaptiveVideoArgs> = {
  args: {
    videoUrl: '/assets/book.mp4',
    thumbnailUrl: '/assets/book.avif',
    color: '#3DB1FF',
    autoStart: false,
    aspect: 'aspect-video',
    className: '',
    loop: false,
    muted: false,
    minimal: false,
  },
  argTypes: {
    videoUrl: { control: 'text' },
    thumbnailUrl: { control: 'text' },
    color: { control: 'color' },
    autoStart: { control: 'boolean' },
    aspect: { control: 'text' },
    className: { control: 'text' },
    loop: { control: 'boolean' },
    muted: { control: 'boolean' },
    minimal: { control: 'boolean' },
  },
  render: (args) => (
    <Padded dark>
      <div className="max-w-5xl mx-auto">
        <AdaptiveVideoPlayer {...args} />
      </div>
    </Padded>
  ),
}

type ArticlePlaygroundArgs = {
  slug: string
  title: string
  subtitle: string
  category: string[]
  client: string[]
  awards: string[]
  excerpts: string
  description: string
  published: string
  accentColor: string
  image: string
  video: string
  pageVideo: string
  heroImage: string
  heroLottie: string
  heroHide: boolean
  heroAspect: string
  featured: boolean
  hasAnimation: boolean
  animationSequence: NonNullable<typeof sampleArticleProject.animationSequence>
  heroPriority: boolean
  content: string
  allProjects: typeof sampleProjects
}

export const ArticleMarkdownPlayground: StoryObj<ArticlePlaygroundArgs> = {
  args: {
    slug: sampleArticleProject.slug,
    title: sampleArticleProject.title,
    subtitle: sampleArticleProject.subtitle || '',
    category: Array.isArray(sampleArticleProject.category)
      ? sampleArticleProject.category
      : [sampleArticleProject.category],
    client: sampleArticleProject.client || [],
    awards: sampleArticleProject.awards || [],
    excerpts: sampleArticleProject.excerpts,
    description: sampleArticleProject.description || '',
    published: sampleArticleProject.published,
    accentColor: sampleArticleProject.bgColor || '#3DB1FF',
    image: sampleArticleProject.image,
    video: sampleArticleProject.video || '',
    pageVideo: sampleArticleProject.pageVideo || '',
    heroImage: sampleArticleProject.heroImage || '',
    heroLottie: sampleArticleProject.heroLottie || '',
    heroHide: sampleArticleProject.heroHide || false,
    heroAspect: sampleArticleProject.heroAspect || '1298/730.125',
    featured: sampleArticleProject.featured,
    hasAnimation: sampleArticleProject.hasAnimation,
    animationSequence:
      sampleArticleProject.animationSequence || {
        videoPath: '/assets/reminders-8.mp4',
        mobileVideoPath: '/assets/reminders-8-mobile-scrub.mp4',
        safariVideoPath: '/assets/reminders-8-safari-scrub.mp4',
        frameCount: 501,
      },
    heroPriority: false,
    content: sampleArticleProject.content || '',
    allProjects: sampleProjects,
  },
  argTypes: {
    slug: { control: 'text' },
    title: { control: 'text' },
    subtitle: { control: 'text' },
    category: { control: 'object' },
    client: { control: 'object' },
    awards: { control: 'object' },
    excerpts: { control: 'text' },
    description: { control: 'text' },
    published: { control: 'text' },
    accentColor: { control: 'color' },
    image: { control: 'text' },
    video: { control: 'text' },
    pageVideo: { control: 'text' },
    heroImage: { control: 'text' },
    heroLottie: { control: 'text' },
    heroHide: { control: 'boolean' },
    heroAspect: { control: 'text' },
    featured: { control: 'boolean' },
    hasAnimation: { control: 'boolean' },
    animationSequence: { control: 'object' },
    heroPriority: { control: 'boolean' },
    content: { control: 'text' },
    allProjects: { control: 'object' },
  },
  render: (args) => {
    const project = {
      ...sampleArticleProject,
      slug: args.slug,
      title: args.title,
      subtitle: args.subtitle,
      category: args.category,
      client: args.client,
      awards: args.awards,
      excerpts: args.excerpts,
      description: args.description,
      published: args.published,
      bgColor: args.accentColor,
      image: args.image,
      video: args.video || undefined,
      pageVideo: args.pageVideo || undefined,
      heroImage: args.heroImage || undefined,
      heroLottie: args.heroLottie || undefined,
      heroHide: args.heroHide,
      heroAspect: args.heroAspect || undefined,
      featured: args.featured,
      hasAnimation: args.hasAnimation,
      animationSequence: args.hasAnimation ? args.animationSequence : undefined,
      content: args.content,
    }

    return <Article project={project} allProjects={args.allProjects} heroPriority={args.heroPriority} />
  },
}

export const BrandExperienceSection: StoryObj = {
  render: () => <BrandExperience />,
}

type BrandsArgs = {
  title: string
  logos: typeof brandLogos
}

export const BrandsComponent: StoryObj<BrandsArgs> = {
  args: {
    title: 'Clients & Brands',
    logos: brandLogos,
  },
  argTypes: {
    title: { control: 'text' },
    logos: { control: 'object' },
  },
  render: (args) => (
    <Padded>
      <div className="max-w-5xl mx-auto">
        <Brands logos={args.logos} title={args.title} />
      </div>
    </Padded>
  ),
}

type BubbleArgs = {
  texts: string[]
  interval: number
  className: string
}

export const BubbleRotatingTextComponent: StoryObj<BubbleArgs> = {
  args: {
    texts: ['Design', 'Code', 'Motion'],
    interval: 1800,
    className: 'text-2xl',
  },
  argTypes: {
    texts: { control: 'object' },
    interval: { control: { type: 'number', min: 500, max: 8000, step: 100 } },
    className: { control: 'text' },
  },
  render: (args) => (
    <Padded dark>
      <BubbleRotatingText {...args} />
    </Padded>
  ),
}

type CalloutArgs = {
  variant: 'insight' | 'context' | 'result' | 'note' | 'warning'
  accentColor: string
  title: string
  content: string
}

export const CalloutComponent: StoryObj<CalloutArgs> = {
  args: {
    variant: 'insight',
    accentColor: '#3DB1FF',
    title: 'Design Principle',
    content: 'Klare visuelle Hierarchie reduziert kognitive Last und verbessert Conversion.',
  },
  argTypes: {
    variant: { control: 'select', options: ['insight', 'context', 'result', 'note', 'warning'] },
    accentColor: { control: 'color' },
    title: { control: 'text' },
    content: { control: 'text' },
  },
  render: (args) => (
    <Padded>
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8">
        <Callout variant={args.variant} accentColor={args.accentColor} title={args.title}>
          {args.content}
        </Callout>
      </div>
    </Padded>
  ),
}

type CodeBlockArgs = {
  title: string
  description: string
  hideHeader: boolean
  code: string
  language: string
  filename: string
  githubUrl: string
  liveUrl: string
}

export const CodeBlockComponent: StoryObj<CodeBlockArgs> = {
  args: {
    title: 'TypeScript Utility',
    description: 'Minimales Beispiel fuer Syntax-Highlighting',
    hideHeader: false,
    code: 'export const add = (a: number, b: number) => a + b',
    language: 'ts',
    filename: 'utils/add.ts',
    githubUrl: '',
    liveUrl: '',
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    hideHeader: { control: 'boolean' },
    code: { control: 'text' },
    language: { control: 'text' },
    filename: { control: 'text' },
    githubUrl: { control: 'text' },
    liveUrl: { control: 'text' },
  },
  render: (args) => (
    <Padded>
      <div className="max-w-4xl mx-auto">
        <CodeBlock {...args} />
      </div>
    </Padded>
  ),
}

type ColorPaletteArgs = {
  title: string
  description: string
  hideHeader: boolean
  colors: Array<{ name: string; hex: string; rgb?: string; usage?: string; rank?: number }>
}

export const ColorPaletteComponent: StoryObj<ColorPaletteArgs> = {
  args: {
    title: 'Brand Colors',
    description: 'Beispielhafte Farbrampen',
    hideHeader: false,
    colors: [
      { name: 'Midnight', hex: '#1C1D20', usage: 'Background', rank: 1 },
      { name: 'Sky', hex: '#3DB1FF', usage: 'Primary Accent', rank: 2 },
      { name: 'Mint', hex: '#8AE9C1', usage: 'Secondary Accent', rank: 3 },
      { name: 'Cloud', hex: '#F5F5F7', usage: 'Surface', rank: 4 },
      { name: 'Ink', hex: '#111827', usage: 'Text', rank: 5 },
    ],
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    hideHeader: { control: 'boolean' },
    colors: { control: 'object' },
  },
  render: (args) => (
    <Padded>
      <div className="max-w-5xl mx-auto">
        <ColorPalette {...args} />
      </div>
    </Padded>
  ),
}

export const ContactSection: StoryObj = {
  render: () => <Contact />,
}

export const ContactFormComponent: StoryObj = {
  render: () => (
    <Padded>
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8">
        <ContactForm />
      </div>
    </Padded>
  ),
}

export const CreateSection: StoryObj = {
  render: () => <Create />,
}

type CustomVideoArgs = {
  videoUrl: string
  thumbnailUrl: string
  color: string
  startPlaying: boolean
}

export const CustomVideoPlayerComponent: StoryObj<CustomVideoArgs> = {
  args: {
    videoUrl: '/assets/book.mp4',
    thumbnailUrl: '/assets/book.avif',
    color: '#3DB1FF',
    startPlaying: false,
  },
  argTypes: {
    videoUrl: { control: 'text' },
    thumbnailUrl: { control: 'text' },
    color: { control: 'color' },
    startPlaying: { control: 'boolean' },
  },
  render: (args) => (
    <Padded dark>
      <div className="max-w-5xl mx-auto">
        <CustomVideoPlayer {...args} />
      </div>
    </Padded>
  ),
}

type ProjectListArgs = {
  data: typeof sampleProjects
}

export const FeaturedProjectsSection: StoryObj<ProjectListArgs> = {
  args: {
    data: sampleProjects,
  },
  argTypes: {
    data: { control: 'object' },
  },
  render: (args) => <FeaturedProjects data={args.data} />,
}

type FontSpecimenArgs = {
  name: string
  styles: string
  sample: string
  bgColor: string
  color: string
  svgAa: string
  svgTitle: string
}

export const FontSpecimenComponent: StoryObj<FontSpecimenArgs> = {
  args: {
    name: 'Inter',
    styles: 'Regular, Medium, Bold',
    sample: 'Design that ships.',
    bgColor: '#F5F5F7',
    color: '#1C1D20',
    svgAa: '/assets/fonts/mark-ot-aa.svg',
    svgTitle: '/assets/fonts/mark-ot-title.svg',
  },
  argTypes: {
    name: { control: 'text' },
    styles: { control: 'text' },
    sample: { control: 'text' },
    bgColor: { control: 'color' },
    color: { control: 'color' },
    svgAa: { control: 'text' },
    svgTitle: { control: 'text' },
  },
  render: (args) => (
    <Padded>
      <div className="max-w-6xl mx-auto">
        <FontSpecimen {...args} />
      </div>
    </Padded>
  ),
}

export const FooterSection: StoryObj = {
  render: () => (
    <div className="bg-[#1C1D20] min-h-[600px]">
      <style>{`.footer-story footer { position: relative !important; left: auto !important; bottom: auto !important; z-index: 1 !important; }`}</style>
      <div className="footer-story">
        <Footer />
      </div>
    </div>
  ),
}

type GridMotionArgs = {
  items: Array<string | { name: string; text?: string; image?: string; width: string; height: string; backgroundColor: string }>
  gradientColor: string
}

export const GridMotionComponent: StoryObj<GridMotionArgs> = {
  args: {
    gradientColor: 'rgba(0,0,0,0.08)',
    items: ['Design', 'Motion', 'Code', 'Strategy', 'UX', 'UI', 'Brand', 'Web', 'Product', 'Research'],
  },
  argTypes: {
    items: { control: 'object' },
    gradientColor: { control: 'color' },
  },
  render: (args) => (
    <Padded>
      <div className="h-[50vh] bg-white rounded-3xl overflow-hidden">
        <GridMotion {...args} />
      </div>
    </Padded>
  ),
}

export const GridMotionExampleComponent: StoryObj = {
  render: () => (
    <Padded>
      <GridMotionExample />
    </Padded>
  ),
}

type HeroArgs = {
  title: string
  location: string
}

export const HeroSection: StoryObj<HeroArgs> = {
  args: {
    title: 'Benedikt Schnupp',
    location: 'Berlin, Germany',
  },
  argTypes: {
    title: { control: 'text' },
    location: { control: 'text' },
  },
  render: (args) => <Hero {...args} />,
}

type LoadingArgs = {
  projects: typeof sampleProjects
}

export const LoadingScreenComponent: StoryObj<LoadingArgs> = {
  args: {
    projects: sampleProjects,
  },
  argTypes: {
    projects: { control: 'object' },
  },
  render: (args) => <LoadingScreen onLoadingComplete={() => undefined} projects={args.projects} />,
}

type LottieArgs = {
  src: string
  loop: boolean
  autoplay: boolean
  className: string
  style: React.CSSProperties
}

export const LottiePlayerComponent: StoryObj<LottieArgs> = {
  args: {
    src: '/assets/sample-lottie.json',
    loop: true,
    autoplay: true,
    className: 'w-full h-full',
    style: {},
  },
  argTypes: {
    src: { control: 'text' },
    loop: { control: 'boolean' },
    autoplay: { control: 'boolean' },
    className: { control: 'text' },
    style: { control: 'object' },
  },
  render: (args) => (
    <Padded>
      <div className="max-w-2xl h-[360px] mx-auto bg-white rounded-3xl p-6">
        <LottiePlayer {...args} />
      </div>
    </Padded>
  ),
}

type MagneticArgs = {
  label: string
  className: string
}

export const MagneticButtonComponent: StoryObj<MagneticArgs> = {
  args: {
    label: 'Hover me',
    className: '',
  },
  argTypes: {
    label: { control: 'text' },
    className: { control: 'text' },
  },
  render: (args) => (
    <Padded>
      <MagneticButton className={args.className}>
        <button className="px-6 py-3 rounded-full bg-black text-white font-medium">{args.label}</button>
      </MagneticButton>
    </Padded>
  ),
}

type MockupArgs = {
  useItems: boolean
  type: 'iphone' | 'macbook' | 'tv' | 'ipad' | 'android' | 'safari' | 'safari-tab'
  mediaUrl: string
  image: string
  video: string
  bgColor: string
  accentColor: string
  items: Array<{ type: string; image?: string; video?: string; mediaUrl?: string; bgColor?: string; url?: string }>
}

export const MockupComponent: StoryObj<MockupArgs> = {
  args: {
    useItems: true,
    type: 'iphone',
    mediaUrl: '',
    image: '/assets/reminders-plus/IMG_3086.PNG',
    video: '',
    bgColor: '#F5F5F7',
    accentColor: '#3DB1FF',
    items: [
      { type: 'iphone', image: '/assets/reminders-plus/IMG_3086.PNG' },
      { type: 'iphone', image: '/assets/reminders-plus/IMG_3087.PNG' },
      { type: 'iphone', image: '/assets/reminders-plus/IMG_3088.PNG' },
    ],
  },
  argTypes: {
    useItems: { control: 'boolean' },
    type: { control: 'select', options: ['iphone', 'macbook', 'tv', 'ipad', 'android', 'safari', 'safari-tab'] },
    mediaUrl: { control: 'text' },
    image: { control: 'text' },
    video: { control: 'text' },
    bgColor: { control: 'color' },
    accentColor: { control: 'color' },
    items: { control: 'object' },
  },
  render: (args) => (
    <Padded>
      <div className="max-w-6xl mx-auto">
        {args.useItems ? (
          <Mockup items={args.items} accentColor={args.accentColor} />
        ) : (
          <Mockup
            type={args.type}
            mediaUrl={args.mediaUrl || undefined}
            image={args.image || undefined}
            video={args.video || undefined}
            bgColor={args.bgColor}
            accentColor={args.accentColor}
          />
        )}
      </div>
    </Padded>
  ),
}

type NavigationArgs = {
  theme: 'dark' | 'light'
}

export const NavigationComponent: StoryObj<NavigationArgs> = {
  args: {
    theme: 'light',
  },
  argTypes: {
    theme: { control: 'inline-radio', options: ['dark', 'light'] },
  },
  render: (args) => (
    <div className="min-h-screen bg-[#F5F5F7]">
      <Navigation {...args} />
      <div className="pt-40 px-8 max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold font-space-grotesk">Navigation Preview</h2>
        <p className="mt-4 text-lg text-neutral-600">Die Navigation ist fixiert und inklusive Mobile-Menu verknuepft.</p>
      </div>
    </div>
  ),
}

type RotatingArgs = {
  texts: string[]
  transition: Record<string, unknown>
  initial: Record<string, unknown> | boolean
  animate: Record<string, unknown> | boolean
  exit: Record<string, unknown>
  animatePresenceMode: 'sync' | 'wait'
  animatePresenceInitial: boolean
  rotationInterval: number
  staggerDuration: number
  staggerFrom: 'first' | 'last' | 'center' | 'random' | number
  loop: boolean
  auto: boolean
  splitBy: string
  mainClassName: string
  splitLevelClassName: string
  elementLevelClassName: string
}

export const RotatingTextComponent: StoryObj<RotatingArgs> = {
  args: {
    texts: ['Design Systems', 'Motion Concepts', 'Frontend Architecture'],
    transition: { type: 'spring', damping: 25, stiffness: 300 },
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '-120%', opacity: 0 },
    animatePresenceMode: 'wait',
    animatePresenceInitial: false,
    rotationInterval: 1800,
    staggerDuration: 0,
    staggerFrom: 'first',
    loop: true,
    auto: true,
    splitBy: 'characters',
    mainClassName: 'text-4xl font-bold font-space-grotesk text-black',
    splitLevelClassName: '',
    elementLevelClassName: '',
  },
  argTypes: {
    texts: { control: 'object' },
    transition: { control: 'object' },
    initial: { control: 'object' },
    animate: { control: 'object' },
    exit: { control: 'object' },
    animatePresenceMode: { control: 'inline-radio', options: ['sync', 'wait'] },
    animatePresenceInitial: { control: 'boolean' },
    rotationInterval: { control: { type: 'number', min: 300, max: 10000, step: 100 } },
    staggerDuration: { control: { type: 'number', min: 0, max: 1, step: 0.01 } },
    staggerFrom: { control: 'select', options: ['first', 'last', 'center', 'random', 0] },
    loop: { control: 'boolean' },
    auto: { control: 'boolean' },
    splitBy: { control: 'text' },
    mainClassName: { control: 'text' },
    splitLevelClassName: { control: 'text' },
    elementLevelClassName: { control: 'text' },
  },
  render: (args) => (
    <Padded>
      <RotatingText
        texts={args.texts}
        transition={args.transition as any}
        initial={args.initial as any}
        animate={args.animate as any}
        exit={args.exit as any}
        animatePresenceMode={args.animatePresenceMode}
        animatePresenceInitial={args.animatePresenceInitial}
        rotationInterval={args.rotationInterval}
        staggerDuration={args.staggerDuration}
        staggerFrom={args.staggerFrom}
        loop={args.loop}
        auto={args.auto}
        splitBy={args.splitBy}
        mainClassName={args.mainClassName}
        splitLevelClassName={args.splitLevelClassName}
        elementLevelClassName={args.elementLevelClassName}
      />
    </Padded>
  ),
}

type ScrollScrubArgs = {
  videoPath: string
  mobileVideoPath: string
  safariVideoPath: string
  frameCount: number
  accentColor: string
  className: string
}

export const ScrollScrubVideoComponent: StoryObj<ScrollScrubArgs> = {
  args: {
    videoPath: '/assets/reminders-8.mp4',
    mobileVideoPath: '/assets/reminders-8-mobile-scrub.mp4',
    safariVideoPath: '/assets/reminders-8-safari-scrub.mp4',
    frameCount: 501,
    accentColor: '#3DB1FF',
    className: '',
  },
  argTypes: {
    videoPath: { control: 'text' },
    mobileVideoPath: { control: 'text' },
    safariVideoPath: { control: 'text' },
    frameCount: { control: { type: 'number', min: 1, max: 2000, step: 1 } },
    accentColor: { control: 'color' },
    className: { control: 'text' },
  },
  render: (args) => (
    <Padded>
      <div className="max-w-6xl mx-auto">
        <ScrollScrubVideo {...args} />
      </div>
    </Padded>
  ),
}

type ScrollStackArgs = {
  className: string
  itemDistance: number
  itemScale: number
  itemStackDistance: number
  stackPosition: string
  scaleEndPosition: string
  baseScale: number
  scaleDuration: number
  rotationAmount: number
  blurAmount: number
  cardClassName1: string
  cardClassName2: string
  cardClassName3: string
  card1: string
  card2: string
  card3: string
}

export const ScrollStackComponent: StoryObj<ScrollStackArgs> = {
  args: {
    className: 'h-full rounded-3xl bg-white',
    itemDistance: 60,
    itemScale: 0.03,
    itemStackDistance: 30,
    stackPosition: '20%',
    scaleEndPosition: '10%',
    baseScale: 0.85,
    scaleDuration: 0.5,
    rotationAmount: 0,
    blurAmount: 0,
    cardClassName1: 'bg-[#111827] text-white',
    cardClassName2: 'bg-[#1E293B] text-white',
    cardClassName3: 'bg-[#0F172A] text-white',
    card1: '01 Discovery',
    card2: '02 Concept',
    card3: '03 Delivery',
  },
  argTypes: {
    className: { control: 'text' },
    itemDistance: { control: { type: 'number', min: 0, max: 250, step: 1 } },
    itemScale: { control: { type: 'number', min: 0, max: 0.2, step: 0.01 } },
    itemStackDistance: { control: { type: 'number', min: 0, max: 120, step: 1 } },
    stackPosition: { control: 'text' },
    scaleEndPosition: { control: 'text' },
    baseScale: { control: { type: 'number', min: 0.5, max: 1, step: 0.01 } },
    scaleDuration: { control: { type: 'number', min: 0, max: 2, step: 0.05 } },
    rotationAmount: { control: { type: 'number', min: -15, max: 15, step: 1 } },
    blurAmount: { control: { type: 'number', min: 0, max: 12, step: 0.5 } },
    cardClassName1: { control: 'text' },
    cardClassName2: { control: 'text' },
    cardClassName3: { control: 'text' },
    card1: { control: 'text' },
    card2: { control: 'text' },
    card3: { control: 'text' },
  },
  render: (args) => (
    <div className="bg-[#F5F5F7] h-screen p-8">
      <ScrollStack
        className={args.className}
        itemDistance={args.itemDistance}
        itemScale={args.itemScale}
        itemStackDistance={args.itemStackDistance}
        stackPosition={args.stackPosition}
        scaleEndPosition={args.scaleEndPosition}
        baseScale={args.baseScale}
        scaleDuration={args.scaleDuration}
        rotationAmount={args.rotationAmount}
        blurAmount={args.blurAmount}
      >
        <ScrollStackItem itemClassName={args.cardClassName1}>
          <h3 className="text-4xl font-space-grotesk font-bold">{args.card1}</h3>
        </ScrollStackItem>
        <ScrollStackItem itemClassName={args.cardClassName2}>
          <h3 className="text-4xl font-space-grotesk font-bold">{args.card2}</h3>
        </ScrollStackItem>
        <ScrollStackItem itemClassName={args.cardClassName3}>
          <h3 className="text-4xl font-space-grotesk font-bold">{args.card3}</h3>
        </ScrollStackItem>
      </ScrollStack>
    </div>
  ),
}

type ScrollVelocityArgs = {
  texts: string[]
  velocity: number
  className: string
  damping: number
  stiffness: number
  numCopies: number
  velocityMapping: { input: [number, number]; output: [number, number] }
  parallaxClassName: string
  scrollerClassName: string
  parallaxStyle: React.CSSProperties
  scrollerStyle: React.CSSProperties
}

export const ScrollVelocityComponent: StoryObj<ScrollVelocityArgs> = {
  args: {
    texts: ['Benedikt Schnupp - ', 'Creative Developer - '],
    velocity: 80,
    className: 'text-white font-space-grotesk',
    damping: 50,
    stiffness: 400,
    numCopies: 8,
    velocityMapping: { input: [0, 1000], output: [0, 5] },
    parallaxClassName: '',
    scrollerClassName: '',
    parallaxStyle: {},
    scrollerStyle: {},
  },
  argTypes: {
    texts: { control: 'object' },
    velocity: { control: { type: 'number', min: -300, max: 300, step: 1 } },
    className: { control: 'text' },
    damping: { control: { type: 'number', min: 1, max: 120, step: 1 } },
    stiffness: { control: { type: 'number', min: 10, max: 800, step: 10 } },
    numCopies: { control: { type: 'number', min: 1, max: 20, step: 1 } },
    velocityMapping: { control: 'object' },
    parallaxClassName: { control: 'text' },
    scrollerClassName: { control: 'text' },
    parallaxStyle: { control: 'object' },
    scrollerStyle: { control: 'object' },
  },
  render: (args) => (
    <Padded dark>
      <ScrollVelocity
        texts={args.texts}
        velocity={args.velocity}
        className={args.className}
        damping={args.damping}
        stiffness={args.stiffness}
        numCopies={args.numCopies}
        velocityMapping={args.velocityMapping}
        parallaxClassName={args.parallaxClassName}
        scrollerClassName={args.scrollerClassName}
        parallaxStyle={args.parallaxStyle}
        scrollerStyle={args.scrollerStyle}
      />
    </Padded>
  ),
}

type ShuffleArgs = {
  text: string
  className: string
  shuffleDirection: 'left' | 'right'
  duration: number
  maxDelay: number
  ease: string
  threshold: number
  rootMargin: string
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span'
  textAlign: 'left' | 'center' | 'right'
  shuffleTimes: number
  animationMode: 'random' | 'evenodd'
  loop: boolean
  loopDelay: number
  stagger: number
  scrambleCharset: string
  colorFrom: string
  colorTo: string
  triggerOnce: boolean
  respectReducedMotion: boolean
  triggerOnHover: boolean
}

export const ShuffleComponent: StoryObj<ShuffleArgs> = {
  args: {
    text: 'Shuffling headline animation',
    className: 'text-6xl font-space-grotesk font-bold text-black',
    shuffleDirection: 'right',
    duration: 0.35,
    maxDelay: 0,
    ease: 'power3.out',
    threshold: 0.1,
    rootMargin: '-100px',
    tag: 'h2',
    textAlign: 'left',
    shuffleTimes: 1,
    animationMode: 'evenodd',
    loop: false,
    loopDelay: 0,
    stagger: 0.03,
    scrambleCharset: '',
    colorFrom: '',
    colorTo: '',
    triggerOnce: false,
    respectReducedMotion: true,
    triggerOnHover: true,
  },
  argTypes: {
    text: { control: 'text' },
    className: { control: 'text' },
    shuffleDirection: { control: 'inline-radio', options: ['left', 'right'] },
    duration: { control: { type: 'number', min: 0, max: 3, step: 0.05 } },
    maxDelay: { control: { type: 'number', min: 0, max: 3, step: 0.05 } },
    ease: { control: 'text' },
    threshold: { control: { type: 'number', min: 0, max: 1, step: 0.01 } },
    rootMargin: { control: 'text' },
    tag: { control: 'select', options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span'] },
    textAlign: { control: 'inline-radio', options: ['left', 'center', 'right'] },
    shuffleTimes: { control: { type: 'number', min: 1, max: 12, step: 1 } },
    animationMode: { control: 'inline-radio', options: ['random', 'evenodd'] },
    loop: { control: 'boolean' },
    loopDelay: { control: { type: 'number', min: 0, max: 6, step: 0.1 } },
    stagger: { control: { type: 'number', min: 0, max: 1, step: 0.01 } },
    scrambleCharset: { control: 'text' },
    colorFrom: { control: 'color' },
    colorTo: { control: 'color' },
    triggerOnce: { control: 'boolean' },
    respectReducedMotion: { control: 'boolean' },
    triggerOnHover: { control: 'boolean' },
  },
  render: (args) => (
    <Padded>
      <div className="max-w-4xl mx-auto pt-40">
        <Shuffle {...args} />
      </div>
    </Padded>
  ),
}

export const SkillsSection: StoryObj = {
  render: () => <Skills />,
}

type StatArgs = {
  stats: Array<{ label: string; value: string }>
  accentColor: string
}

export const StatHighlightComponent: StoryObj<StatArgs> = {
  args: {
    accentColor: '#3DB1FF',
    stats: [
      { label: 'Years Experience', value: '7+' },
      { label: 'Projects Delivered', value: '200+' },
      { label: 'Awards', value: '8' },
    ],
  },
  argTypes: {
    stats: { control: 'object' },
    accentColor: { control: 'color' },
  },
  render: (args) => (
    <Padded>
      <div className="max-w-5xl mx-auto">
        <StatHighlight {...args} />
      </div>
    </Padded>
  ),
}

type StructuredDataArgs = {
  type: 'person' | 'article' | 'website'
  data: Record<string, unknown>
}

export const StructuredDataComponent: StoryObj<StructuredDataArgs> = {
  args: {
    type: 'article',
    data: {
      headline: 'Storybook StructuredData Example',
      author: { '@type': 'Person', name: 'Benedikt Schnupp' },
    },
  },
  argTypes: {
    type: { control: 'inline-radio', options: ['person', 'article', 'website'] },
    data: { control: 'object' },
  },
  render: (args) => (
    <Padded>
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8">
        <p className="text-sm text-neutral-600 mb-4">Diese Story rendert das JSON-LD Script-Tag ueber die Komponente.</p>
        <StructuredData type={args.type} data={args.data} />
        <pre className="text-xs bg-neutral-100 rounded-xl p-4 overflow-auto">{JSON.stringify({ '@context': 'https://schema.org', '@type': args.type, ...args.data }, null, 2)}</pre>
      </div>
    </Padded>
  ),
}

type ThreeSceneArgs = {
  modelPath: string
  height: string
  className: string
  autoRotate: boolean
  preset: 'apartment' | 'city' | 'dawn' | 'forest' | 'lobby' | 'night' | 'park' | 'studio' | 'sunset' | 'warehouse'
  scale: number | [number, number, number]
  position: [number, number, number]
  rotation: [number, number, number]
}

export const ThreeSceneComponent: StoryObj<ThreeSceneArgs> = {
  args: {
    modelPath: '',
    height: '480px',
    className: '',
    autoRotate: true,
    preset: 'studio',
    scale: 1,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
  },
  argTypes: {
    modelPath: { control: 'text' },
    height: { control: 'text' },
    className: { control: 'text' },
    autoRotate: { control: 'boolean' },
    preset: { control: 'select', options: ['apartment', 'city', 'dawn', 'forest', 'lobby', 'night', 'park', 'studio', 'sunset', 'warehouse'] },
    scale: { control: 'object' },
    position: { control: 'object' },
    rotation: { control: 'object' },
  },
  render: (args) => (
    <Padded>
      <div className="max-w-5xl mx-auto">
        <ThreeScene {...args} />
      </div>
    </Padded>
  ),
}

export const WorkSection: StoryObj<ProjectListArgs> = {
  args: {
    data: sampleProjects,
  },
  argTypes: {
    data: { control: 'object' },
  },
  render: (args) => <Work data={args.data} />,
}
