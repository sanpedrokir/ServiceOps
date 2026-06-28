'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Clock, Phone, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react'
import { formatDate, JOB_STATUS_LABELS, JOB_TYPE_LABELS } from '@/lib/utils'
import type { Job } from '@/lib/types'

const STATUS_COLORS: Record<string, string> = {
  assigned: 'bg-blue-100 text-blue-800 border-blue-200',
  en_route: 'bg-purple-100 text-purple-800 border-purple-200',
  arrived: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  in_progress: 'bg-amber-100 text-amber-800 border-amber-200',
  awaiting_parts: 'bg-rose-100 text-rose-800 border-rose-200',
  awaiting_quote: 'bg-orange-100 text-orange-800 border-orange-200',
  scheduled: 'bg-gray-100 text-gray-700 border-gray-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
}

export default function MyJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'today' | 'upcoming' | 'done'>('today')

  useEffect(() => {
    fetch('/api/jobs')
      .then(r => r.json())
      .then(d => { setJobs(d); setLoading(false) })
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const todayJobs = jobs.filter(j => j.appointmentDate === today && !['completed', 'invoiced', 'paid', 'cancelled'].includes(j.status))
  const upcomingJobs = jobs.filter(j => j.appointmentDate && j.appointmentDate > today && !['completed', 'invoiced', 'paid', 'cancelled'].includes(j.status))
  const doneJobs = jobs.filter(j => ['completed', 'invoiced', 'paid'].includes(j.status)).slice(0, 10)

  const activeJob = todayJobs.find(j => ['en_route', 'arrived', 'in_progress'].includes(j.status))

  const displayJobs = tab === 'today' ? todayJobs : tab === 'upcoming' ? upcomingJobs : doneJobs

  return (
    <div className="space-y-0">
      {activeJob && (
        <Link href={`/tech/jobs/${activeJob.id}`}
          className="block bg-blue-600 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-200 uppercase tracking-wide">Active Job</p>
              <p className="font-semibold text-sm mt-0.5 line-clamp-1">{activeJob.title}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs bg-blue-500 rounded-full px-2 py-0.5">{JOB_STATUS_LABELS[activeJob.status]}</span>
              <ChevronRight className="w-4 h-4 text-blue-300" />
            </div>
          </div>
        </Link>
      )}

      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-gray-900">My Jobs</h1>
        <div className="flex gap-1 mt-3 bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setTab('today')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'today' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
            Today ({todayJobs.length})
          </button>
          <button onClick={() => setTab('upcoming')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'upcoming' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
            Upcoming ({upcomingJobs.length})
          </button>
          <button onClick={() => setTab('done')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'done' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
            Done
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayJobs.length === 0 ? (
        <div className="text-center py-16 px-4">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {tab === 'today' ? 'No jobs scheduled for today' : tab === 'upcoming' ? 'No upcoming jobs' : 'No completed jobs yet'}
          </p>
        </div>
      ) : (
        <div className="px-4 space-y-3 pt-2">
          {displayJobs.map(job => (
            <Link href={`/tech/jobs/${job.id}`} key={job.id}
              className="block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow active:scale-98">
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {job.priority === 'urgent' && <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                      <span className="text-sm font-bold text-gray-900 leading-snug">{job.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs text-gray-500 font-mono">{job.jobNumber}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-500">{JOB_TYPE_LABELS[job.jobType]}</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold border flex-shrink-0 ${STATUS_COLORS[job.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    {JOB_STATUS_LABELS[job.status]}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5">
                  {job.appointmentDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span>{formatDate(job.appointmentDate)}{job.appointmentTime && ` at ${job.appointmentTime}`}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${job.tradeType === 'aircon' ? 'bg-blue-50 text-blue-700' : job.tradeType === 'electrical' ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-600'}`}>
                    {job.tradeType}
                  </span>
                  <div className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                    View Details <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
