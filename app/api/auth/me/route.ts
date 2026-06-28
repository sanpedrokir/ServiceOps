import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const database = db()
  const user = database.users.find(u => u.id === session.sub)
  const company = database.companies.find(c => c.id === session.companyId)

  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  return Response.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.companyId, phone: user.phone },
    company: company ? { id: company.id, name: company.name, currency: company.currency } : null,
  })
}
