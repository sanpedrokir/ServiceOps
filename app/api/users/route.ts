import { getSession } from '@/lib/auth'
import { db, dbSave } from '@/lib/db'
import type { User } from '@/lib/types'
import { generateId } from '@/lib/utils'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const database = await db(session.companyId)
  return Response.json(database.users.map(({ passwordHash: _, ...u }) => u))
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['owner', 'admin'].includes(session.role)) return Response.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json()
  const database = await db(session.companyId)
  if (database.users.some(u => u.email.toLowerCase() === body.email.toLowerCase())) {
    return Response.json({ error: 'Email already exists' }, { status: 400 })
  }
  const passwordHash = await bcrypt.hash(body.password || 'Password123!', 10)
  const now = new Date().toISOString()
  const user: User = {
    id: generateId(), companyId: session.companyId, name: body.name,
    email: body.email.toLowerCase(), passwordHash, role: body.role || 'technician',
    skills: body.skills || [], isActive: true, phone: body.phone, createdAt: now,
  }
  await dbSave({ users: [user] })
  const { passwordHash: _, ...safe } = user
  return Response.json(safe, { status: 201 })
}
