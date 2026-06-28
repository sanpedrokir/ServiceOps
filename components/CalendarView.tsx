'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { JOB_STATUS_COLORS, JOB_STATUS_LABELS } from '@/lib/utils'
import type { Job } from '@/lib/types'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface CalendarViewProps {
  jobs: Job[]
}

export function CalendarView({ jobs }: CalendarViewProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  // Monday=0 offset
  const startOffset = (firstDay.getDay() + 6) % 7

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`

  function jobsOnDay(day: number) {
    const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`
    return jobs.filter(j => j.appointmentDate === dateStr)
  }

  const monthName = new Date(year, month).toLocaleString('en-SG', { month: 'long', year: 'numeric' })
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return (
    <div className="p-4 sm:px-5">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-base font-bold text-gray-900">{monthName}</h2>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="bg-gray-50 min-h-20 p-1" />
          const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`
          const dayJobs = jobsOnDay(day)
          const isToday = dateStr === todayStr
          return (
            <div key={i} className={`bg-white min-h-20 p-1.5 ${isToday ? 'bg-blue-50' : ''}`}>
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold mb-1 ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                {day}
              </span>
              <div className="space-y-0.5">
                {dayJobs.slice(0, 3).map(job => (
                  <Link key={job.id} href={`/jobs/${job.id}`}
                    className={`block truncate text-xs px-1.5 py-0.5 rounded font-medium leading-tight ${JOB_STATUS_COLORS[job.status]}`}
                    title={`${job.appointmentTime ? job.appointmentTime + ' ' : ''}${job.title}`}>
                    {job.appointmentTime && <span className="opacity-70 mr-1">{job.appointmentTime}</span>}
                    {job.title}
                  </Link>
                ))}
                {dayJobs.length > 3 && (
                  <p className="text-xs text-gray-400 px-1">+{dayJobs.length - 3} more</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {['scheduled', 'assigned', 'in_progress', 'completed'].map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded ${JOB_STATUS_COLORS[s]}`} />
            <span className="text-xs text-gray-500">{JOB_STATUS_LABELS[s]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
