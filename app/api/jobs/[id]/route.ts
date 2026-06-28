import { getSession } from '@/lib/auth'
import { db, dbSave } from '@/lib/db'

export async function GET(_req: Request, ctx: RouteContext<'/api/jobs/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const database = db()
  const job = database.jobs.find(j => j.id === id && j.companyId === session.companyId)
  if (!job) return Response.json({ error: 'Not found' }, { status: 404 })

  if (session.role === 'technician' && !job.assignedTechnicians.includes(session.sub)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const customer = database.customers.find(c => c.id === job.customerId)
  const site = job.siteId ? database.sites.find(s => s.id === job.siteId) : null
  const assets = database.assets.filter(a => job.assetIds.includes(a.id))
  const technicians = database.users.filter(u => job.assignedTechnicians.includes(u.id))

  return Response.json({ ...job, customer, site, assets, technicians })
}

export async function PUT(request: Request, ctx: RouteContext<'/api/jobs/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const database = db()
  const jobIdx = database.jobs.findIndex(j => j.id === id && j.companyId === session.companyId)
  if (jobIdx === -1) return Response.json({ error: 'Not found' }, { status: 404 })

  const job = database.jobs[jobIdx]
  if (session.role === 'technician' && !job.assignedTechnicians.includes(session.sub)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const updated = { ...job, ...body, id: job.id, companyId: job.companyId, updatedAt: new Date().toISOString() }
  const jobs = [...database.jobs]
  jobs[jobIdx] = updated
  dbSave({ jobs })

  return Response.json(updated)
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/jobs/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['owner', 'admin'].includes(session.role)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await ctx.params
  const database = db()
  const jobs = database.jobs.filter(j => !(j.id === id && j.companyId === session.companyId))
  dbSave({ jobs })
  return Response.json({ ok: true })
}
