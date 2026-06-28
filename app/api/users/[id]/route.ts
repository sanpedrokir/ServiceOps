import { getSession } from '@/lib/auth'
import { db, dbSave } from '@/lib/db'

export async function PUT(request: Request, ctx: RouteContext<'/api/users/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['owner', 'admin'].includes(session.role)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await ctx.params
  const database = db()
  const idx = database.users.findIndex(u => u.id === id && u.companyId === session.companyId)
  if (idx === -1) return Response.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const { passwordHash: _, password, ...updates } = body
  const updated = { ...database.users[idx], ...updates, id, companyId: session.companyId }
  const users = [...database.users]
  users[idx] = updated
  dbSave({ users })

  const { passwordHash: __, ...safe } = updated
  return Response.json(safe)
}
