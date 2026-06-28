import { getSession } from '@/lib/auth'
import { db, dbSave } from '@/lib/db'
import { User } from '@/lib/types'
import { generateId } from '@/lib/utils'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const users = db().users
    .filter(u => u.companyId === session.companyId)
    .map(({ passwordHash: _, ...u }) => u)
  return Response.json(users)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['owner', 'admin'].includes(session.role)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const database = db()

  if (database.users.some(u => u.email.toLowerCase() === body.email.toLowerCase())) {
    return Response.json({ error: 'Email already exists' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(body.password || 'Password123!', 10)
  const now = new Date().toISOString()
  const user: User = {
    id: generateId(),
    companyId: session.companyId,
    name: body.name,
    email: body.email.toLowerCase(),
    passwordHash,
    role: body.role || 'technician',
    skills: body.skills || [],
    isActive: true,
    phone: body.phone,
    createdAt: now,
  }

  dbSave({ users: [...database.users, user] })
  const { passwordHash: _, ...safe } = user
  return Response.json(safe, { status: 201 })
}
