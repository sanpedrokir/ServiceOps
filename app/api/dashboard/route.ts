import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const database = await db(session.companyId)
  const today = new Date().toISOString().split('T')[0]

  const jobs = database.jobs
  const invoices = database.invoices
  const quotes = database.quotes
  const leads = database.leads

  const todayJobs = jobs.filter(j => j.appointmentDate === today)
  const completedToday = todayJobs.filter(j => j.status === 'completed')
  const activeJobs = jobs.filter(j => ['scheduled', 'assigned', 'en_route', 'arrived', 'in_progress'].includes(j.status))
  const urgentJobs = jobs.filter(j => j.priority === 'urgent' && !['completed', 'cancelled', 'paid'].includes(j.status))
  const unassigned = jobs.filter(j => j.status === 'scheduled' && j.assignedTechnicians.length === 0)

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const monthPaidInvoices = invoices.filter(i => i.paymentStatus === 'paid' && i.paidAt && i.paidAt >= startOfMonth)
  const revenueThisMonth = monthPaidInvoices.reduce((sum, i) => sum + i.total, 0)

  const outstandingInvoices = invoices.filter(i => ['sent', 'partially_paid'].includes(i.paymentStatus))
  const outstandingValue = outstandingInvoices.reduce((sum, i) => sum + i.amountDue, 0)
  const overdueInvoices = invoices.filter(i => i.paymentStatus === 'overdue')
  const overdueValue = overdueInvoices.reduce((sum, i) => sum + i.amountDue, 0)

  const pendingQuotes = quotes.filter(q => ['sent', 'viewed'].includes(q.status))
  const approvedQuotes = quotes.filter(q => q.status === 'approved').length
  const totalQuotes = quotes.filter(q => q.status !== 'draft').length
  const conversionRate = totalQuotes > 0 ? Math.round((approvedQuotes / totalQuotes) * 100) : 0

  const technicians = database.users.filter(u => u.role === 'technician' && u.isActive)
  const techStats = technicians.map(t => {
    const assigned = jobs.filter(j => j.assignedTechnicians.includes(t.id))
    const completedCount = assigned.filter(j => ['completed', 'invoiced', 'paid'].includes(j.status)).length
    return { id: t.id, name: t.name, assigned: assigned.length, completed: completedCount }
  })

  const openLeads = leads.filter(l => ['new', 'contacted', 'site_visit'].includes(l.status)).length

  return Response.json({
    todayJobsCount: todayJobs.length,
    completedTodayCount: completedToday.length,
    activeJobsCount: activeJobs.length,
    urgentJobsCount: urgentJobs.length,
    unassignedCount: unassigned.length,
    revenueThisMonth,
    outstandingValue,
    overdueValue,
    overdueCount: overdueInvoices.length,
    pendingQuotesCount: pendingQuotes.length,
    pendingQuotesValue: pendingQuotes.reduce((s, q) => s + q.total, 0),
    quoteConversionRate: conversionRate,
    techStats,
    openLeadsCount: openLeads,
    recentJobs: jobs.slice(-5).reverse(),
  })
}
