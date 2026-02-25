import React from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import MagneticButton from './MagneticButton'

const joinClasses = (...classes: Array<string | undefined>) =>
  classes.filter(Boolean).join(' ')

interface PrimaryActionButtonProps {
  href: string
  children: React.ReactNode
  fullWidth?: boolean
  wrapperClassName?: string
  className?: string
}

interface SocialActionButtonProps {
  href: string
  icon: LucideIcon
  label: string
  external?: boolean
  className?: string
}

export const PrimaryActionButton = ({
  href,
  children,
  fullWidth = false,
  wrapperClassName,
  className,
}: PrimaryActionButtonProps) => {
  const widthClass = fullWidth ? 'w-full sm:w-auto' : 'w-auto'

  return (
    <MagneticButton className={joinClasses(widthClass, wrapperClassName)}>
      <Link
        href={href}
        className={joinClasses(
          'group relative inline-flex items-center justify-center sm:justify-between px-8 py-4 sm:py-5 md:px-10 lg:py-6 bg-[#1C1D20] text-white rounded-full overflow-hidden transition-all duration-500 hover:bg-black shadow-[0_8px_20px_rgb(0,0,0,0.15)] hover:shadow-[0_12px_30px_rgb(0,0,0,0.25)] flex-grow',
          widthClass,
          className
        )}
      >
        <span className="relative z-10 font-space-grotesk font-bold text-base sm:text-lg md:text-xl tracking-wide sm:mr-6 mr-3">
          {children}
        </span>
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white text-white group-hover:text-black transition-colors duration-500 relative z-10 shrink-0">
          <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-45 transition-transform duration-500" />
        </div>
      </Link>
    </MagneticButton>
  )
}

export const SocialActionButton = ({
  href,
  icon: Icon,
  label,
  external = false,
  className,
}: SocialActionButtonProps) => (
  <MagneticButton>
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={joinClasses(
        'group flex flex-col items-center justify-center w-[56px] h-[56px] sm:w-[60px] sm:h-[60px] md:w-[68px] md:h-[68px] rounded-full border border-neutral-200 hover:border-black hover:bg-black transition-all text-black hover:text-white bg-white shadow-sm',
        className
      )}
      aria-label={label}
    >
      <Icon className="w-5 h-5 lg:w-6 lg:h-6 mb-0.5" />
    </a>
  </MagneticButton>
)
