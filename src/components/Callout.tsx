import React from 'react'
import { Lightbulb, Info, CheckCircle2, AlertTriangle } from 'lucide-react'

export type CalloutVariant = 'insight' | 'context' | 'result' | 'note' | 'warning'

interface CalloutProps {
  variant: CalloutVariant
  accentColor: string
  title?: string
  children: React.ReactNode
}

const variantMeta: Record<
  CalloutVariant,
  { label: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }
> = {
  insight: { label: 'Key Insight', Icon: Lightbulb },
  context: { label: 'Kontext', Icon: Info },
  result: { label: 'Ergebnis', Icon: CheckCircle2 },
  note: { label: 'Hinweis', Icon: Info },
  warning: { label: 'Achtung', Icon: AlertTriangle },
}

export default function Callout({ variant, accentColor, title, children }: CalloutProps) {
  const { label, Icon } = variantMeta[variant]

  return (
    <aside
      className="relative overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm"
      style={{ ['--callout-accent' as any]: accentColor }}
      aria-label={label}
    >
      {/* Accent glow + stripe */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.10]"
        style={{
          background:
            'radial-gradient(900px circle at 20% 0%, var(--callout-accent), transparent 55%)',
        }}
      />
      <div
        className="pointer-events-none absolute left-0 top-0 h-full w-[3px]"
        style={{ backgroundColor: 'var(--callout-accent)' }}
      />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ring-black/10"
            style={{ backgroundColor: `${accentColor}14` }}
            aria-hidden="true"
          >
            <Icon className="h-5 w-5" style={{ color: accentColor }} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#86868b] font-inter">
                {label}
              </div>
              {title && (
                <div className="text-[15px] sm:text-[16px] font-semibold tracking-[-0.01em] text-[#1D1D1F] font-space-grotesk">
                  {title}
                </div>
              )}
            </div>

            <div className="mt-3 space-y-3 text-[15px] sm:text-[16px] leading-[1.65] tracking-[-0.01em] text-[#1D1D1F] font-inter">
              {children}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
