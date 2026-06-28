import { getSession } from '@/lib/auth'
import { db, dbSave } from '@/lib/db'

export async function GET(_req: Request, ctx: RouteContext<'/api/leads/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const lead = db().leads.find(l => l.id === id && l.companyId === session.companyId)
  if (!lead) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(lead)
}

export async function PUT(request: Request, ctx: RouteContext<'/api/leads/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const database = db()
  const idx = database.leads.findIndex(l => l.id === id && l.companyId === session.companyId)
  if (idx === -1) return Response.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const updated = { ...database.leads[idx], ...body, id, companyId: session.companyId, updatedAt: new Date().toISOString() }
  const leads = [...database.leads]
  leads[idx] = updated
  dbSave({ leads })
  return Response.json(updated)
}
