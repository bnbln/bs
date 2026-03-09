import type { ReactNode } from 'react'

interface KpiCardProps {
  label: string
  value: string | number
  helper?: string
  icon?: ReactNode
  tone?: 'green' | 'violet' | 'orange' | 'blue' | 'slate'
}

const toneClass: Record<NonNullable<KpiCardProps['tone']>, string> = {
  green: 'from-emerald-500 to-emerald-600',
  violet: 'from-violet-500 to-violet-600',
  orange: 'from-orange-500 to-orange-600',
  blue: 'from-sky-500 to-sky-600',
  slate: 'from-slate-700 to-slate-800',
}

export default function KpiCard({ label, value, helper, icon, tone = 'slate' }: KpiCardProps) {
  return (
    <div
      className={`rounded-3xl bg-gradient-to-br ${toneClass[tone]} p-5 text-white shadow-[0_18px_30px_-20px_rgba(15,23,42,0.7)]`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/80">{label}</p>
        {icon && <span className="text-white/80">{icon}</span>}
      </div>
      <p className="mt-4 text-3xl font-black leading-none tracking-tight">{value}</p>
      {helper && <p className="mt-3 text-xs text-white/85">{helper}</p>}
    </div>
  )
}
