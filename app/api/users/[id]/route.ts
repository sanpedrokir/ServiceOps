import { getSession } from '@/lib/auth'
import { db, dbSave } from '@/lib/db'

export async function PUT(request: Request, ctx: RouteContext<'/api/users/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['owner', 'admin'].includes(session.role)) return Response.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await ctx.params
  const database = await db(session.companyId)
  const user = database.users.find(u => u.id === id)
  if (!user) return Response.json({ error: 'Not found' }, { status: 404 })
  const body = await request.json()
  const { passwordHash: _, password, ...updates } = body
  const updated = { ...user, ...updates, id, companyId: session.companyId }
  await dbSave({ users: [updated] })
  const { passwordHash: __, ...safe } = updated
  return Response.json(safe)
}
