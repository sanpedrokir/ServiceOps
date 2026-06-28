import { getSession } from '@/lib/auth'
import { db, dbSave } from '@/lib/db'

export async function GET(_req: Request, ctx: RouteContext<'/api/customers/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const database = db()
  const customer = database.customers.find(c => c.id === id && c.companyId === session.companyId)
  if (!customer) return Response.json({ error: 'Not found' }, { status: 404 })

  const sites = database.sites.filter(s => s.customerId === id)
  const assets = database.assets.filter(a => a.customerId === id)
  const jobs = database.jobs.filter(j => j.customerId === id)
  const quotes = database.quotes.filter(q => q.customerId === id)
  const invoices = database.invoices.filter(i => i.customerId === id)

  return Response.json({ ...customer, sites, assets, jobs, quotes, invoices })
}

export async function PUT(request: Request, ctx: RouteContext<'/api/customers/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const database = db()
  const idx = database.customers.findIndex(c => c.id === id && c.companyId === session.companyId)
  if (idx === -1) return Response.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const updated = { ...database.customers[idx], ...body, id, companyId: session.companyId }
  const customers = [...database.customers]
  customers[idx] = updated
  dbSave({ customers })
  return Response.json(updated)
}
