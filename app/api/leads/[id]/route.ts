import { getSession } from '@/lib/auth'
import { db, dbSave, dbDelete } from '@/lib/db'

export async function GET(_req: Request, ctx: RouteContext<'/api/leads/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const database = await db(session.companyId)
  const lead = database.leads.find(l => l.id === id)
  if (!lead) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(lead)
}

export async function PUT(request: Request, ctx: RouteContext<'/api/leads/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const database = await db(session.companyId)
  const lead = database.leads.find(l => l.id === id)
  if (!lead) return Response.json({ error: 'Not found' }, { status: 404 })
  const body = await request.json()
  const updated = { ...lead, ...body, id, companyId: session.companyId, updatedAt: new Date().toISOString() }
  await dbSave({ leads: [updated] })
  return Response.json(updated)
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/leads/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  await dbDelete('leads', id)
  return Response.json({ ok: true })
}
