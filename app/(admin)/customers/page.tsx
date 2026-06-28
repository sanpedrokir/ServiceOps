'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Building2, Home, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import type { Customer } from '@/lib/types'

const TYPE_ICONS: Record<string, React.ReactNode> = {
  residential: <Home className="w-4 h-4" />,
  commercial: <Building2 className="w-4 h-4" />,
  condo: <Building2 className="w-4 h-4" />,
  office: <Building2 className="w-4 h-4" />,
  school: <Building2 className="w-4 h-4" />,
  retail: <Building2 className="w-4 h-4" />,
  property_mgmt: <Building2 className="w-4 h-4" />,
}

const TYPE_COLORS: Record<string, string> = {
  residential: 'bg-blue-100 text-blue-700',
  commercial: 'bg-purple-100 text-purple-700',
  condo: 'bg-indigo-100 text-indigo-700',
  office: 'bg-teal-100 text-teal-700',
  school: 'bg-green-100 text-green-700',
  retail: 'bg-amber-100 text-amber-700',
  property_mgmt: 'bg-rose-100 text-rose-700',
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [newModal, setNewModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', mobile: '', email: '', billingAddress: '', customerType: 'residential', notes: '',
  })

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(d => { setCustomers(d); setLoading(false) })
  }, [])

  const filtered = customers.filter(c => {
    if (!search) return true
    const s = search.toLowerCase()
    return c.name.toLowerCase().includes(s) || c.mobile?.includes(s) || c.email?.toLowerCase().includes(s)
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/customers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    if (res.ok) {
      const c = await res.json()
      setCustomers(prev => [c, ...prev])
      setNewModal(false)
      setForm({ name: '', mobile: '', email: '', billingAddress: '', customerType: 'residential', notes: '' })
    }
    setSaving(false)
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{customers.length} customers</p>
        </div>
        <Button onClick={() => setNewModal(true)}><Plus className="w-4 h-4" /> New Customer</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center"><div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No customers found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(c => (
              <Link href={`/customers/${c.id}`} key={c.id}
                className="flex items-center gap-4 px-4 sm:px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {c.mobile && <span className="text-xs text-gray-500">{c.mobile}</span>}
                    {c.email && <span className="text-xs text-gray-400 hidden sm:inline">· {c.email}</span>}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${TYPE_COLORS[c.customerType] || 'bg-gray-100 text-gray-700'}`}>
                  {c.customerType.replace('_', ' ')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Modal open={newModal} onClose={() => setNewModal(false)} title="New Customer" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Customer Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Select label="Customer Type" value={form.customerType} onChange={e => setForm(f => ({ ...f, customerType: e.target.value }))}
            options={[
              { value: 'residential', label: 'Residential' }, { value: 'commercial', label: 'Commercial' },
              { value: 'condo', label: 'Condominium' }, { value: 'office', label: 'Office' },
              { value: 'school', label: 'School' }, { value: 'retail', label: 'Retail' },
              { value: 'property_mgmt', label: 'Property Management' },
            ]} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Mobile" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} type="tel" />
            <Input label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" />
          </div>
          <Textarea label="Billing Address" value={form.billingAddress} onChange={e => setForm(f => ({ ...f, billingAddress: e.target.value }))} rows={2} />
          <Textarea label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setNewModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create Customer</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
