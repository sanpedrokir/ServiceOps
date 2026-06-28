import { getSession } from '@/lib/auth'
import { db, dbSave } from '@/lib/db'
import type { ChecklistTemplate } from '@/lib/types'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const database = db()
  const templates = (database.checklistTemplates || []).filter(t => t.companyId === session.companyId)
  return Response.json(templates)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['owner', 'admin'].includes(session.role)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const database = db()

  const template: ChecklistTemplate = {
    id: `ct_${Date.now()}`,
    companyId: session.companyId,
    name: body.name,
    tradeType: body.tradeType,
    jobType: body.jobType || undefined,
    items: body.items || [],
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const checklistTemplates = [...(database.checklistTemplates || []), template]
  dbSave({ checklistTemplates })
  return Response.json(template, { status: 201 })
}
