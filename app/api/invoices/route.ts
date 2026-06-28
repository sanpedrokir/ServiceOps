import { getSession } from '@/lib/auth'
import { db, dbSave, nextSequence } from '@/lib/db'
import { Invoice } from '@/lib/types'
import { generateId } from '@/lib/utils'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const invoices = db().invoices.filter(i => i.companyId === session.companyId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return Response.json(invoices)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const seq = nextSequence('invoice')
  const database = db()
  const company = database.companies.find(c => c.id === session.companyId)

  const items = body.items || []
  const subtotal = items.reduce((s: number, i: { total: number }) => s + i.total, 0)
  const discount = body.discount || 0
  const gstAmount = company?.gstEnabled ? (subtotal - discount) * (company.gstRate / 100) : 0
  const total = subtotal - discount + gstAmount
  const depositPaid = body.depositPaid || 0
  const amountDue = total - depositPaid

  const now = new Date().toISOString()
  const invoice: Invoice = {
    id: generateId(),
    invoiceNumber: `${company?.invoicePrefix || 'INV-'}${seq}`,
    companyId: session.companyId,
    customerId: body.customerId,
    jobId: body.jobId,
    quoteId: body.quoteId,
    items,
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount: parseFloat(discount.toFixed(2)),
    gst: parseFloat(gstAmount.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    depositPaid: parseFloat(depositPaid.toFixed(2)),
    amountDue: parseFloat(amountDue.toFixed(2)),
    paymentStatus: 'draft',
    paymentDueDate: body.paymentDueDate,
    notes: body.notes,
    createdAt: now,
    updatedAt: now,
  }

  dbSave({ invoices: [...database.invoices, invoice] })
  return Response.json(invoice, { status: 201 })
}
