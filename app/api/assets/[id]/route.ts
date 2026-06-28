import { getSession } from '@/lib/auth'
import { db, dbSave, dbDelete } from '@/lib/db'

export async function GET(_req: Request, ctx: RouteContext<'/api/assets/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const database = await db(session.companyId)
  const asset = database.assets.find(a => a.id === id)
  if (!asset) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(asset)
}

export async function PUT(request: Request, ctx: RouteContext<'/api/assets/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const database = await db(session.companyId)
  const asset = database.assets.find(a => a.id === id)
  if (!asset) return Response.json({ error: 'Not found' }, { status: 404 })
  const body = await request.json()
  const updated = { ...asset, ...body, id, companyId: session.companyId }
  await dbSave({ assets: [updated] })
  return Response.json(updated)
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/assets/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  await dbDelete('assets', id)
  return Response.json({ ok: true })
}
