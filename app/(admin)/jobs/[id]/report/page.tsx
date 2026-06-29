'use client'
import { useState, useEffect, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { formatDate, formatDateTime, JOB_TYPE_LABELS } from '@/lib/utils'
import type { Job, Customer, Site, Asset, User, Company } from '@/lib/types'

interface JobReport extends Job {
  customer?: Customer
  site?: Site
  assets?: Asset[]
  technicians?: User[]
}

export default function JobReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [job, setJob] = useState<JobReport | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/jobs/${id}`).then(r => r.ok ? r.json() : null),
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
    ]).then(([j, me]) => {
      setJob(j)
      if (me?.company) setCompany(me.company as Company)
      setLoading(false)
    })
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!job) return (
    <div className="p-6 text-center">
      <p className="text-gray-500">Job not found</p>
      <Link href="/jobs" className="text-blue-600 text-sm">← Back</Link>
    </div>
  )

  const partsTotal = (job.partsUsed || []).reduce((s, p) => s + p.total, 0)
  const labourTotal = (job.labourHours || 0) * 80
  const checklist = Object.entries(job.checklistData || {})
  const photosBefore = (job.photos || []).filter(p => p.tag === 'before')
  const photosAfter = (job.photos || []).filter(p => p.tag === 'after')
  const photosDefect = (job.photos || []).filter(p => p.tag === 'defect')

  return (
    <>
      {/* Screen-only toolbar */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/jobs/${id}`} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-sm font-semibold text-gray-900">Service Report</p>
            <p className="text-xs text-gray-500">{job.jobNumber}</p>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

      {/* Report document */}
      <div className="max-w-4xl mx-auto p-6 print:p-0 print:max-w-none">
        <div className="bg-white print:shadow-none shadow-sm rounded-xl print:rounded-none border border-gray-200 print:border-0 overflow-hidden">

          {/* Header */}
          <div className="bg-gray-900 text-white px-8 py-6 print:px-6 print:py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold tracking-tight">{company?.name || 'Service Company'}</h1>
                {company?.address && <p className="text-gray-300 text-sm mt-1">{company.address}</p>}
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-sm text-gray-400">
                  {company?.phone && <span>{company.phone}</span>}
                  {company?.email && <span>{company.email}</span>}
                  {company?.uen && <span>UEN: {company.uen}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-bold text-white tracking-tight">SERVICE REPORT</p>
                <p className="text-blue-300 font-mono font-semibold mt-1">{job.jobNumber}</p>
                <p className="text-gray-400 text-sm mt-0.5">
                  {job.appointmentDate ? formatDate(job.appointmentDate) : formatDate(job.createdAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 print:px-6 space-y-6">

            {/* Customer & Job Info */}
            <div className="grid grid-cols-2 gap-6 print:gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Customer</p>
                <p className="font-semibold text-gray-900">{job.customer?.name || '—'}</p>
                {job.customer?.mobile && <p className="text-sm text-gray-600">📞 {job.customer.mobile}</p>}
                {job.customer?.email && <p className="text-sm text-gray-600">✉ {job.customer.email}</p>}
                {job.site && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Service Address</p>
                    <p className="text-sm text-gray-800">{job.site.address}{job.site.unitNumber ? `, ${job.site.unitNumber}` : ''}</p>
                    {job.site.contactPerson && <p className="text-sm text-gray-500 mt-0.5">Contact: {job.site.contactPerson}{job.site.contactPhone ? ` (${job.site.contactPhone})` : ''}</p>}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Job Details</p>
                <table className="text-sm w-full">
                  <tbody className="divide-y divide-gray-50">
                    {[
                      ['Type', JOB_TYPE_LABELS[job.jobType] || job.jobType],
                      ['Trade', job.tradeType.charAt(0).toUpperCase() + job.tradeType.slice(1)],
                      ['Priority', job.priority.charAt(0).toUpperCase() + job.priority.slice(1)],
                      ['Status', job.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())],
                      ...(job.appointmentDate ? [['Appointment', `${formatDate(job.appointmentDate)}${job.appointmentTime ? ` at ${job.appointmentTime}` : ''}`]] : []),
                      ...(job.technicians?.length ? [['Technician(s)', job.technicians.map(t => t.name).join(', ')]] : []),
                    ].map(([label, value]) => (
                      <tr key={label}>
                        <td className="py-1.5 pr-3 text-gray-500 w-28 font-medium">{label}</td>
                        <td className="py-1.5 text-gray-900">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {job.description && (
              <Section title="Job Description">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.description}</p>
              </Section>
            )}

            {job.faultDiagnosis && (
              <Section title="Fault Diagnosis">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.faultDiagnosis}</p>
              </Section>
            )}

            {checklist.length > 0 && (
              <Section title="Service Checklist">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide border border-gray-200">Item</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide border border-gray-200 w-40">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checklist.map(([key, value]) => (
                      <tr key={key} className="even:bg-gray-50/50">
                        <td className="py-2 px-3 text-gray-700 border border-gray-200 capitalize">{key.replace(/_/g, ' ')}</td>
                        <td className={`py-2 px-3 border border-gray-200 font-medium ${
                          ['good', 'clean', 'normal', 'ok', 'pass', 'none observed', 'done'].some(g => value.toLowerCase().includes(g))
                            ? 'text-green-700' : 'text-amber-700'
                        }`}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            )}

            {job.workPerformed && (
              <Section title="Work Performed">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.workPerformed}</p>
              </Section>
            )}

            {(job.partsUsed || []).length > 0 && (
              <Section title="Parts & Materials Used">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      {['Description', 'Qty', 'Unit Cost', 'Total'].map(h => (
                        <th key={h} className={`py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide border border-gray-200 ${h !== 'Description' ? 'text-right w-24' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(job.partsUsed || []).map(p => (
                      <tr key={p.id} className="even:bg-gray-50/50">
                        <td className="py-2 px-3 text-gray-700 border border-gray-200">{p.name}</td>
                        <td className="py-2 px-3 text-right text-gray-700 border border-gray-200">{p.quantity}</td>
                        <td className="py-2 px-3 text-right text-gray-700 border border-gray-200">${p.unitCost.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-semibold text-gray-900 border border-gray-200">${p.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    {job.labourHours ? (
                      <tr className="bg-gray-50">
                        <td className="py-2 px-3 text-gray-700 border border-gray-200">Labour ({job.labourHours} hrs @ $80/hr)</td>
                        <td className="border border-gray-200" />
                        <td className="border border-gray-200" />
                        <td className="py-2 px-3 text-right font-semibold text-gray-900 border border-gray-200">${labourTotal.toFixed(2)}</td>
                      </tr>
                    ) : null}
                    <tr className="bg-blue-50">
                      <td colSpan={3} className="py-2.5 px-3 text-right font-bold text-gray-900 border border-gray-200">Parts Total</td>
                      <td className="py-2.5 px-3 text-right font-bold text-blue-900 border border-gray-200">${(partsTotal + labourTotal).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
                <p className="text-xs text-gray-400 mt-1.5">* Parts total excludes labour charges and GST. Final invoice will include all applicable charges.</p>
              </Section>
            )}

            {job.recommendations && (
              <Section title="Recommendations">
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <p className="text-sm text-amber-800 whitespace-pre-wrap">{job.recommendations}</p>
                </div>
              </Section>
            )}

            {/* Photos */}
            {(job.photos || []).length > 0 && (
              <Section title="Job Photos">
                {[{ label: 'Before', photos: photosBefore }, { label: 'After', photos: photosAfter }, { label: 'Defects Found', photos: photosDefect }]
                  .filter(g => g.photos.length > 0)
                  .map(group => (
                    <div key={group.label} className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{group.label}</p>
                      <div className="grid grid-cols-3 gap-3 print:grid-cols-4">
                        {group.photos.map(p => (
                          <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                            <Image src={p.url} alt={p.caption || p.tag} fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </Section>
            )}

            {/* Flags */}
            {(job.hasSafetyIssue || job.requiresFollowUp) && (
              <div className="flex flex-wrap gap-3">
                {job.hasSafetyIssue && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <span className="text-red-600 text-sm font-semibold">⚠ Safety Issue Identified</span>
                  </div>
                )}
                {job.requiresFollowUp && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <span className="text-amber-700 text-sm font-semibold">↩ Follow-up Visit Required</span>
                  </div>
                )}
              </div>
            )}

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-2">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Customer Acknowledgement</p>
                <div className="border-2 border-gray-200 rounded-lg min-h-24 flex items-center justify-center bg-gray-50 overflow-hidden">
                  {job.customerSignature ? (
                    <Image src={job.customerSignature} alt="Customer signature" width={300} height={96} className="w-full object-contain max-h-24" />
                  ) : (
                    <p className="text-gray-300 text-sm">No signature captured</p>
                  )}
                </div>
                <div className="border-t border-gray-300 mt-3 pt-2">
                  <p className="text-xs text-gray-500">Name: {job.customer?.name || '________________________________'}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Date: {job.timestamps?.completed ? formatDate(job.timestamps.completed) : '________________________________'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Technician Sign-off</p>
                <div className="border-2 border-gray-200 rounded-lg min-h-24 bg-gray-50 flex items-center justify-center px-4">
                  <div className="text-center">
                    {job.technicians?.map(t => (
                      <p key={t.id} className="text-sm font-semibold text-gray-800">{t.name}</p>
                    ))}
                    {(!job.technicians || job.technicians.length === 0) && (
                      <p className="text-gray-300 text-sm">________________________________</p>
                    )}
                  </div>
                </div>
                <div className="border-t border-gray-300 mt-3 pt-2">
                  <p className="text-xs text-gray-500">
                    Date: {job.timestamps?.completed ? formatDate(job.timestamps.completed) : formatDate(job.appointmentDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer terms */}
            {(company?.warrantyPeriod || company?.paymentTerms) && (
              <div className="border-t border-gray-100 pt-4 space-y-1">
                {company.warrantyPeriod && (
                  <p className="text-xs text-gray-500"><span className="font-semibold">Warranty:</span> {company.warrantyPeriod}</p>
                )}
                {company.paymentTerms && (
                  <p className="text-xs text-gray-500"><span className="font-semibold">Payment Terms:</span> {company.paymentTerms}</p>
                )}
              </div>
            )}

            <div className="border-t border-gray-100 pt-4 text-center text-xs text-gray-400">
              Report generated {formatDateTime(new Date().toISOString())} · {company?.name} · {job.jobNumber}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 12mm 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">{title}</p>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      {children}
    </div>
  )
}
