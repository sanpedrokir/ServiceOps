import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { getUserByEmail } from '@/lib/db'
import { createToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 })
    }

    const user = await getUserByEmail(email)

    if (!user) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = await createToken({
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
      name: user.name,
    })

    const body = JSON.stringify({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.companyId },
    })

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 3600}`,
      },
    })
  } catch (e) {
    console.error('Login error:', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
