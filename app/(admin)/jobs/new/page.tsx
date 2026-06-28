'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import type { Customer, Site, User } from '@/lib/types'

export default function NewJobPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [technicians, setTechnicians] = useState<User[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState('')

  const [form, setForm] = useState({
    title: '', description: '', jobType: 'repair', tradeType: 'aircon',
    priority: 'normal', customerId: '', siteId: '', appointmentDate: '', appointmentTime: '',
    estimatedDuration: '120', internalNotes: '', assignedTechnicians: [] as string[],
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/customers').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
    ]).then(([c, u]) => {
      setCustomers(c)
      setTechnicians(u.filter((usr: User) => usr.role === 'technician'))
    })
  }, [])

  useEffect(() => {
    if (selectedCustomer) {
      fetch(`/api/sites?customerId=${selectedCustomer}`).then(r => r.json()).then(setSites)
    }
  }, [selectedCustomer])

  function handleCustomerChange(customerId: string) {
    setSelectedCustomer(customerId)
    setForm(f => ({ ...f, customerId, siteId: '' }))
  }

  function toggleTech(techId: string) {
    setForm(f => ({
      ...f,
      assignedTechnicians: f.assignedTechnicians.includes(techId)
        ? f.assignedTechnicians.filter(t => t !== techId)
        : [...f.assignedTechnicians, techId],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, estimatedDuration: parseInt(form.estimatedDuration) }),
    })
    if (res.ok) {
      const job = await res.json()
      router.push(`/jobs/${job.id}`)
    } else {
      setSaving(false)
    }
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/jobs" className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">New Job</h1>
          <p className="text-sm text-gray-500">Create a new service job</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Job Details</h2>
          <Input label="Job Title *" value={form.title} onChange={e => set('title', e.target.value)} required placeholder="e.g. Aircon Service - 3 Units" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Job Type" value={form.jobType} onChange={e => set('jobType', e.target.value)}
              options={[
                { value: 'repair', label: 'Repair' }, { value: 'servicing', label: 'General Service' },
                { value: 'preventive', label: 'Preventive Maintenance' }, { value: 'installation', label: 'Installation' },
                { value: 'inspection', label: 'Inspection' }, { value: 'emergency', label: 'Emergency Repair' },
                { value: 'replacement', label: 'Replacement' }, { value: 'survey', label: 'Site Survey' },
                { value: 'warranty', label: 'Warranty Callback' }, { value: 'followup', label: 'Follow-up Visit' },
              ]} />
            <Select label="Trade" value={form.tradeType} onChange={e => set('tradeType', e.target.value)}
              options={[
                { value: 'aircon', label: 'Aircon' }, { value: 'electrical', label: 'Electrical' },
                { value: 'plumbing', label: 'Plumbing' }, { value: 'maintenance', label: 'Maintenance' },
              ]} />
          </div>
          <Select label="Priority" value={form.priority} onChange={e => set('priority', e.target.value)}
            options={[{ value: 'low', label: 'Low' }, { value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }]} />
          <Textarea label="Description" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the job..." />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Customer & Site</h2>
          <Select label="Customer *" value={form.customerId}
            onChange={e => handleCustomerChange(e.target.value)}
            options={[{ value: '', label: 'Select customer...' }, ...customers.map(c => ({ value: c.id, label: c.name }))]} />
          {sites.length > 0 && (
            <Select label="Site" value={form.siteId} onChange={e => set('siteId', e.target.value)}
              options={[{ value: '', label: 'Select site...' }, ...sites.map(s => ({ value: s.id, label: s.address + (s.unitNumber ? ` ${s.unitNumber}` : '') }))]} />
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Schedule</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Appointment Date" type="date" value={form.appointmentDate} onChange={e => set('appointmentDate', e.target.value)} />
            <Input label="Appointment Time" type="time" value={form.appointmentTime} onChange={e => set('appointmentTime', e.target.value)} />
          </div>
          <Input label="Estimated Duration (minutes)" type="number" value={form.estimatedDuration} onChange={e => set('estimatedDuration', e.target.value)} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Assign Technicians</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {technicians.map(t => (
              <label key={t.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.assignedTechnicians.includes(t.id) ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="checkbox" checked={form.assignedTechnicians.includes(t.id)} onChange={() => toggleTech(t.id)} className="rounded" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.skills?.join(', ') || 'General'}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <Textarea label="Internal Notes" value={form.internalNotes} onChange={e => set('internalNotes', e.target.value)} placeholder="Notes for the team only..." />
        </div>

        <div className="flex gap-3 justify-end pb-6">
          <Link href="/jobs"><Button type="button" variant="secondary">Cancel</Button></Link>
          <Button type="submit" loading={saving} disabled={!form.title || !form.customerId}>Create Job</Button>
        </div>
      </form>
    </div>
  )
}
