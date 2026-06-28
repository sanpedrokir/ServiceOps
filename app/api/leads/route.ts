import { getSession } from '@/lib/auth'
import { db, dbSave } from '@/lib/db'
import type { Lead } from '@/lib/types'
import { generateId } from '@/lib/utils'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const database = await db(session.companyId)
  return Response.json(database.leads)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const now = new Date().toISOString()
  const lead: Lead = {
    id: generateId(), companyId: session.companyId, contactName: body.contactName,
    contactPhone: body.contactPhone, contactEmail: body.contactEmail,
    source: body.source || 'phone', tradeType: body.tradeType || 'aircon',
    urgency: body.urgency || 'normal', description: body.description, status: 'new',
    assignedTo: body.assignedTo || session.sub, notes: body.notes,
    createdAt: now, updatedAt: now,
  }
  await dbSave({ leads: [lead] })
  return Response.json(lead, { status: 201 })
}
