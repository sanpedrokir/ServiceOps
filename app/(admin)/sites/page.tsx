'use client'
import { useState, useEffect } from 'react'
import { MapPin, Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import type { Site, Customer } from '@/lib/types'

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [newModal, setNewModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ customerId: '', address: '', unitNumber: '', accessInstructions: '', contactPerson: '', contactPhone: '', siteType: '', notes: '' })

  useEffect(() => {
    Promise.all([fetch('/api/sites').then(r => r.json()), fetch('/api/customers').then(r => r.json())])
      .then(([s, c]) => { setSites(s); setCustomers(c); setLoading(false) })
  }, [])

  const filtered = sites.filter(s => {
    if (!search) return true
    return s.address.toLowerCase().includes(search.toLowerCase()) || (s.unitNumber || '').toLowerCase().includes(search.toLowerCase())
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/sites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) { const s = await res.json(); setSites(prev => [...prev, s]); setNewModal(false); setForm({ customerId: '', address: '', unitNumber: '', accessInstructions: '', contactPerson: '', contactPhone: '', siteType: '', notes: '' }) }
    setSaving(false)
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Sites</h1>
          <p className="text-sm text-gray-500 mt-0.5">{sites.length} sites registered</p>
        </div>
        <Button onClick={() => setNewModal(true)}><Plus className="w-4 h-4" /> Add Site</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sites..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        {loading ? <div className="p-8 text-center"><div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div> : (
          <div className="divide-y divide-gray-50">
            {filtered.map(s => {
              const customer = customers.find(c => c.id === s.customerId)
              return (
                <div key={s.id} className="flex items-start gap-3 px-4 sm:px-5 py-4">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{s.address}{s.unitNumber ? `, ${s.unitNumber}` : ''}</p>
                    <p className="text-xs text-blue-600 mt-0.5">{customer?.name}</p>
                    {s.siteType && <p className="text-xs text-gray-500 mt-0.5">{s.siteType}</p>}
                    {s.contactPerson && <p className="text-xs text-gray-400 mt-0.5">Contact: {s.contactPerson} {s.contactPhone && `(${s.contactPhone})`}</p>}
                    {s.accessInstructions && (
                      <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-1.5 inline-block">{s.accessInstructions}</p>
                    )}
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No sites found</p>}
          </div>
        )}
      </div>

      <Modal open={newModal} onClose={() => setNewModal(false)} title="Add Service Site" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <Select label="Customer *" value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}
            options={[{ value: '', label: 'Select customer...' }, ...customers.map(c => ({ value: c.id, label: c.name }))]} />
          <Input label="Address *" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Unit Number" value={form.unitNumber} onChange={e => setForm(f => ({ ...f, unitNumber: e.target.value }))} placeholder="#12-34" />
            <Input label="Site Type" value={form.siteType} onChange={e => setForm(f => ({ ...f, siteType: e.target.value }))} placeholder="Office, Residential..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Person" value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} />
            <Input label="Contact Phone" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} type="tel" />
          </div>
          <Textarea label="Access Instructions" value={form.accessInstructions} onChange={e => setForm(f => ({ ...f, accessInstructions: e.target.value }))} rows={2} />
          <Textarea label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setNewModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving} disabled={!form.customerId || !form.address}>Add Site</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
