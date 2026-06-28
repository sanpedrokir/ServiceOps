import { getSession } from '@/lib/auth'
import { db, dbSave, dbDelete } from '@/lib/db'

export async function GET(_req: Request, ctx: RouteContext<'/api/sites/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const database = await db(session.companyId)
  const site = database.sites.find(s => s.id === id)
  if (!site) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(site)
}

export async function PUT(request: Request, ctx: RouteContext<'/api/sites/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const database = await db(session.companyId)
  const site = database.sites.find(s => s.id === id)
  if (!site) return Response.json({ error: 'Not found' }, { status: 404 })
  const body = await request.json()
  const updated = { ...site, ...body, id, companyId: session.companyId }
  await dbSave({ sites: [updated] })
  return Response.json(updated)
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/sites/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  await dbDelete('sites', id)
  return Response.json({ ok: true })
}
