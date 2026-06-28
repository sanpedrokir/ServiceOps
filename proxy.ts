import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'serviceops-secret-key-2026-change-in-prod')

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/')) ||
      pathname.startsWith('/_next') || pathname.startsWith('/favicon') ||
      pathname.startsWith('/manifest') || pathname.startsWith('/icon')) {
    return NextResponse.next()
  }

  const token = request.cookies.get('serviceops-auth')?.value

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const { payload } = await jwtVerify(token, SECRET)

    const role = payload.role as string
    if (role === 'technician' && !pathname.startsWith('/tech') && !pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL('/tech/my-jobs', request.url))
    }

    return NextResponse.next()
  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('serviceops-auth')
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
