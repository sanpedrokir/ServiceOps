import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import type { Database } from './types'

const DATA_DIR = join(process.cwd(), 'data')
const DB_PATH = join(DATA_DIR, 'db.json')

function getInitialData(): Database {
  const now = new Date().toISOString()
  const d = (offset: number) => {
    const dt = new Date()
    dt.setDate(dt.getDate() + offset)
    return dt.toISOString().split('T')[0]
  }

  return {
    sequences: { job: 1008, quote: 1005, invoice: 1006 },
    companies: [{
      id: 'co1',
      name: 'AirTech Solutions Pte Ltd',
      uen: '202412345A',
      address: '10 Ubi Crescent, #05-88, Singapore 408564',
      phone: '+65 6123 4567',
      email: 'admin@airtech.sg',
      tradeTypes: ['aircon', 'electrical'],
      currency: 'SGD',
      gstEnabled: true,
      gstRate: 9,
      invoicePrefix: 'INV-',
      quotePrefix: 'QT-',
      jobPrefix: 'JOB-',
      workingHours: '8am - 6pm Mon-Sat',
      serviceAreas: ['Central', 'East', 'West', 'North', 'South'],
      paymentTerms: 'Payment due within 30 days',
      warrantyPeriod: '90 days on parts and labour',
      createdAt: now,
    }],
    users: [
      {
        id: 'u1', companyId: 'co1', name: 'John Tan', email: 'john@airtech.sg',
        passwordHash: '$2b$10$VKN3cmypEWPx91ZpuREiJe7WqEBWyz1UHgT8t8t2RhJGx6Aj8Zeke',
        role: 'owner', skills: [], isActive: true, phone: '+65 9123 4567', createdAt: now,
      },
      {
        id: 'u2', companyId: 'co1', name: 'Sarah Lim', email: 'sarah@airtech.sg',
        passwordHash: '$2b$10$VKN3cmypEWPx91ZpuREiJe7WqEBWyz1UHgT8t8t2RhJGx6Aj8Zeke',
        role: 'admin', skills: [], isActive: true, phone: '+65 9234 5678', createdAt: now,
      },
      {
        id: 'u3', companyId: 'co1', name: 'Mike Chen', email: 'mike@airtech.sg',
        passwordHash: '$2b$10$VKN3cmypEWPx91ZpuREiJe7WqEBWyz1UHgT8t8t2RhJGx6Aj8Zeke',
        role: 'dispatcher', skills: [], isActive: true, phone: '+65 9345 6789', createdAt: now,
      },
      {
        id: 'u4', companyId: 'co1', name: 'David Wong', email: 'david@airtech.sg',
        passwordHash: '$2b$10$VKN3cmypEWPx91ZpuREiJe7WqEBWyz1UHgT8t8t2RhJGx6Aj8Zeke',
        role: 'technician', skills: ['aircon_servicing', 'aircon_installation'], isActive: true, phone: '+65 9456 7890', createdAt: now,
      },
      {
        id: 'u5', companyId: 'co1', name: 'James Lee', email: 'james@airtech.sg',
        passwordHash: '$2b$10$VKN3cmypEWPx91ZpuREiJe7WqEBWyz1UHgT8t8t2RhJGx6Aj8Zeke',
        role: 'technician', skills: ['electrical_troubleshooting', 'aircon_servicing'], isActive: true, phone: '+65 9567 8901', createdAt: now,
      },
      {
        id: 'u6', companyId: 'co1', name: 'Amy Ng', email: 'amy@airtech.sg',
        passwordHash: '$2b$10$VKN3cmypEWPx91ZpuREiJe7WqEBWyz1UHgT8t8t2RhJGx6Aj8Zeke',
        role: 'finance', skills: [], isActive: true, phone: '+65 9678 9012', createdAt: now,
      },
    ],
    customers: [
      { id: 'c1', companyId: 'co1', name: 'ABC Commercial Park', mobile: '+65 6234 5678', email: 'facilities@abcpark.sg', billingAddress: '1 Business Park Drive, Singapore 609882', customerType: 'commercial', notes: 'Large commercial client - 3 buildings', createdAt: now },
      { id: 'c2', companyId: 'co1', name: 'Green Valley Condominium', mobile: '+65 6345 6789', email: 'mc@greenvalley.sg', billingAddress: '88 Green Valley Road, Singapore 297854', customerType: 'condo', notes: 'Management corporation - 200 units', createdAt: now },
      { id: 'c3', companyId: 'co1', name: 'Mr. Tan Wei Ming', mobile: '+65 9123 0001', email: 'tanwm@gmail.com', billingAddress: '45 Clementi Ave 3, #12-88, Singapore 129908', customerType: 'residential', createdAt: now },
      { id: 'c4', companyId: 'co1', name: 'Bright Future Learning Centre', mobile: '+65 6456 7890', email: 'admin@bflc.edu.sg', billingAddress: '200 Tampines St 21, Singapore 520200', customerType: 'school', createdAt: now },
      { id: 'c5', companyId: 'co1', name: 'Pacific Tower Office', mobile: '+65 6567 8901', email: 'pm@pacifictower.sg', billingAddress: '15 Raffles Place, Singapore 048635', customerType: 'office', createdAt: now },
    ],
    sites: [
      { id: 's1', companyId: 'co1', customerId: 'c1', address: '1 Business Park Drive Block A', unitNumber: '#01-01', contactPerson: 'Mr. Raj Kumar', contactPhone: '+65 9111 2222', accessInstructions: 'Report to security lobby, get visitor pass', siteType: 'Commercial Office', createdAt: now },
      { id: 's2', companyId: 'co1', customerId: 'c1', address: '1 Business Park Drive Block B', unitNumber: '#02-01', contactPerson: 'Ms. Linda Toh', contactPhone: '+65 9222 3333', siteType: 'Commercial Office', createdAt: now },
      { id: 's3', companyId: 'co1', customerId: 'c2', address: '88 Green Valley Road', unitNumber: 'Clubhouse', contactPerson: 'Mr. Steven Goh', contactPhone: '+65 9333 4444', accessInstructions: 'Clubhouse open 7am-10pm, use rear entrance for equipment', siteType: 'Condominium', createdAt: now },
      { id: 's4', companyId: 'co1', customerId: 'c3', address: '45 Clementi Ave 3', unitNumber: '#12-88', contactPerson: 'Mr. Tan Wei Ming', contactPhone: '+65 9123 0001', accessInstructions: 'Unit occupant present, call before arrival', siteType: 'Residential', createdAt: now },
      { id: 's5', companyId: 'co1', customerId: 'c4', address: '200 Tampines St 21', contactPerson: 'Mrs. Chen Mei Ling', contactPhone: '+65 9444 5555', preferredHours: 'After 3pm on weekdays, anytime on weekends', siteType: 'School', createdAt: now },
      { id: 's6', companyId: 'co1', customerId: 'c5', address: '15 Raffles Place Level 30', contactPerson: 'Mr. Andrew Lim', contactPhone: '+65 9555 6666', accessInstructions: 'Building access card required, request from PM office', siteType: 'Office', createdAt: now },
    ],
    assets: [
      { id: 'a1', companyId: 'co1', siteId: 's1', customerId: 'c1', tradeType: 'aircon', category: 'Fan Coil Unit', brand: 'Daikin', model: 'FCU-4.0HP', serialNumber: 'DK20230001', installationDate: '2023-01-15', warrantyExpiry: '2026-01-15', location: 'Main Conference Room', lastServiceDate: '2025-12-15', nextServiceDate: '2026-03-15', createdAt: now },
      { id: 'a2', companyId: 'co1', siteId: 's1', customerId: 'c1', tradeType: 'aircon', category: 'Compressor', brand: 'Daikin', model: 'R410A-4HP', serialNumber: 'DK20230002', installationDate: '2023-01-15', warrantyExpiry: '2026-01-15', location: 'Rooftop', createdAt: now },
      { id: 'a3', companyId: 'co1', siteId: 's3', customerId: 'c2', tradeType: 'aircon', category: 'Fan Coil Unit', brand: 'Mitsubishi', model: 'MSZ-GN50VA', serialNumber: 'MB20220045', installationDate: '2022-06-10', warrantyExpiry: '2025-06-10', location: 'Main Hall', lastServiceDate: '2025-11-20', nextServiceDate: '2026-02-20', createdAt: now },
      { id: 'a4', companyId: 'co1', siteId: 's4', customerId: 'c3', tradeType: 'aircon', category: 'Fan Coil Unit', brand: 'Panasonic', model: 'CS-S18PKH', serialNumber: 'PN20210123', installationDate: '2021-03-20', warrantyExpiry: '2024-03-20', location: 'Living Room', lastServiceDate: '2025-10-05', nextServiceDate: '2026-01-05', createdAt: now },
      { id: 'a5', companyId: 'co1', siteId: 's6', customerId: 'c5', tradeType: 'electrical', category: 'Distribution Board', brand: 'Schneider', model: 'EZ9S16320', serialNumber: 'SE20200567', installationDate: '2020-08-15', warrantyExpiry: '2025-08-15', location: 'Server Room DB', createdAt: now },
    ],
    leads: [
      { id: 'l1', companyId: 'co1', contactName: 'Mr. Lim Boon Keng', contactPhone: '+65 9777 8888', contactEmail: 'limbk@gmail.com', source: 'whatsapp', tradeType: 'aircon', urgency: 'normal', description: 'Need aircon servicing for 4 rooms, last done 8 months ago', status: 'new', assignedTo: 'u2', createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 'l2', companyId: 'co1', customerId: 'c5', siteId: 's6', contactName: 'Mr. Andrew Lim', contactPhone: '+65 9555 6666', source: 'existing', tradeType: 'electrical', urgency: 'urgent', description: 'Distribution board tripping frequently, affecting office operations', status: 'site_visit', assignedTo: 'u2', scheduledDate: d(1), createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 'l3', companyId: 'co1', contactName: 'Ms. Priya Sharma', contactPhone: '+65 8123 4567', source: 'google', tradeType: 'aircon', urgency: 'normal', description: 'Want to install new aircon system for 3-room HDB flat', status: 'quoted', assignedTo: 'u2', createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
      { id: 'l4', companyId: 'co1', contactName: 'Sunrise Restaurant', contactPhone: '+65 6234 9999', source: 'referral', tradeType: 'aircon', urgency: 'urgent', description: 'Aircon not cooling, full house dinner service tonight at risk', status: 'won', assignedTo: 'u2', createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 'l5', companyId: 'co1', contactName: 'Mr. Tan Ah Kow', contactPhone: '+65 9999 0000', source: 'phone', tradeType: 'electrical', urgency: 'normal', description: 'Light fittings replacement for entire office floor', status: 'lost', assignedTo: 'u2', lostReason: 'Price too high - went with cheaper contractor', createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
    ],
    jobs: [
      {
        id: 'j1', jobNumber: 'JOB-1001', companyId: 'co1', customerId: 'c3', siteId: 's4', assetIds: ['a4'],
        jobType: 'servicing', tradeType: 'aircon', priority: 'normal', status: 'completed',
        title: 'Aircon General Service - 2 Units', description: 'Routine servicing of 2 aircon units',
        appointmentDate: d(-2), appointmentTime: '10:00', estimatedDuration: 120,
        assignedTechnicians: ['u4'],
        workPerformed: 'Cleaned filters, washed coils, cleared drainage, topped up gas on unit 2',
        partsUsed: [{ id: 'p1', name: 'Refrigerant R410A 100g', quantity: 1, unitCost: 35, total: 35 }],
        labourHours: 2,
        timestamps: { assigned: new Date(Date.now() - 3 * 86400000).toISOString(), enRoute: new Date(Date.now() - 2 * 86400000 - 30*60000).toISOString(), arrived: new Date(Date.now() - 2 * 86400000 - 15*60000).toISOString(), started: new Date(Date.now() - 2 * 86400000).toISOString(), completed: new Date(Date.now() - 2 * 86400000 + 2*3600000).toISOString() },
        photos: [], checklistData: { filter: 'Clean', coil: 'Good', drainage: 'Clear', leakage: 'None', compressor: 'Normal', gas: 'Low - topped up' },
        requiresFollowUp: false, hasSafetyIssue: false,
        internalNotes: 'Unit 2 gas was low, topped up 100g',
        recommendations: 'Recommend chemical wash in 3 months',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'j2', jobNumber: 'JOB-1002', companyId: 'co1', customerId: 'c1', siteId: 's1', assetIds: ['a1', 'a2'],
        jobType: 'repair', tradeType: 'aircon', priority: 'urgent', status: 'in_progress',
        title: 'FCU Not Cooling - Conference Room', description: 'FCU not cooling, compressor making noise',
        appointmentDate: d(0), appointmentTime: '09:00', estimatedDuration: 180,
        assignedTechnicians: ['u4'],
        faultDiagnosis: 'Compressor pressure low, possible refrigerant leak',
        partsUsed: [],
        timestamps: { assigned: new Date(Date.now() - 86400000).toISOString(), enRoute: new Date(Date.now() - 2*3600000).toISOString(), arrived: new Date(Date.now() - 100*60000).toISOString(), started: new Date(Date.now() - 90*60000).toISOString() },
        photos: [], checklistData: {},
        requiresFollowUp: false, hasSafetyIssue: false,
        createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date(Date.now() - 90*60000).toISOString(),
      },
      {
        id: 'j3', jobNumber: 'JOB-1003', companyId: 'co1', customerId: 'c2', siteId: 's3', assetIds: ['a3'],
        jobType: 'preventive', tradeType: 'aircon', priority: 'normal', status: 'scheduled',
        title: 'Quarterly PM - Clubhouse A/C', description: 'Preventive maintenance for clubhouse aircon system',
        appointmentDate: d(1), appointmentTime: '14:00', estimatedDuration: 90,
        assignedTechnicians: ['u5'],
        partsUsed: [], timestamps: {}, photos: [], checklistData: {},
        requiresFollowUp: false, hasSafetyIssue: false,
        createdAt: now, updatedAt: now,
      },
      {
        id: 'j4', jobNumber: 'JOB-1004', companyId: 'co1', customerId: 'c5', siteId: 's6', assetIds: ['a5'],
        jobType: 'inspection', tradeType: 'electrical', priority: 'high', status: 'assigned',
        title: 'DB Inspection - Server Room', description: 'DB tripping repeatedly, full inspection required',
        appointmentDate: d(0), appointmentTime: '14:00', estimatedDuration: 120,
        assignedTechnicians: ['u5'],
        partsUsed: [], timestamps: { assigned: new Date(Date.now() - 3600000).toISOString() }, photos: [], checklistData: {},
        requiresFollowUp: false, hasSafetyIssue: false,
        createdAt: now, updatedAt: now,
      },
      {
        id: 'j5', jobNumber: 'JOB-1005', companyId: 'co1', customerId: 'c4', siteId: 's5', assetIds: [],
        jobType: 'installation', tradeType: 'aircon', priority: 'normal', status: 'awaiting_quote',
        title: 'New Aircon Installation - Computer Lab', description: 'Install 2x 1.5HP aircon units in new computer lab',
        appointmentDate: d(3), appointmentTime: '09:00', estimatedDuration: 480,
        assignedTechnicians: ['u4', 'u5'],
        partsUsed: [], timestamps: {}, photos: [], checklistData: {},
        requiresFollowUp: false, hasSafetyIssue: false,
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'j6', jobNumber: 'JOB-1006', companyId: 'co1', customerId: 'c3', siteId: 's4', assetIds: ['a4'],
        jobType: 'repair', tradeType: 'aircon', priority: 'urgent', status: 'awaiting_parts',
        title: 'Aircon Water Leaking - Master Bedroom', description: 'Water dripping from indoor unit',
        appointmentDate: d(2), appointmentTime: '11:00', estimatedDuration: 90,
        assignedTechnicians: ['u4'],
        faultDiagnosis: 'Drainage pipe blocked, also drain pan cracked - need replacement part',
        partsUsed: [],
        timestamps: { assigned: now }, photos: [], checklistData: {},
        requiresFollowUp: false, hasSafetyIssue: false,
        internalNotes: 'Drain pan DP-PAN-001 ordered from Panasonic, ETA 2 days',
        createdAt: now, updatedAt: now,
      },
      {
        id: 'j7', jobNumber: 'JOB-1007', companyId: 'co1', customerId: 'c1', siteId: 's2', assetIds: [],
        jobType: 'servicing', tradeType: 'aircon', priority: 'normal', status: 'invoiced',
        title: 'Aircon Service - Block B Offices', description: 'Service all 6 FCUs in block B',
        appointmentDate: d(-5), appointmentTime: '08:00', estimatedDuration: 240,
        assignedTechnicians: ['u4', 'u5'],
        workPerformed: 'Serviced all 6 FCUs, chemical wash on 2 units with heavy buildup',
        partsUsed: [],
        labourHours: 4,
        timestamps: { assigned: new Date(Date.now() - 6 * 86400000).toISOString(), started: new Date(Date.now() - 5 * 86400000).toISOString(), completed: new Date(Date.now() - 5 * 86400000 + 4*3600000).toISOString() },
        photos: [], checklistData: {},
        requiresFollowUp: false, hasSafetyIssue: false,
        createdAt: new Date(Date.now() - 6 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
    ],
    quotes: [
      {
        id: 'q1', quoteNumber: 'QT-1001', companyId: 'co1', customerId: 'c4', siteId: 's5', jobId: 'j5',
        items: [
          { id: 'qi1', description: 'Supply & Install Daikin 1.5HP Inverter A/C (x2)', quantity: 2, unitPrice: 1200, total: 2400, type: 'material' },
          { id: 'qi2', description: 'Labour - Installation', quantity: 1, unitPrice: 600, total: 600, type: 'labour' },
          { id: 'qi3', description: 'Copper piping and accessories', quantity: 1, unitPrice: 280, total: 280, type: 'material' },
        ],
        subtotal: 3280, discount: 0, gst: 295.2, total: 3575.2, depositRequired: 1000,
        validityDays: 30, paymentTerms: '50% deposit, balance on completion', warrantyTerms: '1 year parts and labour',
        notes: 'Installation to be completed in one day. Customer to ensure power points are available.',
        status: 'sent', sentAt: new Date(Date.now() - 86400000).toISOString(),
        expiresAt: new Date(Date.now() + 29 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'q2', quoteNumber: 'QT-1002', companyId: 'co1', customerId: 'c5', siteId: 's6',
        items: [
          { id: 'qi4', description: 'DB inspection and testing', quantity: 1, unitPrice: 350, total: 350, type: 'labour' },
          { id: 'qi5', description: 'Replace 4x MCB 20A', quantity: 4, unitPrice: 45, total: 180, type: 'material' },
          { id: 'qi6', description: 'Replace main isolator', quantity: 1, unitPrice: 280, total: 280, type: 'material' },
        ],
        subtotal: 810, discount: 0, gst: 72.9, total: 882.9, depositRequired: 0,
        validityDays: 14, paymentTerms: 'Payment on completion', warrantyTerms: '3 months on electrical works',
        status: 'approved', sentAt: new Date(Date.now() - 3 * 86400000).toISOString(), approvedAt: new Date(Date.now() - 86400000).toISOString(),
        createdAt: new Date(Date.now() - 4 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'q3', quoteNumber: 'QT-1003', companyId: 'co1', customerId: 'c1', siteId: 's1', jobId: 'j7',
        items: [
          { id: 'qi7', description: 'General aircon service (x6 units)', quantity: 6, unitPrice: 80, total: 480, type: 'service' },
          { id: 'qi8', description: 'Chemical wash (x2 units)', quantity: 2, unitPrice: 120, total: 240, type: 'service' },
        ],
        subtotal: 720, discount: 50, gst: 60.3, total: 730.3, depositRequired: 0,
        validityDays: 30, paymentTerms: 'Net 30',
        status: 'approved', sentAt: new Date(Date.now() - 8 * 86400000).toISOString(), approvedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 8 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
    ],
    checklistTemplates: [
      {
        id: 'ct1', companyId: 'co1', name: 'Aircon General Service', tradeType: 'aircon', jobType: 'servicing', isDefault: true,
        items: [
          { key: 'filter', label: 'Air Filter', options: ['Clean', 'Dirty - Cleaned', 'Dirty - Replaced', 'N/A'] },
          { key: 'coil', label: 'Evaporator Coil', options: ['Good', 'Dusty - Cleaned', 'Corroded', 'N/A'] },
          { key: 'drainage', label: 'Drainage / Drain Pan', options: ['Clear', 'Blocked - Cleared', 'Leaking', 'N/A'] },
          { key: 'leakage', label: 'Water Leakage', options: ['None observed', 'Minor', 'Severe', 'N/A'] },
          { key: 'compressor', label: 'Compressor', options: ['Normal', 'Noisy', 'Not running', 'N/A'] },
          { key: 'gas', label: 'Refrigerant Level', options: ['Adequate', 'Low - topped up', 'Suspected leak', 'N/A'] },
          { key: 'noise', label: 'Noise / Vibration', options: ['None', 'Minor', 'Loud', 'N/A'] },
          { key: 'pipe_insulation', label: 'Pipe Insulation', options: ['Good', 'Deteriorating', 'Missing', 'N/A'] },
          { key: 'thermostat', label: 'Thermostat / Remote', options: ['Working', 'Faulty', 'Replaced', 'N/A'] },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        id: 'ct2', companyId: 'co1', name: 'Aircon Installation Check', tradeType: 'aircon', jobType: 'installation', isDefault: true,
        items: [
          { key: 'mounting', label: 'Indoor Unit Mounting', options: ['Secure', 'Needs adjustment', 'N/A'] },
          { key: 'outdoor_unit', label: 'Outdoor Unit Placement', options: ['Correct', 'Needs adjustment', 'N/A'] },
          { key: 'copper_pipe', label: 'Copper Piping', options: ['Properly run', 'Insulated', 'Needs rework', 'N/A'] },
          { key: 'electrical', label: 'Electrical Connection', options: ['Correct', 'Tested OK', 'Issue found', 'N/A'] },
          { key: 'drainage_pipe', label: 'Drainage Pipe', options: ['Correct slope', 'Needs adjustment', 'N/A'] },
          { key: 'gas_charge', label: 'Gas Charge', options: ['Factory charged', 'Top-up required', 'N/A'] },
          { key: 'test_run', label: 'Test Run', options: ['Pass', 'Fail - see notes', 'N/A'] },
          { key: 'customer_briefed', label: 'Customer Briefed on Usage', options: ['Yes', 'No', 'N/A'] },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        id: 'ct3', companyId: 'co1', name: 'Electrical Inspection', tradeType: 'electrical', jobType: 'inspection', isDefault: true,
        items: [
          { key: 'db_condition', label: 'Distribution Board Condition', options: ['Good', 'Needs cleaning', 'Damaged', 'N/A'] },
          { key: 'mcb_operation', label: 'MCB Operation', options: ['All OK', 'Some faulty', 'Replace required', 'N/A'] },
          { key: 'wiring', label: 'Wiring Condition', options: ['Good', 'Worn insulation', 'Exposed wires', 'N/A'] },
          { key: 'earthing', label: 'Earthing / Grounding', options: ['Verified', 'Not verified', 'Issue found', 'N/A'] },
          { key: 'socket_outlets', label: 'Socket Outlets', options: ['All OK', 'Some faulty', 'Replaced', 'N/A'] },
          { key: 'lighting', label: 'Lighting Circuit', options: ['OK', 'Partial fault', 'Full fault', 'N/A'] },
          { key: 'load_test', label: 'Load Test', options: ['Pass', 'Fail', 'Not done', 'N/A'] },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        id: 'ct4', companyId: 'co1', name: 'Plumbing Inspection', tradeType: 'plumbing', isDefault: true,
        items: [
          { key: 'pipes', label: 'Pipe Condition', options: ['Good', 'Minor leaks', 'Major leaks', 'N/A'] },
          { key: 'water_pressure', label: 'Water Pressure', options: ['Normal', 'Low', 'High', 'N/A'] },
          { key: 'drainage', label: 'Drainage', options: ['Clear', 'Slow draining', 'Blocked', 'N/A'] },
          { key: 'fixtures', label: 'Fixtures / Fittings', options: ['Good condition', 'Worn', 'Needs replacement', 'N/A'] },
          { key: 'water_heater', label: 'Water Heater', options: ['Good', 'Needs service', 'Replace', 'N/A'] },
          { key: 'seals', label: 'Seals / Gaskets', options: ['Good', 'Deteriorating', 'Replaced', 'N/A'] },
        ],
        createdAt: now, updatedAt: now,
      },
    ],
    invoices: [
      {
        id: 'inv1', invoiceNumber: 'INV-1001', companyId: 'co1', customerId: 'c3', jobId: 'j1',
        items: [
          { id: 'ii1', description: 'Aircon general service (x2 units)', quantity: 2, unitPrice: 80, total: 160, type: 'service' },
          { id: 'ii2', description: 'Refrigerant R410A top-up', quantity: 1, unitPrice: 50, total: 50, type: 'material' },
        ],
        subtotal: 210, discount: 0, gst: 18.9, total: 228.9, depositPaid: 0, amountDue: 228.9,
        paymentStatus: 'paid', paymentMethod: 'paynow', paymentReference: 'PN20260120001',
        paymentDueDate: d(-1), paidAt: new Date(Date.now() - 86400000).toISOString(),
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'inv2', invoiceNumber: 'INV-1002', companyId: 'co1', customerId: 'c1', jobId: 'j7',
        items: [
          { id: 'ii3', description: 'Aircon general service (x6 units)', quantity: 6, unitPrice: 80, total: 480, type: 'service' },
          { id: 'ii4', description: 'Chemical wash (x2 units)', quantity: 2, unitPrice: 120, total: 240, type: 'service' },
        ],
        subtotal: 720, discount: 50, gst: 60.3, total: 730.3, depositPaid: 0, amountDue: 730.3,
        paymentStatus: 'sent', paymentDueDate: d(25),
        createdAt: new Date(Date.now() - 4 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
      {
        id: 'inv3', invoiceNumber: 'INV-1003', companyId: 'co1', customerId: 'c2', jobId: undefined,
        items: [
          { id: 'ii5', description: 'Monthly contract service - Jan 2026', quantity: 1, unitPrice: 850, total: 850, type: 'service' },
        ],
        subtotal: 850, discount: 0, gst: 76.5, total: 926.5, depositPaid: 0, amountDue: 926.5,
        paymentStatus: 'overdue', paymentDueDate: d(-10),
        createdAt: new Date(Date.now() - 40 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 40 * 86400000).toISOString(),
      },
      {
        id: 'inv4', invoiceNumber: 'INV-1004', companyId: 'co1', customerId: 'c4',
        items: [
          { id: 'ii6', description: 'Partial deposit - Computer Lab Installation', quantity: 1, unitPrice: 1000, total: 1000, type: 'service' },
        ],
        subtotal: 1000, discount: 0, gst: 90, total: 1090, depositPaid: 1090, amountDue: 2485.2,
        paymentStatus: 'partially_paid', paymentDueDate: d(30),
        paymentMethod: 'bank_transfer',
        createdAt: now, updatedAt: now,
      },
    ],
  }
}

let _db: Database | null = null

function initDb(): Database {
  if (!existsSync(DATA_DIR)) {
    try { mkdirSync(DATA_DIR, { recursive: true }) } catch {}
  }
  if (existsSync(DB_PATH)) {
    try {
      const loaded = JSON.parse(readFileSync(DB_PATH, 'utf-8')) as Database
      const initial = getInitialData()
      return {
        ...loaded,
        checklistTemplates: loaded.checklistTemplates ?? initial.checklistTemplates,
      }
    } catch {
      return getInitialData()
    }
  }
  const initial = getInitialData()
  try { writeFileSync(DB_PATH, JSON.stringify(initial, null, 2)) } catch {}
  return initial
}

function getDb(): Database {
  if (!_db) _db = initDb()
  return _db
}

function saveDb() {
  if (!_db) return
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
    writeFileSync(DB_PATH, JSON.stringify(_db, null, 2))
  } catch (e) {
    console.error('DB save error:', e)
  }
}

export function db() { return getDb() }

export function dbSave(update: Partial<Database>) {
  const current = getDb()
  _db = { ...current, ...update }
  saveDb()
}

export function nextSequence(key: string): number {
  const current = getDb()
  const seq = (current.sequences[key] || 1000) + 1
  _db = { ...current, sequences: { ...current.sequences, [key]: seq } }
  saveDb()
  return seq
}
