'use client'
import { useState, useEffect } from 'react'
import { Search, Receipt, AlertCircle, DollarSign } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { formatDate, formatCurrency, INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS, timeAgo } from '@/lib/utils'
import type { Invoice, Customer } from '@/lib/types'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [payModal, setPayModal] = useState<Invoice | null>(null)
  const [payMethod, setPayMethod] = useState('paynow')
  const [payRef, setPayRef] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([fetch('/api/invoices').then(r => r.json()), fetch('/api/customers').then(r => r.json())])
      .then(([inv, cust]) => { setInvoices(inv); setCustomers(cust); setLoading(false) })
  }, [])

  const filtered = invoices.filter(i => {
    if (statusFilter && i.paymentStatus !== statusFilter) return false
    if (search) {
      const s = search.toLowerCase()
      const c = customers.find(c => c.id === i.customerId)
      return i.invoiceNumber.toLowerCase().includes(s) || c?.name.toLowerCase().includes(s)
    }
    return true
  })

  const stats = {
    total: invoices.reduce((s, i) => s + i.total, 0),
    paid: invoices.filter(i => i.paymentStatus === 'paid').reduce((s, i) => s + i.total, 0),
    outstanding: invoices.filter(i => ['sent', 'partially_paid'].includes(i.paymentStatus)).reduce((s, i) => s + i.amountDue, 0),
    overdue: invoices.filter(i => i.paymentStatus === 'overdue').reduce((s, i) => s + i.amountDue, 0),
    overdueCount: invoices.filter(i => i.paymentStatus === 'overdue').length,
  }

  async function markPaid(invoice: Invoice) {
    setSaving(true)
    const res = await fetch(`/api/invoices/${invoice.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus: 'paid', paymentMethod: payMethod, paymentReference: payRef, paidAt: new Date().toISOString(), amountDue: 0 }),
    })
    if (res.ok) {
      const updated = await res.json()
      setInvoices(prev => prev.map(i => i.id === invoice.id ? updated : i))
      setPayModal(null)
      setPayRef('')
    }
    setSaving(false)
  }

  async function sendInvoice(id: string) {
    const res = await fetch(`/api/invoices/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentStatus: 'sent', sentAt: new Date().toISOString() }) })
    if (res.ok) { const updated = await res.json(); setInvoices(prev => prev.map(i => i.id === id ? updated : i)) }
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">{invoices.length} total invoices</p>
        </div>
      </div>

      {stats.overdueCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <span className="text-red-800 font-medium text-sm">{stats.overdueCount} overdue invoice{stats.overdueCount > 1 ? 's' : ''}</span>
            <span className="text-red-600 text-sm"> — {formatCurrency(stats.overdue)} overdue</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total Invoiced</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.total)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Collected</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(stats.paid)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Outstanding</p>
          <p className="text-xl font-bold text-amber-600">{formatCurrency(stats.outstanding)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Overdue</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(stats.overdue)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex gap-3 p-4 border-b border-gray-100 flex-wrap">
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Statuses</option>
            {['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled'].map(s => (
              <option key={s} value={s}>{INVOICE_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center"><div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400"><Receipt className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>No invoices found</p></div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(inv => {
              const customer = customers.find(c => c.id === inv.customerId)
              const isOverdue = inv.paymentStatus === 'overdue'
              return (
                <div key={inv.id} className={`flex items-center gap-4 px-4 sm:px-5 py-4 ${isOverdue ? 'bg-red-50/40' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 font-mono">{inv.invoiceNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INVOICE_STATUS_COLORS[inv.paymentStatus]}`}>
                        {INVOICE_STATUS_LABELS[inv.paymentStatus]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{customer?.name || 'Unknown customer'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Due {formatDate(inv.paymentDueDate)} · Created {timeAgo(inv.createdAt)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 space-y-1">
                    <p className="text-base font-bold text-gray-900">{formatCurrency(inv.total)}</p>
                    {inv.amountDue < inv.total && inv.paymentStatus !== 'paid' && (
                      <p className="text-xs text-amber-600 font-medium">Due: {formatCurrency(inv.amountDue)}</p>
                    )}
                    {inv.paymentStatus === 'draft' && (
                      <Button size="sm" variant="secondary" onClick={() => sendInvoice(inv.id)}>Send</Button>
                    )}
                    {['sent', 'partially_paid', 'overdue'].includes(inv.paymentStatus) && (
                      <Button size="sm" onClick={() => setPayModal(inv)} className="text-xs">Mark Paid</Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Record Payment" size="sm">
        {payModal && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-3 text-sm">
              <p className="text-blue-800 font-medium">{payModal.invoiceNumber}</p>
              <p className="text-blue-600">Amount Due: {formatCurrency(payModal.amountDue)}</p>
            </div>
            <Select label="Payment Method" value={payMethod} onChange={e => setPayMethod(e.target.value)}
              options={[{ value: 'paynow', label: 'PayNow' }, { value: 'bank_transfer', label: 'Bank Transfer' }, { value: 'cash', label: 'Cash' }, { value: 'card', label: 'Card' }, { value: 'cheque', label: 'Cheque' }]} />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Reference / Receipt No.</label>
              <input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="e.g. PN20260128001"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => setPayModal(null)}>Cancel</Button>
              <Button loading={saving} onClick={() => markPaid(payModal)}>
                <DollarSign className="w-4 h-4" /> Confirm Payment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
