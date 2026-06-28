import { getSession } from '@/lib/auth'
import { db, dbSave, dbDelete } from '@/lib/db'

export async function PUT(request: Request, ctx: RouteContext<'/api/checklists/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['owner', 'admin'].includes(session.role)) return Response.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await ctx.params
  const database = await db(session.companyId)
  const template = (database.checklistTemplates || []).find(t => t.id === id)
  if (!template) return Response.json({ error: 'Not found' }, { status: 404 })
  const body = await request.json()
  const updated = { ...template, ...body, id, companyId: session.companyId, updatedAt: new Date().toISOString() }
  await dbSave({ checklistTemplates: [updated] })
  return Response.json(updated)
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/checklists/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['owner', 'admin'].includes(session.role)) return Response.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await ctx.params
  const database = await db(session.companyId)
  const template = (database.checklistTemplates || []).find(t => t.id === id)
  if (!template) return Response.json({ error: 'Not found' }, { status: 404 })
  if (template.isDefault) return Response.json({ error: 'Cannot delete a default template' }, { status: 400 })
  await dbDelete('checklist_templates', id)
  return Response.json({ ok: true })
}
