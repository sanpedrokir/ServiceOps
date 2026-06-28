import { getSession } from '@/lib/auth'
import { db, dbSave } from '@/lib/db'

export async function GET(_req: Request, ctx: RouteContext<'/api/invoices/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const database = db()
  const invoice = database.invoices.find(i => i.id === id && i.companyId === session.companyId)
  if (!invoice) return Response.json({ error: 'Not found' }, { status: 404 })

  const customer = database.customers.find(c => c.id === invoice.customerId)
  const job = invoice.jobId ? database.jobs.find(j => j.id === invoice.jobId) : null
  return Response.json({ ...invoice, customer, job })
}

export async function PUT(request: Request, ctx: RouteContext<'/api/invoices/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const database = db()
  const idx = database.invoices.findIndex(i => i.id === id && i.companyId === session.companyId)
  if (idx === -1) return Response.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const updated = { ...database.invoices[idx], ...body, id, companyId: session.companyId, updatedAt: new Date().toISOString() }
  const invoices = [...database.invoices]
  invoices[idx] = updated
  dbSave({ invoices })
  return Response.json(updated)
}
