'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Plus, Calendar, List, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CalendarView } from '@/components/CalendarView'
import { formatDate, JOB_STATUS_LABELS, JOB_STATUS_COLORS, JOB_TYPE_LABELS, PRIORITY_COLORS } from '@/lib/utils'
import type { Job } from '@/lib/types'

const STATUSES = ['', 'scheduled', 'assigned', 'en_route', 'arrived', 'in_progress', 'awaiting_quote', 'awaiting_parts', 'completed', 'invoiced', 'paid', 'cancelled']

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [view, setView] = useState<'list' | 'calendar'>('list')

  useEffect(() => {
    fetch('/api/jobs')
      .then(r => r.json())
      .then(d => { setJobs(d); setLoading(false) })
  }, [])

  const filtered = jobs.filter(j => {
    if (statusFilter && j.status !== statusFilter) return false
    if (search) {
      const s = search.toLowerCase()
      return j.title.toLowerCase().includes(s) || j.jobNumber.toLowerCase().includes(s)
    }
    return true
  })

  const stats = {
    total: jobs.length,
    active: jobs.filter(j => ['assigned', 'en_route', 'arrived', 'in_progress'].includes(j.status)).length,
    urgent: jobs.filter(j => j.priority === 'urgent' && !['completed', 'cancelled', 'paid'].includes(j.status)).length,
    unassigned: jobs.filter(j => j.status === 'scheduled' && j.assignedTechnicians.length === 0).length,
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{jobs.length} total jobs</p>
        </div>
        <Link href="/jobs/new">
          <Button><Plus className="w-4 h-4" /> New Job</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Jobs', value: stats.total, color: 'text-gray-900' },
          { label: 'Active Now', value: stats.active, color: 'text-amber-600' },
          { label: 'Urgent', value: stats.urgent, color: 'text-red-600' },
          { label: 'Unassigned', value: stats.unassigned, color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex flex-wrap gap-3 p-4 border-b border-gray-100">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Statuses</option>
            {STATUSES.filter(Boolean).map(s => (
              <option key={s} value={s}>{JOB_STATUS_LABELS[s]}</option>
            ))}
          </select>
          <div className="flex gap-1 border border-gray-200 rounded-lg p-1">
            <button onClick={() => setView('list')} className={`p-1.5 rounded ${view === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:text-gray-600'}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setView('calendar')} className={`p-1.5 rounded ${view === 'calendar' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:text-gray-600'}`}>
              <Calendar className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : view === 'calendar' ? (
          <CalendarView jobs={filtered} />
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No jobs found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(job => (
              <Link href={`/jobs/${job.id}`} key={job.id}
                className="flex items-start gap-4 px-4 sm:px-5 py-4 hover:bg-gray-50 transition-colors block">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{job.title}</span>
                    {job.priority === 'urgent' && (
                      <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                        <AlertTriangle className="w-3 h-3" /> URGENT
                      </span>
                    )}
                    {job.priority === 'high' && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">HIGH</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-gray-500 font-mono">{job.jobNumber}</span>
                    <span className="text-xs text-gray-400">{JOB_TYPE_LABELS[job.jobType]}</span>
                    {job.appointmentDate && (
                      <span className="text-xs text-gray-400">📅 {formatDate(job.appointmentDate)} {job.appointmentTime || ''}</span>
                    )}
                    <span className={`text-xs capitalize font-medium ${PRIORITY_COLORS[job.priority]}`}>
                      {job.tradeType}
                    </span>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${JOB_STATUS_COLORS[job.status]}`}>
                  {JOB_STATUS_LABELS[job.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Briefcase(props: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={props.className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
    </svg>
  )
}
