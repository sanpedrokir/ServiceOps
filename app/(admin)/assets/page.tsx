'use client'
import { useState, useEffect } from 'react'
import { Cpu, Search, Plus, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { formatDate } from '@/lib/utils'
import type { Asset, Customer, Site } from '@/lib/types'

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [newModal, setNewModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ customerId: '', siteId: '', tradeType: 'aircon', category: '', brand: '', model: '', serialNumber: '', installationDate: '', warrantyExpiry: '', location: '', notes: '' })

  useEffect(() => {
    Promise.all([fetch('/api/assets').then(r => r.json()), fetch('/api/customers').then(r => r.json()), fetch('/api/sites').then(r => r.json())])
      .then(([a, c, s]) => { setAssets(a); setCustomers(c); setSites(s); setLoading(false) })
  }, [])

  const filtered = assets.filter(a => {
    if (!search) return true
    const s = search.toLowerCase()
    return a.category.toLowerCase().includes(s) || a.brand?.toLowerCase().includes(s) || a.model?.toLowerCase().includes(s) || a.serialNumber?.toLowerCase().includes(s)
  })

  const now = new Date().toISOString().split('T')[0]
  const expiringSoon = assets.filter(a => a.warrantyExpiry && a.warrantyExpiry > now && a.warrantyExpiry < new Date(Date.now() + 90*86400000).toISOString().split('T')[0]).length
  const overdueService = assets.filter(a => a.nextServiceDate && a.nextServiceDate < now).length

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/assets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) { const a = await res.json(); setAssets(prev => [...prev, a]); setNewModal(false) }
    setSaving(false)
  }

  const CATEGORIES: Record<string, string[]> = {
    aircon: ['Fan Coil Unit', 'Compressor', 'Condenser', 'Ducting', 'Air Handler'],
    electrical: ['Distribution Board', 'Circuit Breaker', 'Socket', 'Light Fitting', 'Isolator'],
    plumbing: ['Water Heater', 'Toilet', 'Sink', 'Water Pump', 'Pipe Section'],
    maintenance: ['Door', 'CCTV Unit', 'Access Control', 'Appliance'],
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
          <p className="text-sm text-gray-500 mt-0.5">{assets.length} assets tracked</p>
        </div>
        <Button onClick={() => setNewModal(true)}><Plus className="w-4 h-4" /> Add Asset</Button>
      </div>

      {(expiringSoon > 0 || overdueService > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {expiringSoon > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-amber-800 text-sm">{expiringSoon} warranty expiring within 90 days</span>
            </div>
          )}
          {overdueService > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-red-800 text-sm">{overdueService} assets overdue for service</span>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        {loading ? <div className="p-8 text-center"><div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div> : (
          <div className="divide-y divide-gray-50">
            {filtered.map(a => {
              const customer = customers.find(c => c.id === a.customerId)
              const site = sites.find(s => s.id === a.siteId)
              const warrantyExpired = a.warrantyExpiry && a.warrantyExpiry < now
              const serviceOverdue = a.nextServiceDate && a.nextServiceDate < now
              return (
                <div key={a.id} className="flex items-start gap-3 px-4 sm:px-5 py-4">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Cpu className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{a.brand} {a.category}</span>
                      {a.model && <span className="text-xs text-gray-500">{a.model}</span>}
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${a.tradeType === 'aircon' ? 'bg-blue-100 text-blue-700' : a.tradeType === 'electrical' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>{a.tradeType}</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-0.5">{customer?.name} · {site?.address}</p>
                    {a.location && <p className="text-xs text-gray-500">{a.location}</p>}
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs">
                      {a.serialNumber && <span className="text-gray-400">S/N: {a.serialNumber}</span>}
                      {a.warrantyExpiry && (
                        <span className={warrantyExpired ? 'text-red-600 font-medium' : 'text-gray-400'}>
                          Warranty: {warrantyExpired ? 'EXPIRED' : formatDate(a.warrantyExpiry)}
                        </span>
                      )}
                      {a.nextServiceDate && (
                        <span className={serviceOverdue ? 'text-red-600 font-medium' : 'text-gray-400'}>
                          Next Service: {serviceOverdue ? 'OVERDUE' : formatDate(a.nextServiceDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No assets found</p>}
          </div>
        )}
      </div>

      <Modal open={newModal} onClose={() => setNewModal(false)} title="Add Asset" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Customer *" value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value, siteId: '' }))}
              options={[{ value: '', label: 'Select...' }, ...customers.map(c => ({ value: c.id, label: c.name }))]} />
            <Select label="Site" value={form.siteId} onChange={e => setForm(f => ({ ...f, siteId: e.target.value }))}
              options={[{ value: '', label: 'Select...' }, ...sites.filter(s => !form.customerId || s.customerId === form.customerId).map(s => ({ value: s.id, label: s.address }))]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Trade Type" value={form.tradeType} onChange={e => setForm(f => ({ ...f, tradeType: e.target.value, category: '' }))}
              options={[{ value: 'aircon', label: 'Aircon' }, { value: 'electrical', label: 'Electrical' }, { value: 'plumbing', label: 'Plumbing' }, { value: 'maintenance', label: 'Maintenance' }]} />
            <Select label="Category *" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              options={[{ value: '', label: 'Select...' }, ...(CATEGORIES[form.tradeType] || []).map(c => ({ value: c, label: c }))]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Brand" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="Daikin, Mitsubishi..." />
            <Input label="Model" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Serial Number" value={form.serialNumber} onChange={e => setForm(f => ({ ...f, serialNumber: e.target.value }))} />
            <Input label="Location in Site" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Living Room, Level 3..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Installation Date" type="date" value={form.installationDate} onChange={e => setForm(f => ({ ...f, installationDate: e.target.value }))} />
            <Input label="Warranty Expiry" type="date" value={form.warrantyExpiry} onChange={e => setForm(f => ({ ...f, warrantyExpiry: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setNewModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving} disabled={!form.customerId || !form.category}>Add Asset</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
