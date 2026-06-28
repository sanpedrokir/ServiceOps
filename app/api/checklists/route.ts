import { getSession } from '@/lib/auth'
import { db, dbSave } from '@/lib/db'
import type { ChecklistTemplate } from '@/lib/types'
import { generateId } from '@/lib/utils'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const database = await db(session.companyId)
  return Response.json(database.checklistTemplates || [])
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['owner', 'admin'].includes(session.role)) return Response.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json()
  const now = new Date().toISOString()
  const template: ChecklistTemplate = {
    id: generateId(), companyId: session.companyId, name: body.name,
    tradeType: body.tradeType, jobType: body.jobType || undefined,
    items: body.items || [], isDefault: false, createdAt: now, updatedAt: now,
  }
  await dbSave({ checklistTemplates: [template] })
  return Response.json(template, { status: 201 })
}
