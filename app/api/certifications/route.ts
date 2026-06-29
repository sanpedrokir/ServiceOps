import { getSession } from '@/lib/auth'
import { neon } from '@neondatabase/serverless'
import type { Certification } from '@/lib/types'
import { generateId } from '@/lib/utils'

function sql() { return neon(process.env.DATABASE_URL!) }

function r(row: Record<string, unknown>): Certification {
  return {
    id: row.id as string, companyId: row.company_id as string,
    userId: row.user_id as string, name: row.name as string,
    certNumber: row.cert_number as string | undefined,
    issuingBody: row.issuing_body as string | undefined,
    issuedDate: row.issued_date as string | undefined,
    expiryDate: row.expiry_date as string | undefined,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
  }
}

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const db = sql()
  const rows = await db`SELECT * FROM certifications WHERE company_id = ${session.companyId} ORDER BY expiry_date ASC NULLS LAST`
  return Response.json(rows.map(r))
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['owner', 'admin'].includes(session.role)) return Response.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json()
  const db = sql()
  const cert: Certification = {
    id: generateId(), companyId: session.companyId, userId: body.userId,
    name: body.name, certNumber: body.certNumber, issuingBody: body.issuingBody,
    issuedDate: body.issuedDate, expiryDate: body.expiryDate, notes: body.notes,
    createdAt: new Date().toISOString(),
  }
  await db`
    INSERT INTO certifications (id, company_id, user_id, name, cert_number, issuing_body, issued_date, expiry_date, notes, created_at)
    VALUES (${cert.id}, ${cert.companyId}, ${cert.userId}, ${cert.name}, ${cert.certNumber ?? null},
            ${cert.issuingBody ?? null}, ${cert.issuedDate ?? null}, ${cert.expiryDate ?? null},
            ${cert.notes ?? null}, ${cert.createdAt})
  `
  return Response.json(cert, { status: 201 })
}
