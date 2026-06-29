import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from') || getWeekStart()
  const to = searchParams.get('to') || getWeekEnd()

  const database = await db(session.companyId)
  const technicians = database.users.filter(u => u.role === 'technician' && u.isActive)

  const periodJobs = database.jobs.filter(j => {
    const date = j.timestamps?.completed ? j.timestamps.completed.split('T')[0] : j.appointmentDate
    return date && date >= from && date <= to && ['completed', 'invoiced', 'paid'].includes(j.status)
  })

  const techSheets = technicians.map(tech => {
    const entries = periodJobs
      .filter(j => j.assignedTechnicians.includes(tech.id))
      .map(j => {
        let hours = j.labourHours || 0
        if (!hours && j.timestamps?.arrived && j.timestamps?.completed) {
          const diff = new Date(j.timestamps.completed).getTime() - new Date(j.timestamps.arrived).getTime()
          hours = parseFloat((diff / 3600000).toFixed(2))
        }
        const customer = database.customers.find(c => c.id === j.customerId)
        return {
          jobId: j.id, jobNumber: j.jobNumber, title: j.title,
          date: j.appointmentDate || j.timestamps?.completed?.split('T')[0] || '',
          arrivedAt: j.timestamps?.arrived || null,
          completedAt: j.timestamps?.completed || null,
          hours, tradeType: j.tradeType, jobType: j.jobType,
          customerName: customer?.name || '—',
          status: j.status,
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    const totalHours = parseFloat(entries.reduce((s, e) => s + e.hours, 0).toFixed(2))
    const jobCount = entries.length

    return { technician: { id: tech.id, name: tech.name, email: tech.email, phone: tech.phone }, entries, totalHours, jobCount }
  }).filter(t => t.entries.length > 0)

  const grandTotal = parseFloat(techSheets.reduce((s, t) => s + t.totalHours, 0).toFixed(2))
  const totalJobs = techSheets.reduce((s, t) => s + t.jobCount, 0)

  return Response.json({ from, to, techSheets, grandTotal, totalJobs })
}

function getWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff)).toISOString().split('T')[0]
}

function getWeekEnd(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? 0 : 7)
  return new Date(d.setDate(diff)).toISOString().split('T')[0]
}
