import { getSession } from '@/lib/auth'
import { db, dbSave, nextSequence } from '@/lib/db'
import { Quote } from '@/lib/types'
import { generateId } from '@/lib/utils'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const quotes = db().quotes.filter(q => q.companyId === session.companyId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return Response.json(quotes)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const seq = nextSequence('quote')
  const database = db()
  const company = database.companies.find(c => c.id === session.companyId)

  const items = body.items || []
  const subtotal = items.reduce((s: number, i: { total: number }) => s + i.total, 0)
  const discount = body.discount || 0
  const gstAmount = company?.gstEnabled ? (subtotal - discount) * (company.gstRate / 100) : 0
  const total = subtotal - discount + gstAmount

  const now = new Date().toISOString()
  const quote: Quote = {
    id: generateId(),
    quoteNumber: `${company?.quotePrefix || 'QT-'}${seq}`,
    companyId: session.companyId,
    customerId: body.customerId,
    siteId: body.siteId,
    jobId: body.jobId,
    leadId: body.leadId,
    items,
    subtotal,
    discount,
    gst: parseFloat(gstAmount.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    depositRequired: body.depositRequired || 0,
    validityDays: body.validityDays || 30,
    paymentTerms: body.paymentTerms,
    warrantyTerms: body.warrantyTerms,
    notes: body.notes,
    status: 'draft',
    expiresAt: new Date(Date.now() + (body.validityDays || 30) * 86400000).toISOString(),
    createdAt: now,
    updatedAt: now,
  }

  dbSave({ quotes: [...database.quotes, quote] })
  return Response.json(quote, { status: 201 })
}
