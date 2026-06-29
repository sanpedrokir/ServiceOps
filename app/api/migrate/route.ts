import { neon } from '@neondatabase/serverless'

// One-time migration endpoint — creates tables added after initial schema
// Call: POST /api/migrate?secret=seed_serviceops_demo

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== 'seed_serviceops_demo') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const sql = neon(process.env.DATABASE_URL!)

  await sql`
    CREATE TABLE IF NOT EXISTS certifications (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id),
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      cert_number TEXT,
      issuing_body TEXT,
      issued_date TEXT,
      expiry_date TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    )
  `

  return Response.json({ ok: true, created: ['certifications'] })
}
