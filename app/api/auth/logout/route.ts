import { COOKIE_NAME } from '@/lib/auth'

export async function POST() {
  const headers = new Headers()
  headers.append('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`)
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers })
}
