import { getSession } from '@/lib/auth'
import { db, dbSave } from '@/lib/db'

export async function GET(_req: Request, ctx: RouteContext<'/api/sites/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const site = db().sites.find(s => s.id === id && s.companyId === session.companyId)
  if (!site) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(site)
}

export async function PUT(request: Request, ctx: RouteContext<'/api/sites/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const database = db()
  const idx = database.sites.findIndex(s => s.id === id && s.companyId === session.companyId)
  if (idx === -1) return Response.json({ error: 'Not found' }, { status: 404 })
  const body = await request.json()
  const updated = { ...database.sites[idx], ...body, id, companyId: session.companyId }
  const sites = [...database.sites]
  sites[idx] = updated
  dbSave({ sites })
  return Response.json(updated)
}
