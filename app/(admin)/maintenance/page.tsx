'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cpu, AlertTriangle, Clock, CheckCircle, CalendarDays, Wrench, ChevronRight, Filter } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Asset, Customer, Site, Job } from '@/lib/types'

type AssetStatus = 'overdue' | 'due_soon' | 'upcoming' | 'ok' | 'unscheduled'

interface EnrichedAsset extends Asset {
  customer?: Customer
  site?: Site
  serviceJobs: Job[]
  daysUntil: number | null
  status: AssetStatus
}

interface MaintenanceData {
  assets: EnrichedAsset[]
  unscheduled: EnrichedAsset[]
  counts: { overdue: number; dueSoon: number; upcoming: number; ok: number; total: number }
  today: string
}

const STATUS_CONFIG: Record<AssetStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  overdue:     { label: 'Overdue',      color: 'text-red-700',    bg: 'bg-red-100 border-red-200',    icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  due_soon:    { label: 'Due Soon',     color: 'text-amber-700',  bg: 'bg-amber-100 border-amber-200', icon: <Clock className="w-3.5 h-3.5" /> },
  upcoming:    { label: 'Upcoming',     color: 'text-blue-700',   bg: 'bg-blue-100 border-blue-200',   icon: <CalendarDays className="w-3.5 h-3.5" /> },
  ok:          { label: 'OK',           color: 'text-green-700',  bg: 'bg-green-100 border-green-200', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  unscheduled: { label: 'Unscheduled',  color: 'text-gray-600',   bg: 'bg-gray-100 border-gray-200',   icon: <Cpu className="w-3.5 h-3.5" /> },
}

export default function MaintenancePage() {
  const [data, setData] = useState<MaintenanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<AssetStatus | 'all'>('all')
  const [tradeFilter, setTradeFilter] = useState('')
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/maintenance').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data) return <div className="p-6 text-center text-gray-500">Failed to load</div>

  const allAssets = [...data.assets, ...data.unscheduled]
  const filtered = allAssets.filter(a => {
    if (filter !== 'all' && a.status !== filter) return false
    if (tradeFilter && a.tradeType !== tradeFilter) return false
    return true
  })

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Schedule</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data.counts.total} assets tracked · as of {formatDate(data.today)}</p>
        </div>
        <Link href="/jobs/new" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          + Schedule Service
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'overdue',  label: 'Overdue',      value: data.counts.overdue,  color: 'border-l-4 border-l-red-500',    text: 'text-red-600' },
          { key: 'due_soon', label: 'Due ≤ 14 days', value: data.counts.dueSoon, color: 'border-l-4 border-l-amber-500',  text: 'text-amber-600' },
          { key: 'upcoming', label: 'Due in 60 days',value: data.counts.upcoming, color: 'border-l-4 border-l-blue-500',  text: 'text-blue-600' },
          { key: 'ok',       label: 'On Schedule',  value: data.counts.ok,        color: 'border-l-4 border-l-green-500', text: 'text-green-600' },
        ].map(c => (
          <button key={c.key} onClick={() => setFilter(filter === c.key as AssetStatus ? 'all' : c.key as AssetStatus)}
            className={`bg-white rounded-xl border border-gray-200 p-4 text-left transition-all hover:shadow-sm ${c.color} ${filter === c.key ? 'ring-2 ring-blue-400' : ''}`}>
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${c.text}`}>{c.value}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <Filter className="w-4 h-4 text-gray-400" />
        <select value={tradeFilter} onChange={e => setTradeFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All trades</option>
          {['aircon', 'electrical', 'plumbing', 'maintenance'].map(t => (
            <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        {filter !== 'all' && (
          <button onClick={() => setFilter('all')} className="text-sm text-blue-600 hover:underline">Clear filter</button>
        )}
        <span className="text-sm text-gray-400 ml-auto">{filtered.length} assets</span>
      </div>

      {/* Asset list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No assets match this filter</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(asset => {
              const cfg = STATUS_CONFIG[asset.status]
              const isExpanded = expandedAsset === asset.id
              return (
                <div key={asset.id}>
                  <div
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedAsset(isExpanded ? null : asset.id)}>
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Cpu className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">
                          {asset.brand ? `${asset.brand} ${asset.model || ''}`.trim() : asset.category}
                        </p>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                        {asset.serialNumber && <span className="text-xs text-gray-400 font-mono">{asset.serialNumber}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 flex-wrap">
                        <span>{asset.customer?.name || '—'}</span>
                        {asset.site && <span>· {asset.site.address}{asset.site.unitNumber ? ` ${asset.site.unitNumber}` : ''}</span>}
                        <span className="capitalize">· {asset.tradeType}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 hidden sm:block">
                      {asset.nextServiceDate ? (
                        <>
                          <p className="text-xs text-gray-500">Next service</p>
                          <p className={`text-sm font-semibold ${asset.daysUntil !== null && asset.daysUntil < 0 ? 'text-red-600' : asset.daysUntil !== null && asset.daysUntil <= 14 ? 'text-amber-600' : 'text-gray-900'}`}>
                            {formatDate(asset.nextServiceDate)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {asset.daysUntil === null ? '' : asset.daysUntil < 0 ? `${Math.abs(asset.daysUntil)}d overdue` : asset.daysUntil === 0 ? 'Due today' : `in ${asset.daysUntil}d`}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-400">No schedule set</p>
                      )}
                    </div>
                    <ChevronRight className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-4 bg-gray-50/80 border-t border-gray-100 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3">
                        <div>
                          <p className="text-xs text-gray-500">Last Service</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(asset.lastServiceDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Next Service</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(asset.nextServiceDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Install Date</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(asset.installationDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Warranty Expiry</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(asset.warrantyExpiry)}</p>
                        </div>
                      </div>
                      {asset.location && <p className="text-xs text-gray-500">Location: <span className="text-gray-700 font-medium">{asset.location}</span></p>}

                      {/* Service history */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Service History ({asset.serviceJobs.length} jobs)</p>
                        {asset.serviceJobs.length === 0 ? (
                          <p className="text-sm text-gray-400">No service history recorded</p>
                        ) : (
                          <div className="space-y-1.5">
                            {asset.serviceJobs.slice(0, 5).map(j => (
                              <Link key={j.id} href={`/jobs/${j.id}`}
                                className="flex items-center gap-3 text-sm bg-white rounded-lg border border-gray-200 px-3 py-2 hover:bg-blue-50 transition-colors">
                                <Wrench className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className="font-mono text-xs text-gray-500">{j.jobNumber}</span>
                                <span className="text-gray-700 flex-1 truncate">{j.title}</span>
                                <span className="text-xs text-gray-400">{formatDate(j.appointmentDate)}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>

                      <Link href={`/jobs/new?assetId=${asset.id}&customerId=${asset.customerId}`}
                        className="inline-flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        + Schedule Service Job
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
