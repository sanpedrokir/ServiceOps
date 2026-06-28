import { getSession } from '@/lib/auth'
import { db, dbSave } from '@/lib/db'
import type { JobStatus } from '@/lib/types'

const STATUS_TIMESTAMPS: Partial<Record<JobStatus, string>> = {
  en_route: 'enRoute', arrived: 'arrived', in_progress: 'started', completed: 'completed',
}

export async function PUT(request: Request, ctx: RouteContext<'/api/jobs/[id]/status'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const { status, ...extra } = await request.json()

  const database = await db(session.companyId)
  const job = database.jobs.find(j => j.id === id)
  if (!job) return Response.json({ error: 'Not found' }, { status: 404 })

  if (session.role === 'technician' && !job.assignedTechnicians.includes(session.sub)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const now = new Date().toISOString()
  const timestamps = { ...job.timestamps }
  const tsKey = STATUS_TIMESTAMPS[status as JobStatus]
  if (tsKey) timestamps[tsKey as keyof typeof timestamps] = now

  const updated = { ...job, ...extra, status, timestamps, updatedAt: now }
  await dbSave({ jobs: [updated] })
  return Response.json(updated)
}
