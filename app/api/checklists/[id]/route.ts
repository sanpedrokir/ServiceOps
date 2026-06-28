import { getSession } from '@/lib/auth'
import { db, dbSave } from '@/lib/db'

export async function PUT(request: Request, ctx: RouteContext<'/api/checklists/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['owner', 'admin'].includes(session.role)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await ctx.params
  const database = db()
  const idx = (database.checklistTemplates || []).findIndex(t => t.id === id && t.companyId === session.companyId)
  if (idx === -1) return Response.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const templates = [...(database.checklistTemplates || [])]
  templates[idx] = { ...templates[idx], ...body, id, companyId: session.companyId, updatedAt: new Date().toISOString() }
  dbSave({ checklistTemplates: templates })
  return Response.json(templates[idx])
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/checklists/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['owner', 'admin'].includes(session.role)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await ctx.params
  const database = db()
  const template = (database.checklistTemplates || []).find(t => t.id === id && t.companyId === session.companyId)
  if (!template) return Response.json({ error: 'Not found' }, { status: 404 })
  if (template.isDefault) return Response.json({ error: 'Cannot delete a default template' }, { status: 400 })

  const checklistTemplates = (database.checklistTemplates || []).filter(t => !(t.id === id && t.companyId === session.companyId))
  dbSave({ checklistTemplates })
  return Response.json({ ok: true })
}
