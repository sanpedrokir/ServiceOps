import { getSession } from '@/lib/auth'
import { db, dbSave } from '@/lib/db'
import { Customer } from '@/lib/types'
import { generateId } from '@/lib/utils'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const customers = db().customers.filter(c => c.companyId === session.companyId)
  return Response.json(customers)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['owner', 'admin'].includes(session.role)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const now = new Date().toISOString()
  const customer: Customer = {
    id: generateId(),
    companyId: session.companyId,
    name: body.name,
    mobile: body.mobile,
    email: body.email,
    billingAddress: body.billingAddress,
    customerType: body.customerType || 'residential',
    notes: body.notes,
    createdAt: now,
  }

  const database = db()
  dbSave({ customers: [...database.customers, customer] })
  return Response.json(customer, { status: 201 })
}
