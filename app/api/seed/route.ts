import { dbSave } from '@/lib/db'
import { neon } from '@neondatabase/serverless'
import type { Company, User, Customer, Site, Asset, Lead, Job, Quote, Invoice, ChecklistTemplate } from '@/lib/types'

// One-time seed endpoint — call once after creating Neon tables
// Protected by a secret query param: /api/seed?secret=seed_serviceops_demo

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== 'seed_serviceops_demo') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const sql = neon(process.env.DATABASE_URL!)

  // Clear existing data
  await sql`DELETE FROM invoices`
  await sql`DELETE FROM quotes`
  await sql`DELETE FROM jobs`
  await sql`DELETE FROM leads`
  await sql`DELETE FROM assets`
  await sql`DELETE FROM sites`
  await sql`DELETE FROM customers`
  await sql`DELETE FROM checklist_templates`
  await sql`DELETE FROM users`
  await sql`DELETE FROM sequences`
  await sql`DELETE FROM companies`

  const companyId = 'comp_demo'
  const now = new Date().toISOString()
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  const company: Company = {
    id: companyId,
    name: 'CoolBreeze Services Pte Ltd',
    uen: '202312345A',
    address: '10 Ubi Crescent #05-88, Singapore 408564',
    phone: '+65 6123 4567',
    email: 'admin@coolbreeze.sg',
    tradeTypes: ['aircon', 'electrical', 'plumbing'],
    currency: 'SGD',
    gstEnabled: true,
    gstRate: 9,
    invoicePrefix: 'INV-',
    quotePrefix: 'QT-',
    jobPrefix: 'JOB-',
    workingHours: 'Mon-Fri 8am-6pm, Sat 8am-1pm',
    serviceAreas: ['Tampines', 'Bedok', 'Pasir Ris', 'Changi', 'Simei'],
    paymentTerms: 'Payment due within 30 days of invoice date.',
    warrantyPeriod: '90 days warranty on parts and labour.',
    createdAt: now,
  }

  // bcrypt hash of "password123"
  const hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'

  const users: User[] = [
    { id: 'user_owner', companyId, name: 'Sarah Tan', email: 'owner@coolbreeze.sg', passwordHash: hash, role: 'owner', skills: ['aircon', 'electrical', 'plumbing'], isActive: true, phone: '+65 9111 2222', createdAt: now },
    { id: 'user_admin', companyId, name: 'James Wong', email: 'admin@coolbreeze.sg', passwordHash: hash, role: 'admin', skills: ['aircon', 'electrical'], isActive: true, phone: '+65 9222 3333', createdAt: now },
    { id: 'user_tech1', companyId, name: 'Ali Hassan', email: 'ali@coolbreeze.sg', passwordHash: hash, role: 'technician', skills: ['aircon'], isActive: true, phone: '+65 9333 4444', createdAt: now },
    { id: 'user_tech2', companyId, name: 'Rajan Kumar', email: 'rajan@coolbreeze.sg', passwordHash: hash, role: 'technician', skills: ['electrical', 'aircon'], isActive: true, phone: '+65 9444 5555', createdAt: now },
    { id: 'user_tech3', companyId, name: 'David Lim', email: 'david@coolbreeze.sg', passwordHash: hash, role: 'technician', skills: ['plumbing'], isActive: true, phone: '+65 9555 6666', createdAt: now },
    { id: 'user_office', companyId, name: 'Priya Nair', email: 'office@coolbreeze.sg', passwordHash: hash, role: 'dispatcher', skills: [], isActive: true, phone: '+65 9666 7777', createdAt: now },
  ]

  const customers: Customer[] = [
    { id: 'cust_001', companyId, name: 'Mr. Tan Ah Kow', mobile: '+65 9100 0001', email: 'tanak@gmail.com', billingAddress: '12 Tampines Ave 4 #08-12 Singapore 520012', customerType: 'residential', createdAt: now },
    { id: 'cust_002', companyId, name: 'ABC Restaurant Pte Ltd', mobile: '+65 6200 0002', email: 'ops@abcrestaurant.sg', billingAddress: '88 Changi Road #01-01 Singapore 419690', customerType: 'commercial', createdAt: now },
    { id: 'cust_003', companyId, name: 'Mrs. Lim Bee Hong', mobile: '+65 9100 0003', email: 'beehong@hotmail.com', billingAddress: '5 Bedok North Ave 2 #12-34 Singapore 460005', customerType: 'residential', createdAt: now },
    { id: 'cust_004', companyId, name: 'Sunrise Office Pte Ltd', mobile: '+65 6200 0004', email: 'facilities@sunrise.sg', billingAddress: '1 Changi Business Park #07-01 Singapore 486000', customerType: 'commercial', createdAt: now },
    { id: 'cust_005', companyId, name: 'Mr. David Chen', mobile: '+65 9100 0005', email: 'davidc@gmail.com', billingAddress: '33 Pasir Ris Dr 4 #05-10 Singapore 510033', customerType: 'residential', createdAt: now },
  ]

  const sites: Site[] = [
    { id: 'site_001', companyId, customerId: 'cust_001', address: '12 Tampines Ave 4 #08-12 Singapore 520012', accessInstructions: 'Ring doorbell. Guard dog — please wait outside gate.', createdAt: now },
    { id: 'site_002', companyId, customerId: 'cust_002', address: '88 Changi Road #01-01 Singapore 419690', accessInstructions: 'Check in at front counter. Ask for Mr. John.', parkingInstructions: 'Carpark B at the back.', createdAt: now },
    { id: 'site_003', companyId, customerId: 'cust_003', address: '5 Bedok North Ave 2 #12-34 Singapore 460005', createdAt: now },
    { id: 'site_004', companyId, customerId: 'cust_004', address: '1 Changi Business Park #07-01 Singapore 486000', accessInstructions: 'Building security requires contractor pass. Call facilities at +65 6200 0004.', createdAt: now },
    { id: 'site_005', companyId, customerId: 'cust_005', address: '33 Pasir Ris Dr 4 #05-10 Singapore 510033', createdAt: now },
  ]

  const assets: Asset[] = [
    { id: 'asset_001', companyId, siteId: 'site_001', customerId: 'cust_001', tradeType: 'aircon', category: 'Split Unit', brand: 'Daikin', model: 'FTKU25AVMM', serialNumber: 'DKN2023001', installationDate: '2021-06-15', warrantyExpiry: '2024-06-15', location: 'Living Room', lastServiceDate: '2024-01-10', nextServiceDate: today, createdAt: now },
    { id: 'asset_002', companyId, siteId: 'site_002', customerId: 'cust_002', tradeType: 'aircon', category: 'Cassette', brand: 'Mitsubishi', model: 'SLZ-KF36VA', serialNumber: 'MHI2022001', installationDate: '2020-03-20', warrantyExpiry: '2023-03-20', location: 'Main Dining', lastServiceDate: '2024-03-01', nextServiceDate: tomorrow, createdAt: now },
    { id: 'asset_003', companyId, siteId: 'site_003', customerId: 'cust_003', tradeType: 'aircon', category: 'Split Unit', brand: 'Panasonic', model: 'CS-S13PKH', serialNumber: 'PAN2021001', installationDate: '2019-08-10', warrantyExpiry: '2022-08-10', location: 'Master Bedroom', createdAt: now },
  ]

  const leads: Lead[] = [
    { id: 'lead_001', companyId, contactName: 'Mr. Ng Wei Ming', contactPhone: '+65 9700 0001', contactEmail: 'ngwm@gmail.com', source: 'website', tradeType: 'aircon', urgency: 'normal', description: 'Aircon not cold, need servicing for 3 units in HDB flat.', status: 'new', createdAt: now, updatedAt: now },
    { id: 'lead_002', companyId, customerId: 'cust_004', contactName: 'Ms. Rachel Teo', contactPhone: '+65 6200 0004', source: 'referral', tradeType: 'electrical', urgency: 'urgent', description: 'Office lights flickering in level 7. Suspect wiring issue.', status: 'contacted', assignedTo: 'user_tech2', createdAt: now, updatedAt: now },
    { id: 'lead_003', companyId, contactName: 'Mr. Siva Raj', contactPhone: '+65 9700 0003', source: 'phone', tradeType: 'plumbing', urgency: 'emergency', description: 'Water pipe burst in kitchen. Need urgent help.', status: 'site_visit', assignedTo: 'user_tech3', scheduledDate: today, createdAt: now, updatedAt: now },
  ]

  const jobs: Job[] = [
    {
      id: 'job_001', jobNumber: 'JOB-1001', companyId, customerId: 'cust_001', siteId: 'site_001', assetIds: ['asset_001'],
      jobType: 'servicing', tradeType: 'aircon', priority: 'normal', status: 'scheduled',
      title: 'Aircon Servicing - Living Room', description: 'Annual servicing for Daikin split unit.',
      appointmentDate: today, appointmentTime: '09:00', estimatedDuration: 60,
      assignedTechnicians: ['user_tech1'], internalNotes: 'Customer prefers morning appointments.',
      partsUsed: [], labourHours: 0, timestamps: {}, photos: [], checklistData: {},
      requiresFollowUp: false, hasSafetyIssue: false, createdAt: now, updatedAt: now,
    },
    {
      id: 'job_002', jobNumber: 'JOB-1002', companyId, customerId: 'cust_002', siteId: 'site_002', assetIds: ['asset_002'],
      jobType: 'repair', tradeType: 'aircon', priority: 'urgent', status: 'in_progress',
      title: 'Cassette Aircon Repair - Restaurant', description: 'Aircon tripping at the restaurant. Urgently affecting operations.',
      appointmentDate: today, appointmentTime: '14:00', estimatedDuration: 120,
      assignedTechnicians: ['user_tech1', 'user_tech2'], internalNotes: 'Critical for their operations.',
      faultDiagnosis: 'Compressor overloading due to refrigerant leak.',
      partsUsed: [{ id: 'p1', name: 'R410A Refrigerant', quantity: 2, unitCost: 45, total: 90 }],
      labourHours: 0, timestamps: { assigned: now }, photos: [], checklistData: {},
      requiresFollowUp: false, hasSafetyIssue: false, createdAt: now, updatedAt: now,
    },
    {
      id: 'job_003', jobNumber: 'JOB-1003', companyId, customerId: 'cust_003', siteId: 'site_003', assetIds: ['asset_003'],
      jobType: 'installation', tradeType: 'aircon', priority: 'normal', status: 'completed',
      title: 'Aircon Installation - 2 Bedroom Units', description: 'Install 2x Panasonic split units in bedroom.',
      appointmentDate: yesterday, appointmentTime: '10:00', estimatedDuration: 180,
      assignedTechnicians: ['user_tech1'],
      faultDiagnosis: 'New installation.',
      workPerformed: 'Installed 2x Panasonic CS-S13PKH units. Tested and confirmed working.',
      partsUsed: [
        { id: 'p2', name: 'Panasonic CS-S13PKH', quantity: 2, unitCost: 650, total: 1300 },
        { id: 'p3', name: 'Copper Pipe 1/4"', quantity: 5, unitCost: 12, total: 60 },
      ],
      labourHours: 3, timestamps: { completed: yesterday },
      photos: [], checklistData: {}, requiresFollowUp: false, hasSafetyIssue: false,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), updatedAt: yesterday,
    },
    {
      id: 'job_004', jobNumber: 'JOB-1004', companyId, customerId: 'cust_004', siteId: 'site_004', assetIds: [],
      jobType: 'repair', tradeType: 'electrical', priority: 'high', status: 'assigned',
      title: 'Electrical Fault - Office Level 7', description: 'Lights flickering and tripping breaker on level 7.',
      appointmentDate: tomorrow, appointmentTime: '09:30', estimatedDuration: 90,
      assignedTechnicians: ['user_tech2'],
      partsUsed: [], labourHours: 0, timestamps: { assigned: now }, photos: [], checklistData: {},
      requiresFollowUp: false, hasSafetyIssue: true, createdAt: now, updatedAt: now,
    },
    {
      id: 'job_005', jobNumber: 'JOB-1005', companyId, customerId: 'cust_005', siteId: 'site_005', assetIds: [],
      jobType: 'repair', tradeType: 'plumbing', priority: 'urgent', status: 'en_route',
      title: 'Emergency Pipe Burst - Kitchen', description: 'Water pipe burst in kitchen. Customer shutting off main valve.',
      appointmentDate: today, appointmentTime: '11:00', estimatedDuration: 60,
      assignedTechnicians: ['user_tech3'],
      partsUsed: [], labourHours: 0, timestamps: { assigned: now }, photos: [], checklistData: {},
      requiresFollowUp: false, hasSafetyIssue: false, createdAt: now, updatedAt: now,
    },
  ]

  const quotes: Quote[] = [
    {
      id: 'quote_001', quoteNumber: 'QT-1001', companyId, customerId: 'cust_003', siteId: 'site_003',
      jobId: 'job_003', items: [
        { id: 'li1', description: 'Panasonic CS-S13PKH 1.5HP Split Unit', quantity: 2, unitPrice: 650, total: 1300, type: 'material' as const },
        { id: 'li2', description: 'Installation Labour', quantity: 1, unitPrice: 280, total: 280, type: 'labour' as const },
        { id: 'li3', description: 'Copper Pipe & Accessories', quantity: 1, unitPrice: 120, total: 120, type: 'material' as const },
      ],
      subtotal: 1700, discount: 0, gst: 153, total: 1853, depositRequired: 500,
      validityDays: 30, paymentTerms: 'Deposit upon confirmation, balance upon completion.',
      warrantyTerms: '1 year manufacturer warranty on units. 90 days on installation.',
      status: 'approved', approvedAt: yesterday,
      expiresAt: new Date(Date.now() + 29 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), updatedAt: yesterday,
    },
    {
      id: 'quote_002', quoteNumber: 'QT-1002', companyId, customerId: 'cust_004', siteId: 'site_004',
      items: [
        { id: 'li4', description: 'Electrical Inspection & Fault Finding', quantity: 1, unitPrice: 180, total: 180, type: 'service' as const },
        { id: 'li5', description: 'Replace DB Board Components', quantity: 1, unitPrice: 320, total: 320, type: 'material' as const },
        { id: 'li6', description: 'Rewiring Level 7 (Est.)', quantity: 1, unitPrice: 850, total: 850, type: 'labour' as const },
      ],
      subtotal: 1350, discount: 0, gst: 121.5, total: 1471.5, depositRequired: 0,
      validityDays: 14, status: 'sent', sentAt: now,
      expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
      createdAt: now, updatedAt: now,
    },
  ]

  const invoices: Invoice[] = [
    {
      id: 'inv_001', invoiceNumber: 'INV-1001', companyId, customerId: 'cust_003', jobId: 'job_003', quoteId: 'quote_001',
      items: [
        { id: 'li7', description: 'Panasonic CS-S13PKH 1.5HP Split Unit', quantity: 2, unitPrice: 650, total: 1300, type: 'material' as const },
        { id: 'li8', description: 'Installation Labour', quantity: 1, unitPrice: 280, total: 280, type: 'labour' as const },
        { id: 'li9', description: 'Copper Pipe & Accessories', quantity: 1, unitPrice: 120, total: 120, type: 'material' as const },
      ],
      subtotal: 1700, discount: 0, gst: 153, total: 1853, depositPaid: 500, amountDue: 1353,
      paymentStatus: 'sent', paymentDueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      sentAt: now, createdAt: now, updatedAt: now,
    },
  ]

  const checklistTemplates: ChecklistTemplate[] = [
    {
      id: 'ct_001', companyId, name: 'Standard Aircon Servicing', tradeType: 'aircon', jobType: 'servicing',
      isDefault: true,
      items: [
        { key: 'filter_cleaned', label: 'Air filter cleaned', options: ['Done', 'N/A'] },
        { key: 'coil_cleaned', label: 'Evaporator coil cleaned', options: ['Done', 'N/A'] },
        { key: 'drain_cleared', label: 'Drain tray & pipe cleared', options: ['Done', 'N/A'] },
        { key: 'refrigerant_checked', label: 'Refrigerant level checked', options: ['OK', 'Low — topped up', 'N/A'] },
        { key: 'fan_speed', label: 'Fan speed tested (all modes)', options: ['OK', 'Faulty'] },
        { key: 'temperature', label: 'Temperature output verified', options: ['OK', 'Low', 'N/A'] },
        { key: 'remote_tested', label: 'Remote control tested', options: ['OK', 'Battery replaced', 'N/A'] },
      ],
      createdAt: now, updatedAt: now,
    },
    {
      id: 'ct_002', companyId, name: 'Electrical Safety Check', tradeType: 'electrical', jobType: 'inspection',
      isDefault: true,
      items: [
        { key: 'db_board', label: 'DB board inspected', options: ['Pass', 'Fail', 'N/A'] },
        { key: 'earthing', label: 'Earthing continuity tested', options: ['Pass', 'Fail'] },
        { key: 'insulation', label: 'Insulation resistance measured', options: ['Pass', 'Fail'] },
        { key: 'sockets', label: 'Socket outlets tested', options: ['Pass', 'Fail', 'N/A'] },
        { key: 'lights', label: 'Lighting circuits tested', options: ['Pass', 'Fail', 'N/A'] },
      ],
      createdAt: now, updatedAt: now,
    },
  ]

  // Seed sequences
  await sql`
    INSERT INTO sequences (company_id, key, value) VALUES
    (${companyId}, 'job', 1005),
    (${companyId}, 'quote', 1002),
    (${companyId}, 'invoice', 1001)
    ON CONFLICT (company_id, key) DO UPDATE SET value = EXCLUDED.value
  `

  await dbSave({ companies: [company], users, customers, sites, assets, leads, jobs, quotes, invoices, checklistTemplates })

  return Response.json({
    ok: true,
    seeded: {
      company: 1, users: users.length, customers: customers.length, sites: sites.length,
      assets: assets.length, leads: leads.length, jobs: jobs.length, quotes: quotes.length,
      invoices: invoices.length, checklistTemplates: checklistTemplates.length,
    },
    loginWith: [
      { email: 'owner@coolbreeze.sg', password: 'password123', role: 'owner' },
      { email: 'admin@coolbreeze.sg', password: 'password123', role: 'admin' },
      { email: 'ali@coolbreeze.sg', password: 'password123', role: 'technician' },
    ],
  })
}
