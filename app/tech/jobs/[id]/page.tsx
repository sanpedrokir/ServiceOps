'use client'
import { useState, useEffect, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, MapPin, Phone, Navigation, Clock, CheckSquare, Package, AlertTriangle, Check, Camera, X, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { SignatureCanvas } from '@/components/ui/SignatureCanvas'
import { formatDate, JOB_STATUS_LABELS } from '@/lib/utils'
import type { Job, Customer, Site, Asset, Photo } from '@/lib/types'

interface JobDetail extends Job {
  customer?: Customer
  site?: Site
  assets?: Asset[]
}

const ACTION_FLOW: Record<string, { label: string; next: string; color: string }> = {
  assigned: { label: "I'm On My Way", next: 'en_route', color: 'bg-blue-600' },
  en_route: { label: "I've Arrived", next: 'arrived', color: 'bg-indigo-600' },
  arrived: { label: 'Start Job', next: 'in_progress', color: 'bg-amber-600' },
  in_progress: { label: 'Mark Complete', next: 'completed', color: 'bg-green-600' },
}

const AIRCON_CHECKLIST = [
  { key: 'filter', label: 'Filter Condition' },
  { key: 'coil', label: 'Coil Condition' },
  { key: 'drainage', label: 'Drainage Condition' },
  { key: 'leakage', label: 'Water Leakage' },
  { key: 'compressor', label: 'Compressor Condition' },
  { key: 'gas', label: 'Refrigerant Level' },
  { key: 'noise', label: 'Noise/Vibration' },
  { key: 'pipe_insulation', label: 'Pipe Insulation' },
]

const CONDITION_OPTIONS = ['Good', 'Fair', 'Poor', 'N/A', 'Clean', 'Dirty', 'Normal', 'Low', 'None observed', 'Requires attention']

export default function TechJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [job, setJob] = useState<JobDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [tab, setTab] = useState<'info' | 'checklist' | 'parts' | 'complete'>('info')
  const [checklistData, setChecklistData] = useState<Record<string, string>>({})
  const [partsModal, setPartsModal] = useState(false)
  const [partForm, setPartForm] = useState({ name: '', quantity: '1', unitCost: '0' })
  const [workNotes, setWorkNotes] = useState('')
  const [faultNotes, setFaultNotes] = useState('')
  const [completeModal, setCompleteModal] = useState(false)
  const [hasSafetyIssue, setHasSafetyIssue] = useState(false)
  const [requiresFollowUp, setRequiresFollowUp] = useState(false)
  const [customerSignature, setCustomerSignature] = useState<string | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [selectedPhotoTag, setSelectedPhotoTag] = useState<Photo['tag']>('after')
  const photoInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setJob(d)
          setChecklistData(d.checklistData || {})
          setWorkNotes(d.workPerformed || '')
          setFaultNotes(d.faultDiagnosis || '')
          setHasSafetyIssue(d.hasSafetyIssue || false)
          setRequiresFollowUp(d.requiresFollowUp || false)
          setCustomerSignature(d.customerSignature || null)
          setPhotos(d.photos || [])
        }
        setLoading(false)
      })
  }, [id])

  async function doStatusAction() {
    if (!job) return
    const action = ACTION_FLOW[job.status]
    if (!action) return
    setUpdating(true)
    const res = await fetch(`/api/jobs/${id}/status`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: action.next }),
    })
    const updated = await res.json()
    setJob(prev => prev ? { ...prev, ...updated } : prev)
    setUpdating(false)
  }

  async function saveChecklist() {
    setUpdating(true)
    const res = await fetch(`/api/jobs/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklistData, faultDiagnosis: faultNotes }),
    })
    const updated = await res.json()
    setJob(prev => prev ? { ...prev, ...updated } : prev)
    setUpdating(false)
  }

  async function addPart() {
    if (!job || !partForm.name) return
    const newPart = { id: Math.random().toString(36).slice(2), name: partForm.name, quantity: parseInt(partForm.quantity), unitCost: parseFloat(partForm.unitCost), total: parseInt(partForm.quantity) * parseFloat(partForm.unitCost) }
    const partsUsed = [...(job.partsUsed || []), newPart]
    const res = await fetch(`/api/jobs/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ partsUsed }) })
    const updated = await res.json()
    setJob(prev => prev ? { ...prev, partsUsed: updated.partsUsed } : prev)
    setPartsModal(false)
    setPartForm({ name: '', quantity: '1', unitCost: '0' })
  }

  async function uploadPhoto(file: File) {
    setUploadingPhoto(true)
    const form = new FormData()
    form.append('photo', file)
    form.append('tag', selectedPhotoTag)
    const res = await fetch(`/api/jobs/${id}/photos`, { method: 'POST', body: form })
    if (res.ok) {
      const photo = await res.json()
      setPhotos(prev => [...prev, photo])
    }
    setUploadingPhoto(false)
  }

  async function removePhoto(photoId: string) {
    await fetch(`/api/jobs/${id}/photos`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photoId }) })
    setPhotos(prev => prev.filter(p => p.id !== photoId))
  }

  async function saveSignature(sig: string | null) {
    setCustomerSignature(sig)
    await fetch(`/api/jobs/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerSignature: sig }) })
  }

  async function completeJob() {
    setUpdating(true)
    const res = await fetch(`/api/jobs/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workPerformed: workNotes, checklistData, hasSafetyIssue, requiresFollowUp, customerSignature, status: 'completed', timestamps: { ...job?.timestamps, completed: new Date().toISOString() } }),
    })
    const updated = await res.json()
    setJob(prev => prev ? { ...prev, ...updated } : prev)
    setCompleteModal(false)
    setUpdating(false)
    router.push('/tech/my-jobs')
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!job) return <div className="p-4 text-center"><p className="text-gray-500">Job not found</p><Link href="/tech/my-jobs" className="text-blue-600 text-sm">← Back</Link></div>

  const action = ACTION_FLOW[job.status]
  const isCompleted = ['completed', 'invoiced', 'paid'].includes(job.status)

  return (
    <div>
      <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center gap-3 sticky top-14 z-30">
        <Link href="/tech/my-jobs" className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{job.title}</p>
          <p className="text-xs text-gray-500">{job.jobNumber}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${isCompleted ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
          {JOB_STATUS_LABELS[job.status]}
        </span>
      </div>

      {action && !isCompleted && (
        <div className="px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={doStatusAction} disabled={updating}
            className={`w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all ${action.color} disabled:opacity-60`}>
            {updating ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Updating...</>
            ) : (
              <>{action.label} →</>
            )}
          </button>
        </div>
      )}

      <div className="flex gap-0 border-b border-gray-100 bg-white sticky top-28 z-20 overflow-x-auto">
        {(['info', 'checklist', 'parts', 'complete'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 min-w-16 py-3 text-xs font-semibold capitalize border-b-2 transition-colors whitespace-nowrap ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
            {t === 'complete' ? '✓ Sign-off' : t}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {tab === 'info' && (
          <>
            {job.customer && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                <h3 className="text-sm font-bold text-gray-900">Customer</h3>
                <p className="text-sm font-medium text-gray-800">{job.customer.name}</p>
                {job.customer.mobile && (
                  <a href={`tel:${job.customer.mobile}`} className="flex items-center gap-2 text-sm text-blue-600">
                    <Phone className="w-4 h-4" /> {job.customer.mobile}
                  </a>
                )}
              </div>
            )}

            {job.site && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                <h3 className="text-sm font-bold text-gray-900">Site Address</h3>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{job.site.address}{job.site.unitNumber ? `, ${job.site.unitNumber}` : ''}</p>
                </div>
                {job.site.accessInstructions && (
                  <div className="bg-amber-50 rounded-xl p-3 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-800">{job.site.accessInstructions}</p>
                  </div>
                )}
                {job.site.contactPerson && (
                  <div>
                    <p className="text-xs text-gray-500">On-site Contact</p>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">{job.site.contactPerson}</p>
                    {job.site.contactPhone && (
                      <a href={`tel:${job.site.contactPhone}`} className="text-sm text-blue-600">{job.site.contactPhone}</a>
                    )}
                  </div>
                )}
                <a href={`https://maps.google.com/?q=${encodeURIComponent(job.site.address)}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold">
                  <Navigation className="w-4 h-4" /> Open in Maps
                </a>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
              <h3 className="text-sm font-bold text-gray-900">Job Details</h3>
              {job.appointmentDate && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {formatDate(job.appointmentDate)} {job.appointmentTime && `at ${job.appointmentTime}`}
                </div>
              )}
              {job.description && <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{job.description}</p>}
              {job.internalNotes && (
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Admin Notes</p>
                  <p className="text-sm text-blue-800">{job.internalNotes}</p>
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'checklist' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><CheckSquare className="w-4 h-4 text-blue-600" /> Service Checklist</h3>
              {AIRCON_CHECKLIST.map(item => (
                <div key={item.key}>
                  <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {CONDITION_OPTIONS.slice(0, 5).map(opt => (
                      <button key={opt} onClick={() => setChecklistData(d => ({ ...d, [item.key]: opt }))}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${checklistData[item.key] === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <Textarea label="Fault Diagnosis Notes" value={faultNotes} onChange={e => setFaultNotes(e.target.value)} placeholder="Describe any faults found..." rows={3} />
            </div>
            <Button onClick={saveChecklist} loading={updating} className="w-full">Save Checklist</Button>
          </div>
        )}

        {tab === 'parts' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Package className="w-4 h-4 text-blue-600" /> Parts Used</h3>
                <Button size="sm" onClick={() => setPartsModal(true)}>+ Add</Button>
              </div>
              {(!job.partsUsed || job.partsUsed.length === 0) ? (
                <p className="text-sm text-gray-400 text-center py-4">No parts recorded</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {job.partsUsed.map(p => (
                    <div key={p.id} className="flex justify-between py-2.5">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">Qty: {p.quantity} × ${p.unitCost}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900">${p.total.toFixed(2)}</p>
                    </div>
                  ))}
                  <div className="flex justify-between pt-3">
                    <span className="text-sm font-bold text-gray-700">Total</span>
                    <span className="text-sm font-bold text-gray-900">${(job.partsUsed || []).reduce((s, p) => s + p.total, 0).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'complete' && (
          <div className="space-y-3">
            {/* Photos */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" /> Job Photos
              </h3>
              <div className="flex gap-2">
                {(['before', 'after', 'defect'] as Photo['tag'][]).map(t => (
                  <button key={t} onClick={() => setSelectedPhotoTag(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors capitalize ${selectedPhotoTag === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {t}
                  </button>
                ))}
              </div>
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map(p => (
                    <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                      <Image src={p.url} alt={p.caption || p.tag} fill className="object-cover" />
                      <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-full capitalize">{p.tag}</div>
                      {!isCompleted && (
                        <button onClick={() => removePhoto(p.id)}
                          className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {!isCompleted && (
                <>
                  <input ref={photoInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={async e => { const f = e.target.files?.[0]; if (f) await uploadPhoto(f); e.target.value = '' }} />
                  <Button variant="secondary" onClick={() => photoInputRef.current?.click()} loading={uploadingPhoto} className="w-full">
                    <ImagePlus className="w-4 h-4" /> {uploadingPhoto ? 'Uploading...' : `Take / Upload Photo (${selectedPhotoTag})`}
                  </Button>
                </>
              )}
            </div>

            {/* Work Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              <h3 className="text-sm font-bold text-gray-900">Work Summary</h3>
              <Textarea label="Work Performed" value={workNotes} onChange={e => setWorkNotes(e.target.value)} placeholder="Describe all work done..." rows={4} />
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={hasSafetyIssue} onChange={e => setHasSafetyIssue(e.target.checked)} className="mt-1 rounded" />
                  <div>
                    <p className="text-sm font-medium text-red-700">Flag Safety Issue</p>
                    <p className="text-xs text-gray-500">Check if you found a safety concern</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={requiresFollowUp} onChange={e => setRequiresFollowUp(e.target.checked)} className="mt-1 rounded" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Follow-up Required</p>
                    <p className="text-xs text-gray-500">Check if customer needs a follow-up visit</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Customer Signature */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              {isCompleted && customerSignature ? (
                <>
                  <p className="text-sm font-bold text-gray-900 mb-2">Customer Signature</p>
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                    <Image src={customerSignature} alt="Customer signature" width={600} height={180} className="w-full" />
                  </div>
                </>
              ) : (
                <SignatureCanvas value={customerSignature} onChange={saveSignature} label="Customer Signature" />
              )}
            </div>

            {!isCompleted && (
              <button onClick={() => setCompleteModal(true)}
                className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-98 transition-all">
                <Check className="w-5 h-5" /> Complete Job
              </button>
            )}

            {isCompleted && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                <Check className="w-10 h-10 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-bold">Job Completed!</p>
                <p className="text-green-700 text-sm mt-0.5">This job has been marked as completed.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal open={partsModal} onClose={() => setPartsModal(false)} title="Add Part / Material" size="sm">
        <div className="space-y-4">
          <Input label="Part Name *" value={partForm.name} onChange={e => setPartForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Refrigerant R410A" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Quantity" type="number" value={partForm.quantity} onChange={e => setPartForm(f => ({ ...f, quantity: e.target.value }))} min="1" />
            <Input label="Unit Cost ($)" type="number" value={partForm.unitCost} onChange={e => setPartForm(f => ({ ...f, unitCost: e.target.value }))} min="0" step="0.01" />
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-sm flex justify-between">
            <span className="text-gray-600">Total</span>
            <span className="font-bold">${(parseInt(partForm.quantity || '0') * parseFloat(partForm.unitCost || '0')).toFixed(2)}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPartsModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={addPart} disabled={!partForm.name} className="flex-1">Add Part</Button>
          </div>
        </div>
      </Modal>

      <Modal open={completeModal} onClose={() => setCompleteModal(false)} title="Complete Job?" size="sm">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-sm text-amber-800">Please confirm all work has been completed and the checklist is filled in. This action cannot be undone.</p>
          </div>
          {!workNotes.trim() && (
            <p className="text-xs text-red-600">⚠ Please add work performed notes in the Sign-off tab before completing.</p>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setCompleteModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={completeJob} loading={updating} disabled={!workNotes.trim()} className="flex-1 bg-green-600 hover:bg-green-700">
              <Check className="w-4 h-4" /> Complete Job
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
