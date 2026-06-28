import { neon } from '@neondatabase/serverless'
import type { Company, User, Customer, Site, Asset, Lead, Job, Quote, Invoice, ChecklistTemplate, Database } from './types'

const sql = neon(process.env.DATABASE_URL!)

// snake_case → camelCase row mapper
function r<T>(row: Record<string, unknown>): T {
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), v])
  ) as T
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await sql`SELECT * FROM users WHERE LOWER(email) = LOWER(${email}) AND is_active = true LIMIT 1`
  return rows[0] ? r<User>(rows[0]) : null
}

export async function db(companyId: string): Promise<Database> {
  const [companies, users, customers, sites, assets, leads, jobs, quotes, invoices, templates, seqs] = await Promise.all([
    sql`SELECT * FROM companies WHERE id = ${companyId}`,
    sql`SELECT * FROM users WHERE company_id = ${companyId}`,
    sql`SELECT * FROM customers WHERE company_id = ${companyId} ORDER BY name`,
    sql`SELECT * FROM sites WHERE company_id = ${companyId}`,
    sql`SELECT * FROM assets WHERE company_id = ${companyId}`,
    sql`SELECT * FROM leads WHERE company_id = ${companyId} ORDER BY created_at DESC`,
    sql`SELECT * FROM jobs WHERE company_id = ${companyId} ORDER BY created_at DESC`,
    sql`SELECT * FROM quotes WHERE company_id = ${companyId} ORDER BY created_at DESC`,
    sql`SELECT * FROM invoices WHERE company_id = ${companyId} ORDER BY created_at DESC`,
    sql`SELECT * FROM checklist_templates WHERE company_id = ${companyId}`,
    sql`SELECT key, value FROM sequences WHERE company_id = ${companyId}`,
  ])
  return {
    companies: companies.map(row => r<Company>(row)),
    users: users.map(row => r<User>(row)),
    customers: customers.map(row => r<Customer>(row)),
    sites: sites.map(row => r<Site>(row)),
    assets: assets.map(row => r<Asset>(row)),
    leads: leads.map(row => r<Lead>(row)),
    jobs: jobs.map(row => r<Job>(row)),
    quotes: quotes.map(row => r<Quote>(row)),
    invoices: invoices.map(row => r<Invoice>(row)),
    checklistTemplates: templates.map(row => r<ChecklistTemplate>(row)),
    sequences: Object.fromEntries(seqs.map(s => [s.key as string, Number(s.value)])),
  }
}

export async function nextSequence(companyId: string, key: string): Promise<number> {
  const rows = await sql`
    INSERT INTO sequences (company_id, key, value) VALUES (${companyId}, ${key}, 1001)
    ON CONFLICT (company_id, key) DO UPDATE SET value = sequences.value + 1
    RETURNING value
  `
  return Number(rows[0].value)
}

export async function dbDelete(table: string, id: string): Promise<void> {
  if (table === 'jobs') await sql`DELETE FROM jobs WHERE id = ${id}`
  else if (table === 'customers') await sql`DELETE FROM customers WHERE id = ${id}`
  else if (table === 'sites') await sql`DELETE FROM sites WHERE id = ${id}`
  else if (table === 'assets') await sql`DELETE FROM assets WHERE id = ${id}`
  else if (table === 'leads') await sql`DELETE FROM leads WHERE id = ${id}`
  else if (table === 'quotes') await sql`DELETE FROM quotes WHERE id = ${id}`
  else if (table === 'invoices') await sql`DELETE FROM invoices WHERE id = ${id}`
  else if (table === 'checklist_templates') await sql`DELETE FROM checklist_templates WHERE id = ${id}`
  else if (table === 'users') await sql`DELETE FROM users WHERE id = ${id}`
}

export async function dbSave(update: Partial<Database>): Promise<void> {
  const tasks: Promise<unknown>[] = []
  if (update.companies) tasks.push(...update.companies.map(upsertCompany))
  if (update.users) tasks.push(...update.users.map(upsertUser))
  if (update.customers) tasks.push(...update.customers.map(upsertCustomer))
  if (update.sites) tasks.push(...update.sites.map(upsertSite))
  if (update.assets) tasks.push(...update.assets.map(upsertAsset))
  if (update.leads) tasks.push(...update.leads.map(upsertLead))
  if (update.jobs) tasks.push(...update.jobs.map(upsertJob))
  if (update.quotes) tasks.push(...update.quotes.map(upsertQuote))
  if (update.invoices) tasks.push(...update.invoices.map(upsertInvoice))
  if (update.checklistTemplates) tasks.push(...update.checklistTemplates.map(upsertChecklistTemplate))
  await Promise.all(tasks)
}

