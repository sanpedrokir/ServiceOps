import { getSession } from '@/lib/auth'
import { db, dbSave, nextSequence } from '@/lib/db'
import type { Quote } from '@/lib/types'
import { generateId } from '@/lib/utils'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const database = await db(session.companyId)
  return Response.json(database.quotes)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const [seq, database] = await Promise.all([nextSequence(session.companyId, 'quote'), db(session.companyId)])
  const company = database.companies[0]
  const items = body.items || []
  const subtotal = items.reduce((s: number, i: { total: number }) => s + i.total, 0)
  const discount = body.discount || 0
  const gstAmount = company?.gstEnabled ? (subtotal - discount) * (company.gstRate / 100) : 0
  const now = new Date().toISOString()
  const quote: Quote = {
    id: generateId(), quoteNumber: `${company?.quotePrefix || 'QT-'}${seq}`,
    companyId: session.companyId, customerId: body.customerId, siteId: body.siteId,
    jobId: body.jobId, leadId: body.leadId, items, subtotal, discount,
    gst: parseFloat(gstAmount.toFixed(2)), total: parseFloat((subtotal - discount + gstAmount).toFixed(2)),
    depositRequired: body.depositRequired || 0, validityDays: body.validityDays || 30,
    paymentTerms: body.paymentTerms, warrantyTerms: body.warrantyTerms, notes: body.notes,
    status: 'draft', expiresAt: new Date(Date.now() + (body.validityDays || 30) * 86400000).toISOString(),
    createdAt: now, updatedAt: now,
  }
  await dbSave({ quotes: [quote] })
  return Response.json(quote, { status: 201 })
}
