import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, CircleDot } from 'lucide-react'
import type { DashboardProject } from './types'

interface CalendarWidgetProps {
    projects: DashboardProject[]
}

const DAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
]

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
    const day = new Date(year, month, 1).getDay()
    return day === 0 ? 6 : day - 1 // Make Monday = 0
}

export default function CalendarWidget({ projects }: CalendarWidgetProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1))
    }

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1))
    }

    // Find posts for the selected month to highlight them
    const highlights = useMemo(() => {
        const map = new Map<number, DashboardProject[]>()
        projects.forEach((p) => {
            // Use updatedAt or published depending on what implies "release/update"
            const date = new Date(p.updatedAt)
            if (date.getFullYear() === year && date.getMonth() === month) {
                const d = date.getDate()
                if (!map.has(d)) map.set(d, [])
                map.get(d)!.push(p)
            }
        })
        return map
    }, [projects, year, month])

    const selectedProjects = useMemo(() => {
        return projects.filter((p) => {
            const d = new Date(p.updatedAt)
            return (
                d.getFullYear() === selectedDate.getFullYear() &&
                d.getMonth() === selectedDate.getMonth() &&
                d.getDate() === selectedDate.getDate()
            )
        })
    }, [projects, selectedDate])

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between pb-6">
                <button
                    onClick={handlePrevMonth}
                    className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="rounded-full bg-pink-100 px-4 py-1.5 text-sm font-bold tracking-wide text-pink-700">
                    {MONTHS[month]} {year}
                </div>
                <button
                    onClick={handleNextMonth}
                    className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-y-4 text-center">
                {DAYS.map((day) => (
                    <div key={day} className="text-xs font-bold text-slate-400">
                        {day}
                    </div>
                ))}

                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNumber = i + 1
                    const hasHighlight = highlights.has(dayNumber)
                    const isSelected =
                        selectedDate.getFullYear() === year &&
                        selectedDate.getMonth() === month &&
                        selectedDate.getDate() === dayNumber
                    const isToday =
                        new Date().getFullYear() === year &&
                        new Date().getMonth() === month &&
                        new Date().getDate() === dayNumber

                    return (
                        <button
                            key={dayNumber}
                            onClick={() => setSelectedDate(new Date(year, month, dayNumber))}
                            className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all ${isSelected
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : hasHighlight || isToday
                                        ? 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            {dayNumber}
                            {hasHighlight && !isSelected && (
                                <div className="absolute -bottom-1 h-1 w-1 rounded-full bg-pink-500" />
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Timeline view for selected day */}
            <div className="mt-8 flex-1 border-t border-slate-100 pt-6">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-slate-900">
                        {MONTHS[selectedDate.getMonth()]} {selectedDate.getDate()}
                    </h4>
                    <span className="text-xs font-semibold text-slate-400">Timeline</span>
                </div>

                <div className="space-y-4">
                    {selectedProjects.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                            No updates on this day
                        </div>
                    ) : (
                        selectedProjects.map((p, idx) => {
                            const date = new Date(p.updatedAt)
                            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            return (
                                <div key={`${p.slug}-${idx}`} className="relative flex gap-4">
                                    <div className="flex w-12 shrink-0 flex-col items-end text-xs font-semibold text-slate-400 pt-1">
                                        {timeString}
                                    </div>
                                    <div className="relative flex-1 rounded-2xl bg-amber-50 p-3 shadow-sm border border-amber-100">
                                        <div className="absolute -left-[23px] top-4 h-2 w-2 rounded-full bg-amber-400 ring-4 ring-white" />
                                        {/* Vertical line connecting timeline items */}
                                        {idx < selectedProjects.length - 1 && (
                                            <div className="absolute -left-[19px] top-8 bottom-[-24px] w-px bg-slate-200" />
                                        )}
                                        <div className="flex items-center gap-2 text-amber-700 mb-1">
                                            <CircleDot size={12} />
                                            <span className="text-[10px] uppercase tracking-wider font-bold">Updated</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800 leading-tight">
                                            {p.title}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {p.slug}
                                        </p>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
