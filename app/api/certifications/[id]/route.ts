import { getSession } from '@/lib/auth'
import { neon } from '@neondatabase/serverless'

function sql() { return neon(process.env.DATABASE_URL!) }

export async function PUT(request: Request, ctx: RouteContext<'/api/certifications/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['owner', 'admin'].includes(session.role)) return Response.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await ctx.params
  const body = await request.json()
  const db = sql()
  await db`
    UPDATE certifications SET
      name = ${body.name}, cert_number = ${body.certNumber ?? null},
      issuing_body = ${body.issuingBody ?? null}, issued_date = ${body.issuedDate ?? null},
      expiry_date = ${body.expiryDate ?? null}, notes = ${body.notes ?? null}
    WHERE id = ${id} AND company_id = ${session.companyId}
  `
  return Response.json({ ok: true })
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/certifications/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['owner', 'admin'].includes(session.role)) return Response.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await ctx.params
  const db = sql()
  await db`DELETE FROM certifications WHERE id = ${id} AND company_id = ${session.companyId}`
  return Response.json({ ok: true })
}
