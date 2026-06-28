import { getSession } from '@/lib/auth'
import { db, dbSave, dbDelete } from '@/lib/db'

export async function GET(_req: Request, ctx: RouteContext<'/api/customers/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const database = await db(session.companyId)
  const customer = database.customers.find(c => c.id === id)
  if (!customer) return Response.json({ error: 'Not found' }, { status: 404 })
  const sites = database.sites.filter(s => s.customerId === id)
  const jobs = database.jobs.filter(j => j.customerId === id)
  const invoices = database.invoices.filter(i => i.customerId === id)
  const assets = database.assets.filter(a => a.customerId === id)
  return Response.json({ ...customer, sites, jobs, invoices, assets })
}

export async function PUT(request: Request, ctx: RouteContext<'/api/customers/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const database = await db(session.companyId)
  const customer = database.customers.find(c => c.id === id)
  if (!customer) return Response.json({ error: 'Not found' }, { status: 404 })
  const body = await request.json()
  const updated = { ...customer, ...body, id, companyId: session.companyId }
  await dbSave({ customers: [updated] })
  return Response.json(updated)
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/customers/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['owner', 'admin'].includes(session.role)) return Response.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await ctx.params
  await dbDelete('customers', id)
  return Response.json({ ok: true })
}
