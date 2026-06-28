import { getSession } from '@/lib/auth'
import { db, dbSave } from '@/lib/db'
import type { Customer } from '@/lib/types'
import { generateId } from '@/lib/utils'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const database = await db(session.companyId)
  return Response.json(database.customers)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['owner', 'admin'].includes(session.role)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const now = new Date().toISOString()
  const customer: Customer = {
    id: generateId(), companyId: session.companyId, name: body.name,
    mobile: body.mobile, email: body.email, billingAddress: body.billingAddress,
    customerType: body.customerType || 'residential', notes: body.notes, createdAt: now,
  }
  await dbSave({ customers: [customer] })
  return Response.json(customer, { status: 201 })
}
