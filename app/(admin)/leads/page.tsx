'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Phone, MessageCircle, Globe, Star, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { formatDate, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, timeAgo } from '@/lib/utils'
import type { Lead } from '@/lib/types'

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  phone: <Phone className="w-3.5 h-3.5" />,
  whatsapp: <MessageCircle className="w-3.5 h-3.5" />,
  website: <Globe className="w-3.5 h-3.5" />,
  google: <Globe className="w-3.5 h-3.5" />,
  referral: <Star className="w-3.5 h-3.5" />,
  existing: <Star className="w-3.5 h-3.5" />,
}

const URGENCY_COLORS: Record<string, string> = {
  normal: 'text-gray-500', urgent: 'text-amber-600', emergency: 'text-red-600',
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [newModal, setNewModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    contactName: '', contactPhone: '', contactEmail: '', source: 'phone', tradeType: 'aircon',
    urgency: 'normal', description: '', notes: '',
  })

  useEffect(() => {
    fetch('/api/leads').then(r => r.json()).then(d => { setLeads(d); setLoading(false) })
  }, [])

  const filtered = leads.filter(l => {
    if (statusFilter && l.status !== statusFilter) return false
    if (search) {
      const s = search.toLowerCase()
      return l.contactName.toLowerCase().includes(s) || l.description.toLowerCase().includes(s)
    }
    return true
  })

  const stats = {
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    siteVisit: leads.filter(l => l.status === 'site_visit').length,
    won: leads.filter(l => l.status === 'won').length,
    lost: leads.filter(l => l.status === 'lost').length,
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/leads', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const lead = await res.json()
      setLeads(prev => [lead, ...prev])
      setNewModal(false)
      setForm({ contactName: '', contactPhone: '', contactEmail: '', source: 'phone', tradeType: 'aircon', urgency: 'normal', description: '', notes: '' })
    }
    setSaving(false)
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/leads/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    if (res.ok) {
      const updated = await res.json()
      setLeads(prev => prev.map(l => l.id === id ? updated : l))
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads & Enquiries</h1>
          <p className="text-sm text-gray-500 mt-0.5">{leads.length} total leads</p>
        </div>
        <Button onClick={() => setNewModal(true)}><Plus className="w-4 h-4" /> New Lead</Button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {[
          { label: 'New', value: stats.new, color: 'text-blue-600', status: 'new' },
          { label: 'Contacted', value: stats.contacted, color: 'text-indigo-600', status: 'contacted' },
          { label: 'Site Visit', value: stats.siteVisit, color: 'text-purple-600', status: 'site_visit' },
          { label: 'Won', value: stats.won, color: 'text-green-600', status: 'won' },
          { label: 'Lost', value: stats.lost, color: 'text-red-600', status: 'lost' },
        ].map(s => (
          <button key={s.status} onClick={() => setStatusFilter(statusFilter === s.status ? '' : s.status)}
            className={`bg-white rounded-xl border p-3 text-left transition-colors ${statusFilter === s.status ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex gap-3 p-4 border-b border-gray-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center"><div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No leads found</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(lead => (
              <div key={lead.id} className="px-4 sm:px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{lead.contactName}</span>
                      <span className={`text-xs font-semibold uppercase ${URGENCY_COLORS[lead.urgency]}`}>{lead.urgency}</span>
                      <span className="text-xs text-gray-400 capitalize flex items-center gap-1">
                        {SOURCE_ICONS[lead.source]} {lead.source.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{lead.description}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {lead.contactPhone && (
                        <a href={`tel:${lead.contactPhone}`} className="text-xs text-blue-600 hover:underline">{lead.contactPhone}</a>
                      )}
                      <span className="text-xs text-gray-400 capitalize">{lead.tradeType}</span>
                      {lead.scheduledDate && <span className="text-xs text-gray-400">📅 {formatDate(lead.scheduledDate)}</span>}
                      <span className="text-xs text-gray-400">{timeAgo(lead.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${LEAD_STATUS_COLORS[lead.status]}`}>
                      {LEAD_STATUS_LABELS[lead.status]}
                    </span>
                    {!['won', 'lost'].includes(lead.status) && (
                      <select
                        value={lead.status}
                        onChange={e => updateStatus(lead.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="site_visit">Site Visit</option>
                        <option value="quoted">Quoted</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={newModal} onClose={() => setNewModal(false)} title="New Lead / Enquiry" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Name *" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} required />
            <Input label="Phone" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} type="tel" />
          </div>
          <Input label="Email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} type="email" />
          <div className="grid grid-cols-3 gap-4">
            <Select label="Source" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
              options={[{ value: 'phone', label: 'Phone' }, { value: 'whatsapp', label: 'WhatsApp' }, { value: 'website', label: 'Website' }, { value: 'referral', label: 'Referral' }, { value: 'google', label: 'Google' }, { value: 'existing', label: 'Existing Customer' }]} />
            <Select label="Trade" value={form.tradeType} onChange={e => setForm(f => ({ ...f, tradeType: e.target.value }))}
              options={[{ value: 'aircon', label: 'Aircon' }, { value: 'electrical', label: 'Electrical' }, { value: 'plumbing', label: 'Plumbing' }, { value: 'maintenance', label: 'Maintenance' }]} />
            <Select label="Urgency" value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}
              options={[{ value: 'normal', label: 'Normal' }, { value: 'urgent', label: 'Urgent' }, { value: 'emergency', label: 'Emergency' }]} />
          </div>
          <Textarea label="Description *" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required placeholder="What does the customer need?" rows={3} />
          <Textarea label="Internal Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setNewModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create Lead</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
