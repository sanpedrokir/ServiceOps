'use client'
import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Phone, Clock, User, CheckSquare, Wrench, AlertTriangle, FileText, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { formatDate, formatDateTime, JOB_STATUS_LABELS, JOB_STATUS_COLORS, JOB_TYPE_LABELS } from '@/lib/utils'
import type { Job, Customer, Site, Asset, User as UserType } from '@/lib/types'

interface JobDetail extends Job {
  customer?: Customer
  site?: Site
  assets?: Asset[]
  technicians?: UserType[]
}

const NEXT_STATUSES: Record<string, string[]> = {
  scheduled: ['assigned', 'cancelled'],
  assigned: ['en_route', 'cancelled'],
  en_route: ['arrived'],
  arrived: ['in_progress'],
  in_progress: ['completed', 'awaiting_quote', 'awaiting_parts'],
  awaiting_quote: ['in_progress', 'cancelled'],
  awaiting_parts: ['in_progress', 'cancelled'],
  completed: ['invoiced'],
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [job, setJob] = useState<JobDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [noteModal, setNoteModal] = useState(false)
  const [note, setNote] = useState('')
  const [activeTab, setActiveTab] = useState<'details' | 'checklist' | 'parts' | 'notes'>('details')
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setJob(d); setLoading(false) })
  }, [id])

  async function updateStatus(status: string) {
    if (!job) return
    setUpdating(true)
    const res = await fetch(`/api/jobs/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const updated = await res.json()
    setJob(prev => prev ? { ...prev, ...updated } : prev)
    setUpdating(false)
  }

  async function saveNote() {
    if (!job || !note.trim()) return
    const res = await fetch(`/api/jobs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ internalNotes: (job.internalNotes || '') + '\n' + new Date().toLocaleString('en-SG') + ': ' + note }),
    })
    const updated = await res.json()
    setJob(prev => prev ? { ...prev, internalNotes: updated.internalNotes } : prev)
    setNote('')
    setNoteModal(false)
  }

  if (loading) return (
    <div className="p-6 flex items-center justify-center min-h-64">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!job) return (
    <div className="p-6 text-center">
      <p className="text-gray-500">Job not found</p>
      <Link href="/jobs" className="text-blue-600 text-sm mt-2 inline-block">← Back to Jobs</Link>
    </div>
  )

  const nextStatuses = NEXT_STATUSES[job.status] || []
  const statusColor = JOB_STATUS_COLORS[job.status]

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/jobs" className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{job.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm text-gray-500 font-mono">{job.jobNumber}</span>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500">{JOB_TYPE_LABELS[job.jobType]}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusColor}`}>
            {JOB_STATUS_LABELS[job.status]}
          </span>
          <Link href={`/jobs/${id}/report`}
            className="flex items-center gap-1.5 text-sm text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full font-medium transition-colors">
            <FileText className="w-3.5 h-3.5" /> Report
          </Link>
        </div>
      </div>

      {nextStatuses.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Update Job Status</p>
          <div className="flex flex-wrap gap-2">
            {nextStatuses.map(s => (
              <Button key={s} onClick={() => updateStatus(s)} loading={updating} size="sm"
                variant={s === 'cancelled' ? 'danger' : s === 'completed' ? 'primary' : 'secondary'}>
                → {JOB_STATUS_LABELS[s]}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {(['details', 'checklist', 'parts', 'notes'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-colors ${activeTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'details' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><User className="w-4 h-4 text-blue-600" /> Customer & Site</h3>
            {job.customer && (
              <div>
                <p className="text-sm font-medium text-gray-900">{job.customer.name}</p>
                {job.customer.mobile && (
                  <a href={`tel:${job.customer.mobile}`} className="flex items-center gap-1.5 text-sm text-blue-600 mt-1 hover:underline">
                    <Phone className="w-3.5 h-3.5" /> {job.customer.mobile}
                  </a>
                )}
              </div>
            )}
            {job.site && (
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700">{job.site.address}{job.site.unitNumber ? `, ${job.site.unitNumber}` : ''}</p>
                    {job.site.accessInstructions && (
                      <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-1.5">{job.site.accessInstructions}</p>
                    )}
                    {job.site.contactPerson && (
                      <p className="text-xs text-gray-500 mt-1">Contact: {job.site.contactPerson} {job.site.contactPhone && `(${job.site.contactPhone})`}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-600" /> Schedule & Assignment</h3>
            {job.appointmentDate && (
              <div>
                <p className="text-xs text-gray-500">Appointment</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(job.appointmentDate)} {job.appointmentTime && `at ${job.appointmentTime}`}</p>
              </div>
            )}
            {job.estimatedDuration && (
              <div>
                <p className="text-xs text-gray-500">Est. Duration</p>
                <p className="text-sm font-medium text-gray-900">{job.estimatedDuration} min</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">Technicians</p>
              {job.technicians && job.technicians.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {job.technicians.map(t => (
                    <span key={t.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">{t.name}</span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-amber-600 mt-1 font-medium">⚠ Unassigned</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500">Priority</p>
              <p className={`text-sm font-semibold mt-0.5 capitalize ${job.priority === 'urgent' ? 'text-red-600' : job.priority === 'high' ? 'text-amber-600' : 'text-gray-700'}`}>
                {job.priority === 'urgent' && '🔴 '}{job.priority === 'high' && '🟡 '}{job.priority}
              </p>
            </div>
          </div>

          {job.description && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:col-span-2">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.description}</p>
            </div>
          )}

          {(job.faultDiagnosis || job.workPerformed || job.recommendations) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:col-span-2 space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Wrench className="w-4 h-4 text-blue-600" /> Work Summary</h3>
              {job.faultDiagnosis && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fault Diagnosis</p>
                  <p className="text-sm text-gray-700 mt-1">{job.faultDiagnosis}</p>
                </div>
              )}
              {job.workPerformed && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Work Performed</p>
                  <p className="text-sm text-gray-700 mt-1">{job.workPerformed}</p>
                </div>
              )}
              {job.recommendations && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recommendations</p>
                  <p className="text-sm text-blue-700 bg-blue-50 rounded p-2 mt-1">{job.recommendations}</p>
                </div>
              )}
            </div>
          )}

          {job.timestamps && Object.keys(job.timestamps).some(k => job.timestamps[k as keyof typeof job.timestamps]) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:col-span-2">
              <h3 className="font-semibold text-gray-900 mb-3">Job Timeline</h3>
              <div className="space-y-2">
                {[
                  { key: 'assigned', label: 'Assigned' },
                  { key: 'enRoute', label: 'En Route' },
                  { key: 'arrived', label: 'Arrived' },
                  { key: 'started', label: 'Started' },
                  { key: 'completed', label: 'Completed' },
                ].filter(t => job.timestamps[t.key as keyof typeof job.timestamps]).map(t => (
                  <div key={t.key} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                    <span className="text-xs text-gray-500 w-20">{t.label}</span>
                    <span className="text-sm text-gray-700">{formatDateTime(job.timestamps[t.key as keyof typeof job.timestamps])}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'checklist' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><CheckSquare className="w-4 h-4 text-blue-600" /> Service Checklist</h3>
          {Object.keys(job.checklistData || {}).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No checklist data recorded yet</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {Object.entries(job.checklistData).map(([key, value]) => (
                <div key={key} className="flex justify-between py-2.5">
                  <span className="text-sm text-gray-700 capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className={`text-sm font-medium ${value.toLowerCase().includes('good') || value.toLowerCase().includes('clean') || value.toLowerCase().includes('normal') || value.toLowerCase().includes('clear') || value.toLowerCase().includes('none') ? 'text-green-600' : 'text-amber-600'}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'parts' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Parts & Materials Used</h3>
          {(!job.partsUsed || job.partsUsed.length === 0) ? (
            <p className="text-sm text-gray-400 text-center py-6">No parts recorded</p>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {job.partsUsed.map(p => (
                  <div key={p.id} className="flex justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">Qty: {p.quantity} × ${p.unitCost}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">${p.total.toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-3 mt-2 flex justify-between">
                <span className="text-sm font-semibold text-gray-700">Total Parts</span>
                <span className="text-sm font-bold text-gray-900">${job.partsUsed.reduce((s, p) => s + p.total, 0).toFixed(2)}</span>
              </div>
            </>
          )}
          {job.labourHours && (
            <div className="mt-4 bg-blue-50 rounded-lg p-3 flex justify-between">
              <span className="text-sm font-medium text-blue-800">Labour Hours</span>
              <span className="text-sm font-bold text-blue-900">{job.labourHours} hrs</span>
            </div>
          )}
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Internal Notes</h3>
              <Button size="sm" variant="secondary" onClick={() => setNoteModal(true)}>+ Add Note</Button>
            </div>
            {job.internalNotes ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{job.internalNotes}</p>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No internal notes</p>
            )}
          </div>
          {job.hasSafetyIssue && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-semibold text-sm">Safety Issue Flagged</p>
                <p className="text-red-700 text-sm mt-0.5">This job has been flagged for a safety concern. Please review.</p>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={noteModal} onClose={() => setNoteModal(false)} title="Add Note" size="sm">
        <div className="space-y-4">
          <Textarea label="Note" value={note} onChange={e => setNote(e.target.value)} placeholder="Enter your note..." rows={4} />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setNoteModal(false)}>Cancel</Button>
            <Button onClick={saveNote}>Save Note</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
