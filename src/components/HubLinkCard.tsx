import Link from 'next/link'

interface HubLinkCardProps {
  href: string
  title: string
  description: string
  accentColor?: string
  eyebrow?: string
  className?: string
}

const HubLinkCard = ({
  href,
  title,
  description,
  accentColor = '#9CA3AF',
  eyebrow,
  className = '',
}: HubLinkCardProps) => {
  return (
    <Link
      href={href}
      className={`group relative isolate block h-full overflow-hidden rounded-[28px] border border-black/10 bg-white transition-transform duration-500 hover:-translate-y-1 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-white" />
        <div className="absolute right-6 top-6 h-3.5 w-3.5 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.72 }} />
      </div>

      <div className="relative flex h-full min-h-[250px] sm:min-h-[280px] md:min-h-[300px] lg:min-h-[320px] flex-col justify-between p-7 sm:p-8 md:p-9 lg:p-10">
        <div>
          {eyebrow && (
            <p className="font-space-grotesk text-[11px] uppercase tracking-[0.18em] text-black/50 mb-5">
              {eyebrow}
            </p>
          )}
          <h3 className="font-space-grotesk font-bold text-[clamp(1.9rem,3.2vw,3.15rem)] leading-[0.98] tracking-[-0.02em] text-black max-w-[13ch] [text-wrap:balance]">
            {title}
          </h3>
        </div>

        <div>
          <p className="text-[15px] md:text-[16px] leading-relaxed text-black/60 font-inter max-w-[30ch] line-clamp-3 sm:line-clamp-4">
            {description}
          </p>
          <span className="mt-7 inline-flex items-center gap-2 font-space-grotesk text-sm font-semibold text-black transition-transform duration-300 group-hover:translate-x-1">
            Open hub
            <span aria-hidden="true">→</span>
          </span>
        </div>
      </div>
    </Link>
  )
}

export default HubLinkCard