async function upsertCompany(c: Company) {
  await sql`
    INSERT INTO companies (id, name, uen, address, logo, phone, email, trade_types, currency, gst_enabled, gst_rate, invoice_prefix, quote_prefix, job_prefix, working_hours, service_areas, payment_terms, warranty_period, created_at)
    VALUES (${c.id}, ${c.name}, ${c.uen ?? null}, ${c.address ?? null}, ${c.logo ?? null}, ${c.phone ?? null}, ${c.email ?? null}, ${c.tradeTypes}, ${c.currency}, ${c.gstEnabled}, ${c.gstRate}, ${c.invoicePrefix}, ${c.quotePrefix}, ${c.jobPrefix}, ${c.workingHours ?? null}, ${c.serviceAreas}, ${c.paymentTerms ?? null}, ${c.warrantyPeriod ?? null}, ${c.createdAt})
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, uen = EXCLUDED.uen, address = EXCLUDED.address,
      phone = EXCLUDED.phone, email = EXCLUDED.email, trade_types = EXCLUDED.trade_types,
      gst_enabled = EXCLUDED.gst_enabled, gst_rate = EXCLUDED.gst_rate,
      invoice_prefix = EXCLUDED.invoice_prefix, quote_prefix = EXCLUDED.quote_prefix,
      job_prefix = EXCLUDED.job_prefix, working_hours = EXCLUDED.working_hours,
      service_areas = EXCLUDED.service_areas, payment_terms = EXCLUDED.payment_terms,
      warranty_period = EXCLUDED.warranty_period
  `
}

async function upsertUser(u: User) {
  await sql`
    INSERT INTO users (id, company_id, name, email, password_hash, role, skills, is_active, phone, avatar, created_at)
    VALUES (${u.id}, ${u.companyId}, ${u.name}, ${u.email}, ${u.passwordHash}, ${u.role}, ${u.skills}, ${u.isActive}, ${u.phone ?? null}, ${u.avatar ?? null}, ${u.createdAt})
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, email = EXCLUDED.email, password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role, skills = EXCLUDED.skills, is_active = EXCLUDED.is_active,
      phone = EXCLUDED.phone, avatar = EXCLUDED.avatar
  `
}

async function upsertCustomer(c: Customer) {
  await sql`
    INSERT INTO customers (id, company_id, name, mobile, email, billing_address, customer_type, notes, created_at)
    VALUES (${c.id}, ${c.companyId}, ${c.name}, ${c.mobile ?? null}, ${c.email ?? null}, ${c.billingAddress ?? null}, ${c.customerType}, ${c.notes ?? null}, ${c.createdAt})
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, mobile = EXCLUDED.mobile, email = EXCLUDED.email,
      billing_address = EXCLUDED.billing_address, customer_type = EXCLUDED.customer_type,
      notes = EXCLUDED.notes
  `
}

async function upsertSite(s: Site) {
  await sql`
    INSERT INTO sites (id, company_id, customer_id, address, unit_number, access_instructions, parking_instructions, contact_person, contact_phone, preferred_hours, notes, map_link, site_type, created_at)
    VALUES (${s.id}, ${s.companyId}, ${s.customerId}, ${s.address}, ${s.unitNumber ?? null}, ${s.accessInstructions ?? null}, ${s.parkingInstructions ?? null}, ${s.contactPerson ?? null}, ${s.contactPhone ?? null}, ${s.preferredHours ?? null}, ${s.notes ?? null}, ${s.mapLink ?? null}, ${s.siteType ?? null}, ${s.createdAt})
    ON CONFLICT (id) DO UPDATE SET
      address = EXCLUDED.address, unit_number = EXCLUDED.unit_number,
      access_instructions = EXCLUDED.access_instructions, parking_instructions = EXCLUDED.parking_instructions,
      contact_person = EXCLUDED.contact_person, contact_phone = EXCLUDED.contact_phone,
      preferred_hours = EXCLUDED.preferred_hours, notes = EXCLUDED.notes,
      map_link = EXCLUDED.map_link, site_type = EXCLUDED.site_type
  `
}

