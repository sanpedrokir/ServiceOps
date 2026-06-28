import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { getSession } from '@/lib/auth'
import { db, dbSave } from '@/lib/db'
import type { Photo } from '@/lib/types'

export async function POST(request: Request, ctx: RouteContext<'/api/jobs/[id]/photos'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const database = db()
  const job = database.jobs.find(j => j.id === id && j.companyId === session.companyId)
  if (!job) return Response.json({ error: 'Not found' }, { status: 404 })

  const formData = await request.formData()
  const file = formData.get('photo') as File | null
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })

  const tag = (formData.get('tag') as Photo['tag']) || 'after'
  const caption = (formData.get('caption') as string) || ''

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const photoId = `ph_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const filename = `${photoId}.${ext}`
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'jobs', id)

  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true })
  writeFileSync(join(uploadDir, filename), buffer)

  const photo: Photo = {
    id: photoId,
    url: `/uploads/jobs/${id}/${filename}`,
    caption,
    tag,
    takenAt: new Date().toISOString(),
  }

  const photos = [...(job.photos || []), photo]
  const jobs = database.jobs.map(j => j.id === id ? { ...j, photos, updatedAt: new Date().toISOString() } : j)
  dbSave({ jobs })

  return Response.json(photo)
}

export async function DELETE(request: Request, ctx: RouteContext<'/api/jobs/[id]/photos'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const { photoId } = await request.json()

  const database = db()
  const job = database.jobs.find(j => j.id === id && j.companyId === session.companyId)
  if (!job) return Response.json({ error: 'Not found' }, { status: 404 })

  const photos = (job.photos || []).filter(p => p.id !== photoId)
  const jobs = database.jobs.map(j => j.id === id ? { ...j, photos, updatedAt: new Date().toISOString() } : j)
  dbSave({ jobs })

  return Response.json({ ok: true })
}
