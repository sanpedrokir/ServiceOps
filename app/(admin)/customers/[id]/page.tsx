'use client'
import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Phone, Mail, MapPin, Briefcase, FileText, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatDate, formatCurrency, JOB_STATUS_LABELS, JOB_STATUS_COLORS, INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '@/lib/utils'
import type { Customer, Site, Asset, Job, Quote, Invoice } from '@/lib/types'

interface CustomerDetail extends Customer {
  sites: Site[]
  assets: Asset[]
  jobs: Job[]
  quotes: Quote[]
  invoices: Invoice[]
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'sites' | 'invoices'>('overview')

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setCustomer(d); setLoading(false) })
  }, [id])

  if (loading) return <div className="p-6 flex items-center justify-center min-h-64"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
  if (!customer) return <div className="p-6 text-center text-gray-500">Customer not found<br /><Link href="/customers" className="text-blue-600 text-sm">← Back</Link></div>

  const totalRevenue = customer.invoices.filter(i => i.paymentStatus === 'paid').reduce((s, i) => s + i.total, 0)
  const outstandingBalance = customer.invoices.filter(i => ['sent', 'partially_paid', 'overdue'].includes(i.paymentStatus)).reduce((s, i) => s + i.amountDue, 0)

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/customers" className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
          <p className="text-sm text-gray-500 capitalize">{customer.customerType.replace('_', ' ')}</p>
        </div>
        <Link href={`/jobs/new?customerId=${customer.id}`}>
          <Button size="sm"><Briefcase className="w-4 h-4" /> New Job</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total Jobs</p>
          <p className="text-2xl font-bold text-gray-900">{customer.jobs.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total Revenue</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Outstanding</p>
          <p className="text-xl font-bold text-amber-600">{formatCurrency(outstandingBalance)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Assets</p>
          <p className="text-2xl font-bold text-gray-900">{customer.assets.length}</p>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {(['overview', 'jobs', 'sites', 'invoices'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-colors ${activeTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Contact Information</h3>
          {customer.mobile && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <a href={`tel:${customer.mobile}`} className="text-sm text-blue-600 hover:underline">{customer.mobile}</a>
            </div>
          )}
          {customer.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <a href={`mailto:${customer.email}`} className="text-sm text-blue-600 hover:underline">{customer.email}</a>
            </div>
          )}
          {customer.billingAddress && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <p className="text-sm text-gray-700">{customer.billingAddress}</p>
            </div>
          )}
          {customer.notes && (
            <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-800 mt-3">{customer.notes}</div>
          )}
        </div>
      )}

      {activeTab === 'jobs' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Jobs ({customer.jobs.length})</h3>
            <Link href={`/jobs/new?customerId=${customer.id}`} className="text-blue-600 text-sm hover:underline">+ New Job</Link>
          </div>
          {customer.jobs.length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">No jobs</p> : (
            <div className="divide-y divide-gray-50">
              {customer.jobs.map(j => (
                <Link href={`/jobs/${j.id}`} key={j.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{j.title}</p>
                    <p className="text-xs text-gray-500">{j.jobNumber} · {formatDate(j.appointmentDate)}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${JOB_STATUS_COLORS[j.status]}`}>{JOB_STATUS_LABELS[j.status]}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'sites' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Service Sites ({customer.sites.length})</h3>
          </div>
          {customer.sites.length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">No sites</p> : (
            <div className="divide-y divide-gray-50">
              {customer.sites.map(s => (
                <div key={s.id} className="px-5 py-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.address}{s.unitNumber ? `, ${s.unitNumber}` : ''}</p>
                      {s.siteType && <p className="text-xs text-gray-500 mt-0.5">{s.siteType}</p>}
                      {s.contactPerson && <p className="text-xs text-gray-500">Contact: {s.contactPerson} {s.contactPhone && `(${s.contactPhone})`}</p>}
                      {s.accessInstructions && <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-1 inline-block">{s.accessInstructions}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Invoices ({customer.invoices.length})</h3>
          </div>
          {customer.invoices.length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">No invoices</p> : (
            <div className="divide-y divide-gray-50">
              {customer.invoices.map(i => (
                <div key={i.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{i.invoiceNumber}</p>
                    <p className="text-xs text-gray-500">{formatDate(i.paymentDueDate || i.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(i.total)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INVOICE_STATUS_COLORS[i.paymentStatus]}`}>{INVOICE_STATUS_LABELS[i.paymentStatus]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