async function upsertAsset(a: Asset) {
  await sql`
    INSERT INTO assets (id, company_id, site_id, customer_id, trade_type, category, brand, model, serial_number, installation_date, warranty_expiry, location, last_service_date, next_service_date, notes, created_at)
    VALUES (${a.id}, ${a.companyId}, ${a.siteId}, ${a.customerId}, ${a.tradeType}, ${a.category}, ${a.brand ?? null}, ${a.model ?? null}, ${a.serialNumber ?? null}, ${a.installationDate ?? null}, ${a.warrantyExpiry ?? null}, ${a.location ?? null}, ${a.lastServiceDate ?? null}, ${a.nextServiceDate ?? null}, ${a.notes ?? null}, ${a.createdAt})
    ON CONFLICT (id) DO UPDATE SET
      trade_type = EXCLUDED.trade_type, category = EXCLUDED.category, brand = EXCLUDED.brand,
      model = EXCLUDED.model, serial_number = EXCLUDED.serial_number,
      installation_date = EXCLUDED.installation_date, warranty_expiry = EXCLUDED.warranty_expiry,
      location = EXCLUDED.location, last_service_date = EXCLUDED.last_service_date,
      next_service_date = EXCLUDED.next_service_date, notes = EXCLUDED.notes
  `
}

async function upsertLead(l: Lead) {
  await sql`
    INSERT INTO leads (id, company_id, customer_id, site_id, contact_name, contact_phone, contact_email, source, trade_type, urgency, description, status, assigned_to, lost_reason, scheduled_date, notes, created_at, updated_at)
    VALUES (${l.id}, ${l.companyId}, ${l.customerId ?? null}, ${l.siteId ?? null}, ${l.contactName}, ${l.contactPhone ?? null}, ${l.contactEmail ?? null}, ${l.source}, ${l.tradeType}, ${l.urgency}, ${l.description}, ${l.status}, ${l.assignedTo ?? null}, ${l.lostReason ?? null}, ${l.scheduledDate ?? null}, ${l.notes ?? null}, ${l.createdAt}, ${l.updatedAt})
    ON CONFLICT (id) DO UPDATE SET
      contact_name = EXCLUDED.contact_name, contact_phone = EXCLUDED.contact_phone,
      contact_email = EXCLUDED.contact_email, source = EXCLUDED.source,
      trade_type = EXCLUDED.trade_type, urgency = EXCLUDED.urgency,
      description = EXCLUDED.description, status = EXCLUDED.status,
      assigned_to = EXCLUDED.assigned_to, lost_reason = EXCLUDED.lost_reason,
      scheduled_date = EXCLUDED.scheduled_date, notes = EXCLUDED.notes,
      updated_at = EXCLUDED.updated_at
  `
}

async function upsertJob(j: Job) {
  await sql`
    INSERT INTO jobs (id, job_number, company_id, customer_id, site_id, asset_ids, lead_id, quote_id, job_type, trade_type, priority, status, title, description, appointment_date, appointment_time, estimated_duration, assigned_technicians, internal_notes, fault_diagnosis, work_performed, recommendations, parts_used, labour_hours, timestamps, photos, checklist_data, customer_signature, technician_signature, requires_follow_up, has_safety_issue, created_at, updated_at)
    VALUES (${j.id}, ${j.jobNumber}, ${j.companyId}, ${j.customerId}, ${j.siteId ?? null}, ${j.assetIds}, ${j.leadId ?? null}, ${j.quoteId ?? null}, ${j.jobType}, ${j.tradeType}, ${j.priority}, ${j.status}, ${j.title}, ${j.description ?? null}, ${j.appointmentDate ?? null}, ${j.appointmentTime ?? null}, ${j.estimatedDuration ?? null}, ${j.assignedTechnicians}, ${j.internalNotes ?? null}, ${j.faultDiagnosis ?? null}, ${j.workPerformed ?? null}, ${j.recommendations ?? null}, ${JSON.stringify(j.partsUsed)}, ${j.labourHours ?? null}, ${JSON.stringify(j.timestamps)}, ${JSON.stringify(j.photos)}, ${JSON.stringify(j.checklistData)}, ${j.customerSignature ?? null}, ${j.technicianSignature ?? null}, ${j.requiresFollowUp}, ${j.hasSafetyIssue}, ${j.createdAt}, ${j.updatedAt})
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status, title = EXCLUDED.title, description = EXCLUDED.description,
      appointment_date = EXCLUDED.appointment_date, appointment_time = EXCLUDED.appointment_time,
      estimated_duration = EXCLUDED.estimated_duration, site_id = EXCLUDED.site_id,
      asset_ids = EXCLUDED.asset_ids, quote_id = EXCLUDED.quote_id,
      assigned_technicians = EXCLUDED.assigned_technicians, internal_notes = EXCLUDED.internal_notes,
      fault_diagnosis = EXCLUDED.fault_diagnosis, work_performed = EXCLUDED.work_performed,
      recommendations = EXCLUDED.recommendations, parts_used = EXCLUDED.parts_used,
      labour_hours = EXCLUDED.labour_hours, timestamps = EXCLUDED.timestamps,
      photos = EXCLUDED.photos, checklist_data = EXCLUDED.checklist_data,
      customer_signature = EXCLUDED.customer_signature, technician_signature = EXCLUDED.technician_signature,
      requires_follow_up = EXCLUDED.requires_follow_up, has_safety_issue = EXCLUDED.has_safety_issue,
      priority = EXCLUDED.priority, updated_at = EXCLUDED.updated_at
  `
}

