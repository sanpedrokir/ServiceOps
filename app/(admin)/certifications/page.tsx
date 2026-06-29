'use client'
import { useState, useEffect } from 'react'
import { Shield, AlertTriangle, CheckCircle, Clock, Plus, Pencil, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { formatDate } from '@/lib/utils'
import type { Certification, User } from '@/lib/types'

type CertStatus = 'expired' | 'expiring' | 'valid' | 'no_expiry'

function getCertStatus(expiryDate?: string): CertStatus {
  if (!expiryDate) return 'no_expiry'
  const days = Math.round((new Date(expiryDate).getTime() - Date.now()) / 86400000)
  if (days < 0) return 'expired'
  if (days <= 60) return 'expiring'
  return 'valid'
}

const STATUS_CONFIG: Record<CertStatus, { label: string; color: string; icon: React.ReactNode }> = {
  expired:   { label: 'Expired',          color: 'bg-red-100 text-red-700 border-red-200',     icon: <AlertTriangle className="w-3 h-3" /> },
  expiring:  { label: 'Expiring Soon',    color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Clock className="w-3 h-3" /> },
  valid:     { label: 'Valid',            color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle className="w-3 h-3" /> },
  no_expiry: { label: 'No Expiry',        color: 'bg-gray-100 text-gray-600 border-gray-200',   icon: <Shield className="w-3 h-3" /> },
}

const BLANK = { userId: '', name: '', certNumber: '', issuingBody: '', issuedDate: '', expiryDate: '', notes: '' }

export default function CertificationsPage() {
  const [certs, setCerts] = useState<Certification[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | Certification | null>(null)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/certifications').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
    ]).then(([c, u]) => {
      setCerts(c); setUsers(u.filter((usr: User) => usr.isActive)); setLoading(false)
    })
  }, [])

  function openAdd(userId = '') { setForm({ ...BLANK, userId }); setModal('add') }
  function openEdit(c: Certification) {
    setForm({ userId: c.userId, name: c.name, certNumber: c.certNumber || '', issuingBody: c.issuingBody || '', issuedDate: c.issuedDate || '', expiryDate: c.expiryDate || '', notes: c.notes || '' })
    setModal(c)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const isEdit = modal !== 'add'
    const url = isEdit ? `/api/certifications/${(modal as Certification).id}` : '/api/certifications'
    const method = isEdit ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) {
      const data = await res.json()
      if (isEdit) setCerts(prev => prev.map(c => c.id === (modal as Certification).id ? { ...c, ...form } : c))
      else setCerts(prev => [...prev, data])
      setModal(null)
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/certifications/${id}`, { method: 'DELETE' })
    setCerts(prev => prev.filter(c => c.id !== id))
    setDeleteTarget(null)
  }

  const grouped = users.map(u => ({
    user: u,
    certs: certs.filter(c => c.userId === u.id),
  })).filter(g => g.certs.length > 0)

  const expiredCount = certs.filter(c => getCertStatus(c.expiryDate) === 'expired').length
  const expiringCount = certs.filter(c => getCertStatus(c.expiryDate) === 'expiring').length

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">{certs.length} certifications · {users.length} active technicians</p>
        </div>
        <Button onClick={() => openAdd()}><Plus className="w-4 h-4" /> Add Certification</Button>
      </div>

      {/* Alerts */}
      {(expiredCount > 0 || expiringCount > 0) && (
        <div className="space-y-2">
          {expiredCount > 0 && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800 font-medium">{expiredCount} certification{expiredCount > 1 ? 's have' : ' has'} expired — renewal required</p>
            </div>
          )}
          {expiringCount > 0 && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800 font-medium">{expiringCount} certification{expiringCount > 1 ? 's are' : ' is'} expiring within 60 days</p>
            </div>
          )}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const count = certs.filter(c => getCertStatus(c.expiryDate) === key).length
          return (
            <div key={key} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">{cfg.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{count}</p>
            </div>
          )
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Ungrouped certs (no matching user) */}
          {certs.filter(c => !users.find(u => u.id === c.userId)).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-700">Unassigned</p>
              </div>
              <CertList certs={certs.filter(c => !users.find(u => u.id === c.userId))} onEdit={openEdit} onDelete={setDeleteTarget} />
            </div>
          )}

          {grouped.length === 0 && certs.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Shield className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No certifications yet</p>
              <p className="text-sm text-gray-400 mt-1">Add licenses, trade certs, and safety qualifications for your team</p>
              <Button className="mt-4" onClick={() => openAdd()}><Plus className="w-4 h-4" /> Add First Certification</Button>
            </div>
          )}

          {grouped.map(({ user, certs: userCerts }) => (
            <div key={user.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role} · {user.skills.join(', ')}</p>
                  </div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => openAdd(user.id)}>
                  <Plus className="w-3.5 h-3.5" /> Add
                </Button>
              </div>
              <CertList certs={userCerts} onEdit={openEdit} onDelete={setDeleteTarget} />
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Add Certification' : 'Edit Certification'} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <Select label="Technician *" value={form.userId} onChange={e => set('userId', e.target.value)}
            options={[{ value: '', label: 'Select technician...' }, ...users.map(u => ({ value: u.id, label: u.name }))]} />
          <Input label="Certification Name *" value={form.name} onChange={e => set('name', e.target.value)} required
            placeholder="e.g. Gas Servicing License, First Aid Certificate" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Certificate Number" value={form.certNumber} onChange={e => set('certNumber', e.target.value)} placeholder="e.g. GS-2024-1234" />
            <Input label="Issuing Body" value={form.issuingBody} onChange={e => set('issuingBody', e.target.value)} placeholder="e.g. BCA, MOM, SCDF" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Issue Date" type="date" value={form.issuedDate} onChange={e => set('issuedDate', e.target.value)} />
            <Input label="Expiry Date" type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
          </div>
          <Textarea label="Notes" value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Any additional notes..." />
          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button type="submit" loading={saving} disabled={!form.userId || !form.name}>Save</Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Certification?" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">This cannot be undone. Are you sure you want to delete this certification record?</p>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => deleteTarget && handleDelete(deleteTarget)}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function CertList({ certs, onEdit, onDelete }: { certs: Certification[]; onEdit: (c: Certification) => void; onDelete: (id: string) => void }) {
  return (
    <div className="divide-y divide-gray-50">
      {certs.map(cert => {
        const status = getCertStatus(cert.expiryDate)
        const cfg = STATUS_CONFIG[status]
        const daysUntil = cert.expiryDate
          ? Math.round((new Date(cert.expiryDate).getTime() - Date.now()) / 86400000)
          : null
        return (
          <div key={cert.id} className="flex items-center gap-4 px-5 py-3.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-gray-900">{cert.name}</p>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
                  {cfg.icon} {cfg.label}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {cert.certNumber && <span className="text-xs text-gray-500 font-mono">{cert.certNumber}</span>}
                {cert.issuingBody && <span className="text-xs text-gray-400">{cert.issuingBody}</span>}
                {cert.expiryDate && (
                  <span className={`text-xs font-medium ${status === 'expired' ? 'text-red-600' : status === 'expiring' ? 'text-amber-600' : 'text-gray-500'}`}>
                    Expires {formatDate(cert.expiryDate)}
                    {daysUntil !== null && daysUntil < 0 && ` (${Math.abs(daysUntil)}d ago)`}
                    {daysUntil !== null && daysUntil >= 0 && daysUntil <= 60 && ` (${daysUntil}d left)`}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => onEdit(cert)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onDelete(cert.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
