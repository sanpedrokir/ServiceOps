import { getSession } from '@/lib/auth'
import { db, dbSave } from '@/lib/db'

export async function GET(_req: Request, ctx: RouteContext<'/api/quotes/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const database = await db(session.companyId)
  const quote = database.quotes.find(q => q.id === id)
  if (!quote) return Response.json({ error: 'Not found' }, { status: 404 })
  const customer = database.customers.find(c => c.id === quote.customerId)
  const site = quote.siteId ? database.sites.find(s => s.id === quote.siteId) : null
  return Response.json({ ...quote, customer, site })
}

export async function PUT(request: Request, ctx: RouteContext<'/api/quotes/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const database = await db(session.companyId)
  const quote = database.quotes.find(q => q.id === id)
  if (!quote) return Response.json({ error: 'Not found' }, { status: 404 })
  const body = await request.json()
  const updated = { ...quote, ...body, id, companyId: session.companyId, updatedAt: new Date().toISOString() }
  await dbSave({ quotes: [updated] })
  return Response.json(updated)
}