async function upsertQuote(q: Quote) {
  await sql`
    INSERT INTO quotes (id, quote_number, company_id, customer_id, site_id, job_id, lead_id, items, subtotal, discount, gst, total, deposit_required, validity_days, payment_terms, warranty_terms, notes, status, sent_at, viewed_at, approved_at, rejected_at, expires_at, created_at, updated_at)
    VALUES (${q.id}, ${q.quoteNumber}, ${q.companyId}, ${q.customerId}, ${q.siteId ?? null}, ${q.jobId ?? null}, ${q.leadId ?? null}, ${JSON.stringify(q.items)}, ${q.subtotal}, ${q.discount}, ${q.gst}, ${q.total}, ${q.depositRequired}, ${q.validityDays}, ${q.paymentTerms ?? null}, ${q.warrantyTerms ?? null}, ${q.notes ?? null}, ${q.status}, ${q.sentAt ?? null}, ${q.viewedAt ?? null}, ${q.approvedAt ?? null}, ${q.rejectedAt ?? null}, ${q.expiresAt ?? null}, ${q.createdAt}, ${q.updatedAt})
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status, items = EXCLUDED.items, subtotal = EXCLUDED.subtotal,
      discount = EXCLUDED.discount, gst = EXCLUDED.gst, total = EXCLUDED.total,
      deposit_required = EXCLUDED.deposit_required, validity_days = EXCLUDED.validity_days,
      payment_terms = EXCLUDED.payment_terms, warranty_terms = EXCLUDED.warranty_terms,
      notes = EXCLUDED.notes, sent_at = EXCLUDED.sent_at, viewed_at = EXCLUDED.viewed_at,
      approved_at = EXCLUDED.approved_at, rejected_at = EXCLUDED.rejected_at,
      expires_at = EXCLUDED.expires_at, updated_at = EXCLUDED.updated_at
  `
}

async function upsertInvoice(i: Invoice) {
  await sql`
    INSERT INTO invoices (id, invoice_number, company_id, customer_id, job_id, quote_id, items, subtotal, discount, gst, total, deposit_paid, amount_due, payment_status, payment_due_date, payment_method, payment_reference, notes, sent_at, paid_at, created_at, updated_at)
    VALUES (${i.id}, ${i.invoiceNumber}, ${i.companyId}, ${i.customerId}, ${i.jobId ?? null}, ${i.quoteId ?? null}, ${JSON.stringify(i.items)}, ${i.subtotal}, ${i.discount}, ${i.gst}, ${i.total}, ${i.depositPaid}, ${i.amountDue}, ${i.paymentStatus}, ${i.paymentDueDate ?? null}, ${i.paymentMethod ?? null}, ${i.paymentReference ?? null}, ${i.notes ?? null}, ${i.sentAt ?? null}, ${i.paidAt ?? null}, ${i.createdAt}, ${i.updatedAt})
    ON CONFLICT (id) DO UPDATE SET
      payment_status = EXCLUDED.payment_status, items = EXCLUDED.items,
      subtotal = EXCLUDED.subtotal, discount = EXCLUDED.discount, gst = EXCLUDED.gst,
      total = EXCLUDED.total, deposit_paid = EXCLUDED.deposit_paid, amount_due = EXCLUDED.amount_due,
      payment_due_date = EXCLUDED.payment_due_date, payment_method = EXCLUDED.payment_method,
      payment_reference = EXCLUDED.payment_reference, notes = EXCLUDED.notes,
      sent_at = EXCLUDED.sent_at, paid_at = EXCLUDED.paid_at, updated_at = EXCLUDED.updated_at
  `
}

async function upsertChecklistTemplate(t: ChecklistTemplate) {
  await sql`
    INSERT INTO checklist_templates (id, company_id, name, trade_type, job_type, items, is_default, created_at, updated_at)
    VALUES (${t.id}, ${t.companyId}, ${t.name}, ${t.tradeType}, ${t.jobType ?? null}, ${JSON.stringify(t.items)}, ${t.isDefault}, ${t.createdAt}, ${t.updatedAt})
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, trade_type = EXCLUDED.trade_type, job_type = EXCLUDED.job_type,
      items = EXCLUDED.items, is_default = EXCLUDED.is_default, updated_at = EXCLUDED.updated_at
  `
}
