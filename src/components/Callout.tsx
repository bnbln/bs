import React from 'react'

export type CalloutVariant = 'insight' | 'context' | 'result' | 'note' | 'warning'

interface CalloutProps {
  variant: CalloutVariant
  accentColor: string
  title?: string
  children: React.ReactNode
}

const variantMeta: Record<CalloutVariant, { label: string }> = {
  insight: { label: 'Key Insight' },
  context: { label: 'Context' },
  result: { label: 'Result' },
  note: { label: 'Note' },
  warning: { label: 'Warning' },
}

export default function Callout({ variant, accentColor, title, children }: CalloutProps) {
  const { label } = variantMeta[variant]

  return (
    <aside
      className="relative w-full py-8 md:py-12 border-t border-b border-black/10 my-8"
      style={{ ['--callout-accent' as any]: accentColor }}
      aria-label={label}
    >
      <div className="flex flex-col md:flex-row gap-6 md:gap-12 lg:gap-16 items-start">
        {/* Left Column: Label & Title */}
        <div className="w-full md:w-[35%] lg:w-[30%] flex-shrink-0 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
            <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#6e6e73] font-inter">
              {label}
            </span>
          </div>
          {title && (
            <h4 className="text-[24px] md:text-[28px] leading-[1.2] font-bold font-space-grotesk tracking-tight text-[#1D1D1F]">
              {title}
            </h4>
          )}
        </div>

        {/* Right Column: Content */}
        <div className="w-full md:w-[65%] lg:w-[70%]">
          <div className="text-[20px] md:text-[24px] leading-[1.5] tracking-[-0.015em] text-[#1D1D1F] font-inter font-medium">
            {children}
          </div>
        </div>
      </div>
    </aside>
  )
}
