'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { formatDate, formatCurrency, QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS, timeAgo } from '@/lib/utils'
import type { Quote, Customer } from '@/lib/types'

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [newModal, setNewModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ customerId: '', notes: '', paymentTerms: 'Net 30', warrantyTerms: '90 days', validityDays: '30', discount: '0', depositRequired: '0' })
  const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0, type: 'service' }])

  useEffect(() => {
    Promise.all([fetch('/api/quotes').then(r => r.json()), fetch('/api/customers').then(r => r.json())])
      .then(([q, c]) => { setQuotes(q); setCustomers(c); setLoading(false) })
  }, [])

  const filtered = quotes.filter(q => {
    if (statusFilter && q.status !== statusFilter) return false
    if (search) return q.quoteNumber.toLowerCase().includes(search.toLowerCase())
    return true
  })

  const stats = {
    draft: quotes.filter(q => q.status === 'draft').length,
    sent: quotes.filter(q => q.status === 'sent').length,
    approved: quotes.filter(q => q.status === 'approved').length,
    total: quotes.reduce((s, q) => s + q.total, 0),
  }

  function addItem() { setItems(prev => [...prev, { description: '', quantity: 1, unitPrice: 0, type: 'service' }]) }
  function updateItem(i: number, k: string, v: string | number) {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item
      const updated = { ...item, [k]: v }
      if (k === 'quantity' || k === 'unitPrice') {
        updated.quantity = k === 'quantity' ? Number(v) : updated.quantity
        updated.unitPrice = k === 'unitPrice' ? Number(v) : updated.unitPrice
      }
      return updated
    }))
  }
  function removeItem(i: number) { setItems(prev => prev.filter((_, idx) => idx !== i)) }

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const discount = parseFloat(form.discount) || 0
  const gst = (subtotal - discount) * 0.09
  const total = subtotal - discount + gst

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const lineItems = items.map((item, idx) => ({ id: `qi${idx}`, ...item, total: item.quantity * item.unitPrice }))
    const res = await fetch('/api/quotes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, items: lineItems, discount: parseFloat(form.discount) || 0, depositRequired: parseFloat(form.depositRequired) || 0, validityDays: parseInt(form.validityDays) || 30 }),
    })
    if (res.ok) {
      const q = await res.json()
      setQuotes(prev => [q, ...prev])
      setNewModal(false)
      setItems([{ description: '', quantity: 1, unitPrice: 0, type: 'service' }])
      setForm({ customerId: '', notes: '', paymentTerms: 'Net 30', warrantyTerms: '90 days', validityDays: '30', discount: '0', depositRequired: '0' })
    }
    setSaving(false)
  }

  async function sendQuote(id: string) {
    const res = await fetch(`/api/quotes/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'sent', sentAt: new Date().toISOString() }) })
    if (res.ok) { const q = await res.json(); setQuotes(prev => prev.map(x => x.id === id ? q : x)) }
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
          <p className="text-sm text-gray-500 mt-0.5">{quotes.length} total quotes</p>
        </div>
        <Button onClick={() => setNewModal(true)}><Plus className="w-4 h-4" /> New Quote</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Drafts', value: stats.draft, color: 'text-gray-600' },
          { label: 'Sent / Pending', value: stats.sent, color: 'text-blue-600' },
          { label: 'Approved', value: stats.approved, color: 'text-green-600' },
          { label: 'Total Value', value: formatCurrency(stats.total), color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-xl font-bold ${s.color} mt-0.5`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex gap-3 p-4 border-b border-gray-100 flex-wrap">
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search quotes..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Statuses</option>
            {['draft', 'sent', 'viewed', 'approved', 'rejected', 'expired'].map(s => (
              <option key={s} value={s}>{QUOTE_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center"><div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400"><FileText className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>No quotes found</p></div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(q => {
              const customer = customers.find(c => c.id === q.customerId)
              return (
                <div key={q.id} className="flex items-center gap-4 px-4 sm:px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 font-mono">{q.quoteNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${QUOTE_STATUS_COLORS[q.status]}`}>{QUOTE_STATUS_LABELS[q.status]}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{customer?.name || 'Unknown customer'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Created {timeAgo(q.createdAt)} · Expires {formatDate(q.expiresAt)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-gray-900">{formatCurrency(q.total)}</p>
                    {q.status === 'draft' && (
                      <Button size="sm" variant="secondary" onClick={() => sendQuote(q.id)} className="mt-1">Send</Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={newModal} onClose={() => setNewModal(false)} title="New Quotation" size="xl">
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Customer *" value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}
              options={[{ value: '', label: 'Select customer...' }, ...customers.map(c => ({ value: c.id, label: c.name }))]} />
            <Input label="Validity (days)" type="number" value={form.validityDays} onChange={e => setForm(f => ({ ...f, validityDays: e.target.value }))} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Line Items</label>
              <Button type="button" size="sm" variant="secondary" onClick={addItem}>+ Add Item</Button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-5">
                    <input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Description"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="col-span-2">
                    <input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} placeholder="Qty"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="col-span-2">
                    <input type="number" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} placeholder="Price"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="col-span-2">
                    <input readOnly value={`$${(item.quantity * item.unitPrice).toFixed(2)}`}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 font-medium text-gray-900" />
                  </div>
                  <div className="col-span-1 flex justify-center pt-2">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Discount</span>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">$</span>
                  <input type="number" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
                    className="w-24 px-2 py-1 text-right border border-gray-300 rounded text-sm" />
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">GST (9%)</span>
                <span className="font-medium">{formatCurrency(gst)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2">
                <span>Total</span>
                <span className="text-blue-600">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Deposit Required ($)" type="number" value={form.depositRequired} onChange={e => setForm(f => ({ ...f, depositRequired: e.target.value }))} />
            <Input label="Payment Terms" value={form.paymentTerms} onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))} />
          </div>
          <Input label="Warranty Terms" value={form.warrantyTerms} onChange={e => setForm(f => ({ ...f, warrantyTerms: e.target.value }))} />
          <Textarea label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setNewModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving} disabled={!form.customerId}>Create Quote</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
