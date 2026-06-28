import { getSession } from '@/lib/auth'
import { db, dbSave, nextSequence } from '@/lib/db'
import { Job } from '@/lib/types'
import { generateId } from '@/lib/utils'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const techId = searchParams.get('techId')
  const date = searchParams.get('date')
  const customerId = searchParams.get('customerId')

  let jobs = db().jobs.filter(j => j.companyId === session.companyId)

  if (session.role === 'technician') {
    jobs = jobs.filter(j => j.assignedTechnicians.includes(session.sub))
  }

  if (status) jobs = jobs.filter(j => j.status === status)
  if (techId) jobs = jobs.filter(j => j.assignedTechnicians.includes(techId))
  if (date) jobs = jobs.filter(j => j.appointmentDate === date)
  if (customerId) jobs = jobs.filter(j => j.customerId === customerId)

  jobs = jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return Response.json(jobs)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['owner', 'admin', 'dispatcher'].includes(session.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const seq = nextSequence('job')
  const database = db()
  const company = database.companies.find(c => c.id === session.companyId)

  const now = new Date().toISOString()
  const job: Job = {
    id: generateId(),
    jobNumber: `${company?.jobPrefix || 'JOB-'}${seq}`,
    companyId: session.companyId,
    customerId: body.customerId,
    siteId: body.siteId,
    assetIds: body.assetIds || [],
    leadId: body.leadId,
    quoteId: body.quoteId,
    jobType: body.jobType || 'repair',
    tradeType: body.tradeType || 'aircon',
    priority: body.priority || 'normal',
    status: 'scheduled',
    title: body.title,
    description: body.description,
    appointmentDate: body.appointmentDate,
    appointmentTime: body.appointmentTime,
    estimatedDuration: body.estimatedDuration,
    assignedTechnicians: body.assignedTechnicians || [],
    internalNotes: body.internalNotes,
    partsUsed: [],
    timestamps: body.assignedTechnicians?.length ? { assigned: now } : {},
    photos: [],
    checklistData: {},
    requiresFollowUp: false,
    hasSafetyIssue: false,
    createdAt: now,
    updatedAt: now,
  }

  if (job.assignedTechnicians.length > 0) job.status = 'assigned'

  const allJobs = [...database.jobs, job]
  dbSave({ jobs: allJobs })

  return Response.json(job, { status: 201 })
}
