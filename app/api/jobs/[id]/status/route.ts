import { getSession } from '@/lib/auth'
import { db, dbSave } from '@/lib/db'
import { JobStatus } from '@/lib/types'

const STATUS_TIMESTAMPS: Partial<Record<JobStatus, string>> = {
  en_route: 'enRoute',
  arrived: 'arrived',
  in_progress: 'started',
  completed: 'completed',
}

export async function PUT(request: Request, ctx: RouteContext<'/api/jobs/[id]/status'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const { status, ...extra } = await request.json()

  const database = db()
  const jobIdx = database.jobs.findIndex(j => j.id === id && j.companyId === session.companyId)
  if (jobIdx === -1) return Response.json({ error: 'Not found' }, { status: 404 })

  const job = database.jobs[jobIdx]

  if (session.role === 'technician' && !job.assignedTechnicians.includes(session.sub)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const now = new Date().toISOString()
  const timestamps = { ...job.timestamps }
  const tsKey = STATUS_TIMESTAMPS[status as JobStatus]
  if (tsKey) timestamps[tsKey as keyof typeof timestamps] = now

  const updated = { ...job, ...extra, status, timestamps, updatedAt: now }
  const jobs = [...database.jobs]
  jobs[jobIdx] = updated
  dbSave({ jobs })

  return Response.json(updated)
}
