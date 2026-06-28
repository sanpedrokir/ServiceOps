'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Briefcase, DollarSign, AlertTriangle, Clock, FileText,
  TrendingUp, CheckCircle, Users, ArrowRight, AlertCircle
} from 'lucide-react'
import { StatCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, JOB_STATUS_LABELS, JOB_STATUS_COLORS } from '@/lib/utils'
import type { Job } from '@/lib/types'

interface DashboardData {
  todayJobsCount: number
  completedTodayCount: number
  activeJobsCount: number
  urgentJobsCount: number
  unassignedCount: number
  revenueThisMonth: number
  outstandingValue: number
  overdueValue: number
  overdueCount: number
  pendingQuotesCount: number
  pendingQuotesValue: number
  quoteConversionRate: number
  openLeadsCount: number
  techStats: { id: string; name: string; assigned: number; completed: number }[]
  recentJobs: Job[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-28 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-7 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data) return <div className="p-6 text-center text-gray-500">Failed to load dashboard</div>

  const today = new Date().toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{today}</p>
        </div>
        <Link href="/jobs/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          + New Job
        </Link>
      </div>

      {data.overdueCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <span className="text-red-800 font-medium text-sm">{data.overdueCount} overdue invoice{data.overdueCount > 1 ? 's' : ''}</span>
            <span className="text-red-600 text-sm"> — {formatCurrency(data.overdueValue)} outstanding</span>
          </div>
          <Link href="/invoices?status=overdue" className="ml-auto text-red-700 text-sm font-medium hover:underline flex-shrink-0">View all →</Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Jobs" value={data.todayJobsCount} subtitle={`${data.completedTodayCount} completed`}
          icon={<Briefcase className="w-5 h-5" />} color="blue" />
        <StatCard title="Active Jobs" value={data.activeJobsCount} subtitle="In progress"
          icon={<Clock className="w-5 h-5" />} color="amber" />
        <StatCard title="Revenue This Month" value={formatCurrency(data.revenueThisMonth)}
          icon={<DollarSign className="w-5 h-5" />} color="green" />
        <StatCard title="Outstanding" value={formatCurrency(data.outstandingValue)} subtitle="Awaiting payment"
          icon={<TrendingUp className="w-5 h-5" />} color="purple" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Urgent Jobs" value={data.urgentJobsCount} subtitle="Needs attention"
          icon={<AlertTriangle className="w-5 h-5" />} color={data.urgentJobsCount > 0 ? 'red' : 'teal'} />
        <StatCard title="Pending Quotes" value={data.pendingQuotesCount} subtitle={formatCurrency(data.pendingQuotesValue)}
          icon={<FileText className="w-5 h-5" />} color="blue" />
        <StatCard title="Quote Win Rate" value={`${data.quoteConversionRate}%`} subtitle="Approval rate"
          icon={<CheckCircle className="w-5 h-5" />} color="green" />
        <StatCard title="Open Leads" value={data.openLeadsCount} subtitle="Needs follow-up"
          icon={<Users className="w-5 h-5" />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Recent Jobs</h2>
              <Link href="/jobs" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {data.recentJobs.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">No jobs yet</p>
              ) : data.recentJobs.map(job => (
                <Link href={`/jobs/${job.id}`} key={job.id}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900 truncate">{job.title}</span>
                      {job.priority === 'urgent' && (
                        <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">URGENT</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">{job.jobNumber}</span>
                      {job.appointmentDate && (
                        <span className="text-xs text-gray-400">• {formatDate(job.appointmentDate)}</span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${JOB_STATUS_COLORS[job.status]}`}>
                    {JOB_STATUS_LABELS[job.status]}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Technician Productivity</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {data.techStats.map(t => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                    {t.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${t.assigned > 0 ? (t.completed / t.assigned) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{t.completed}/{t.assigned}</p>
                    <p className="text-xs text-gray-500">done</p>
                  </div>
                </div>
              ))}
              {data.techStats.length === 0 && (
                <p className="text-center text-gray-400 py-4 text-sm">No technicians found</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: '/leads', label: 'New Lead', emoji: '📞' },
                { href: '/jobs/new', label: 'New Job', emoji: '🔧' },
                { href: '/quotes', label: 'New Quote', emoji: '📋' },
                { href: '/customers', label: 'Customers', emoji: '👥' },
              ].map(a => (
                <Link key={a.href} href={a.href}
                  className="flex flex-col items-center gap-1 p-3 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 rounded-lg text-center transition-colors">
                  <span className="text-2xl">{a.emoji}</span>
                  <span className="text-xs font-medium text-gray-700">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
