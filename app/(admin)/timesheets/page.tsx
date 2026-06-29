'use client'
import { useState, useEffect, useCallback } from 'react'
import { Clock, Download, ChevronDown, ChevronRight, Users, Briefcase } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface TimesheetEntry {
  jobId: string; jobNumber: string; title: string; date: string
  arrivedAt: string | null; completedAt: string | null
  hours: number; tradeType: string; jobType: string; customerName: string; status: string
}

interface TechSheet {
  technician: { id: string; name: string; email: string; phone?: string }
  entries: TimesheetEntry[]
  totalHours: number
  jobCount: number
}

interface TimesheetData {
  from: string; to: string; techSheets: TechSheet[]; grandTotal: number; totalJobs: number
}

const PRESETS = [
  { label: 'This Week',  getRange: () => ({ from: weekStart(), to: weekEnd() }) },
  { label: 'Last Week',  getRange: () => ({ from: weekStart(-7), to: weekEnd(-7) }) },
  { label: 'This Month', getRange: () => ({ from: monthStart(), to: monthEnd() }) },
  { label: 'Last Month', getRange: () => ({ from: monthStart(-1), to: monthEnd(-1) }) },
]

export default function TimesheetsPage() {
  const [data, setData] = useState<TimesheetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(weekStart())
  const [to, setTo] = useState(weekEnd())
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [preset, setPreset] = useState('This Week')

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/timesheets?from=${from}&to=${to}`)
      .then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [from, to])

  useEffect(() => { load() }, [load])

  function applyPreset(p: typeof PRESETS[0]) {
    const { from: f, to: t } = p.getRange()
    setFrom(f); setTo(t); setPreset(p.label)
  }

  function toggleExpand(id: string) {
    setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  function exportCSV() {
    if (!data) return
    const rows = [['Technician', 'Job #', 'Job Title', 'Customer', 'Date', 'Arrived', 'Completed', 'Hours', 'Trade']]
    data.techSheets.forEach(ts => {
      ts.entries.forEach(e => {
        rows.push([
          ts.technician.name, e.jobNumber, e.title, e.customerName, e.date,
          e.arrivedAt ? new Date(e.arrivedAt).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' }) : '—',
          e.completedAt ? new Date(e.completedAt).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' }) : '—',
          e.hours.toString(), e.tradeType,
        ])
      })
      rows.push([ts.technician.name, '', 'SUBTOTAL', '', '', '', '', ts.totalHours.toString(), ''])
    })
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `timesheets-${from}-to-${to}.csv`; a.click()
  }

  function fmtTime(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timesheets</h1>
          <p className="text-sm text-gray-500 mt-0.5">Technician hours derived from job timestamps</p>
        </div>
        <button onClick={exportCSV} disabled={!data || data.techSheets.length === 0}
          className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-40">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Period selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-4 items-end">
        <div className="flex gap-1 flex-wrap">
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${preset === p.label ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium">From</label>
            <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPreset('') }}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium">To</label>
            <input type="date" value={to} onChange={e => { setTo(e.target.value); setPreset('') }}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* Summary */}
      {data && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Total Hours</p>
            <p className="text-2xl font-bold text-gray-900">{data.grandTotal}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Jobs Completed</p>
            <p className="text-2xl font-bold text-gray-900">{data.totalJobs}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Technicians Active</p>
            <p className="text-2xl font-bold text-gray-900">{data.techSheets.length}</p>
          </div>
        </div>
      )}

      {/* Tech sheets */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data || data.techSheets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No completed jobs in this period</p>
          <p className="text-sm text-gray-400 mt-1">{formatDate(from)} — {formatDate(to)}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.techSheets.map(ts => {
            const isOpen = expanded.has(ts.technician.id)
            return (
              <div key={ts.technician.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button onClick={() => toggleExpand(ts.technician.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                    {ts.technician.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{ts.technician.name}</p>
                    <p className="text-xs text-gray-500">{ts.jobCount} jobs · {ts.technician.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-gray-900">{ts.totalHours} <span className="text-sm font-normal text-gray-500">hrs</span></p>
                  </div>
                  {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                            <th className="text-left px-5 py-2.5 font-semibold">Job</th>
                            <th className="text-left px-3 py-2.5 font-semibold">Customer</th>
                            <th className="text-left px-3 py-2.5 font-semibold">Date</th>
                            <th className="text-left px-3 py-2.5 font-semibold">Arrived</th>
                            <th className="text-left px-3 py-2.5 font-semibold">Done</th>
                            <th className="text-right px-5 py-2.5 font-semibold">Hours</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {ts.entries.map(e => (
                            <tr key={e.jobId} className="hover:bg-gray-50/50">
                              <td className="px-5 py-3">
                                <p className="font-medium text-gray-900 truncate max-w-40">{e.title}</p>
                                <p className="text-xs text-gray-400 font-mono">{e.jobNumber}</p>
                              </td>
                              <td className="px-3 py-3 text-gray-600 truncate max-w-32">{e.customerName}</td>
                              <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{formatDate(e.date)}</td>
                              <td className="px-3 py-3 text-gray-600 font-mono text-xs">{fmtTime(e.arrivedAt)}</td>
                              <td className="px-3 py-3 text-gray-600 font-mono text-xs">{fmtTime(e.completedAt)}</td>
                              <td className="px-5 py-3 text-right font-semibold text-gray-900">
                                {e.hours > 0 ? `${e.hours}h` : <span className="text-gray-300">—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-blue-50">
                            <td colSpan={5} className="px-5 py-3 text-sm font-bold text-gray-700">Total</td>
                            <td className="px-5 py-3 text-right font-bold text-blue-900">{ts.totalHours}h</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function weekStart(offset = 0) {
  const d = new Date(); d.setDate(d.getDate() + offset)
  const day = d.getDay(); d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  return d.toISOString().split('T')[0]
}
function weekEnd(offset = 0) {
  const d = new Date(); d.setDate(d.getDate() + offset)
  const day = d.getDay(); d.setDate(d.getDate() - day + (day === 0 ? 0 : 7))
  return d.toISOString().split('T')[0]
}
function monthStart(monthOffset = 0) {
  const d = new Date(); d.setMonth(d.getMonth() + monthOffset, 1)
  return d.toISOString().split('T')[0]
}
function monthEnd(monthOffset = 0) {
  const d = new Date(); d.setMonth(d.getMonth() + monthOffset + 1, 0)
  return d.toISOString().split('T')[0]
}
