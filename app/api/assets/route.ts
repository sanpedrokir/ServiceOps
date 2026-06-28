import { getSession } from '@/lib/auth'
import { db, dbSave } from '@/lib/db'
import { Asset } from '@/lib/types'
import { generateId } from '@/lib/utils'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const siteId = searchParams.get('siteId')
  const customerId = searchParams.get('customerId')

  let assets = db().assets.filter(a => a.companyId === session.companyId)
  if (siteId) assets = assets.filter(a => a.siteId === siteId)
  if (customerId) assets = assets.filter(a => a.customerId === customerId)
  return Response.json(assets)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const now = new Date().toISOString()
  const asset: Asset = {
    id: generateId(),
    companyId: session.companyId,
    siteId: body.siteId,
    customerId: body.customerId,
    tradeType: body.tradeType || 'aircon',
    category: body.category,
    brand: body.brand,
    model: body.model,
    serialNumber: body.serialNumber,
    installationDate: body.installationDate,
    warrantyExpiry: body.warrantyExpiry,
    location: body.location,
    lastServiceDate: body.lastServiceDate,
    nextServiceDate: body.nextServiceDate,
    notes: body.notes,
    createdAt: now,
  }

  const database = db()
  dbSave({ assets: [...database.assets, asset] })
  return Response.json(asset, { status: 201 })
}
