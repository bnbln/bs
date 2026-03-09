interface StatePanelProps {
  title: string
  message: string
  tone?: 'neutral' | 'error'
}

export default function StatePanel({ title, message, tone = 'neutral' }: StatePanelProps) {
  return (
    <div
      className={`rounded-2xl border p-4 text-sm ${
        tone === 'error'
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-slate-200 bg-slate-50 text-slate-600'
      }`}
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{message}</p>
    </div>
  )
}
