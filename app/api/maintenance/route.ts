import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const database = await db(session.companyId)
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const enriched = database.assets
    .filter(a => a.nextServiceDate)
    .map(a => {
      const customer = database.customers.find(c => c.id === a.customerId)
      const site = database.sites.find(s => s.id === a.siteId)
      const serviceJobs = database.jobs
        .filter(j => j.assetIds.includes(a.id) && ['completed', 'invoiced', 'paid'].includes(j.status))
        .sort((a, b) => (b.appointmentDate || '').localeCompare(a.appointmentDate || ''))

      const nextDate = new Date(a.nextServiceDate!)
      const daysUntil = Math.round((nextDate.getTime() - today.getTime()) / 86400000)

      const status: 'overdue' | 'due_soon' | 'upcoming' | 'ok' =
        daysUntil < 0 ? 'overdue' :
        daysUntil <= 14 ? 'due_soon' :
        daysUntil <= 60 ? 'upcoming' : 'ok'

      return { ...a, customer, site, serviceJobs, daysUntil, status }
    })
    .sort((a, b) => (a.nextServiceDate || '').localeCompare(b.nextServiceDate || ''))

  const counts = {
    overdue: enriched.filter(a => a.status === 'overdue').length,
    dueSoon: enriched.filter(a => a.status === 'due_soon').length,
    upcoming: enriched.filter(a => a.status === 'upcoming').length,
    ok: enriched.filter(a => a.status === 'ok').length,
    total: enriched.length,
  }

  // Assets with no nextServiceDate
  const unscheduled = database.assets.filter(a => !a.nextServiceDate).map(a => ({
    ...a,
    customer: database.customers.find(c => c.id === a.customerId),
    site: database.sites.find(s => s.id === a.siteId),
    serviceJobs: database.jobs.filter(j => j.assetIds.includes(a.id) && ['completed', 'invoiced', 'paid'].includes(j.status)),
    daysUntil: null,
    status: 'unscheduled' as const,
  }))

  return Response.json({ assets: enriched, unscheduled, counts, today: todayStr })
}
