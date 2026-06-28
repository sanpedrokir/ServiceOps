import { getSession } from '@/lib/auth'
import { db, dbSave } from '@/lib/db'
import { Site } from '@/lib/types'
import { generateId } from '@/lib/utils'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const customerId = searchParams.get('customerId')

  let sites = db().sites.filter(s => s.companyId === session.companyId)
  if (customerId) sites = sites.filter(s => s.customerId === customerId)
  return Response.json(sites)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const now = new Date().toISOString()
  const site: Site = {
    id: generateId(),
    companyId: session.companyId,
    customerId: body.customerId,
    address: body.address,
    unitNumber: body.unitNumber,
    accessInstructions: body.accessInstructions,
    parkingInstructions: body.parkingInstructions,
    contactPerson: body.contactPerson,
    contactPhone: body.contactPhone,
    preferredHours: body.preferredHours,
    notes: body.notes,
    mapLink: body.mapLink,
    siteType: body.siteType,
    createdAt: now,
  }

  const database = db()
  dbSave({ sites: [...database.sites, site] })
  return Response.json(site, { status: 201 })
}
