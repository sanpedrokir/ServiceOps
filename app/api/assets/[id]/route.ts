import { getSession } from '@/lib/auth'
import { db, dbSave } from '@/lib/db'

export async function GET(_req: Request, ctx: RouteContext<'/api/assets/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const asset = db().assets.find(a => a.id === id && a.companyId === session.companyId)
  if (!asset) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(asset)
}

export async function PUT(request: Request, ctx: RouteContext<'/api/assets/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const database = db()
  const idx = database.assets.findIndex(a => a.id === id && a.companyId === session.companyId)
  if (idx === -1) return Response.json({ error: 'Not found' }, { status: 404 })
  const body = await request.json()
  const updated = { ...database.assets[idx], ...body, id, companyId: session.companyId }
  const assets = [...database.assets]
  assets[idx] = updated
  dbSave({ assets })
  return Response.json(updated)
}
