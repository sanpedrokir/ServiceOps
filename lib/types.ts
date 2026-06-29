export type UserRole = 'owner' | 'admin' | 'dispatcher' | 'technician' | 'finance' | 'storekeeper' | 'readonly'
export type TradeType = 'aircon' | 'electrical' | 'plumbing' | 'maintenance' | 'multi'
export type CustomerType = 'residential' | 'commercial' | 'property_mgmt' | 'school' | 'retail' | 'office' | 'condo'
export type LeadStatus = 'new' | 'contacted' | 'site_visit' | 'quoted' | 'won' | 'lost'
export type LeadSource = 'phone' | 'whatsapp' | 'website' | 'referral' | 'google' | 'existing'
export type Urgency = 'normal' | 'urgent' | 'emergency'
export type JobType = 'inspection' | 'repair' | 'servicing' | 'preventive' | 'emergency' | 'installation' | 'replacement' | 'survey' | 'warranty' | 'defect' | 'followup'
export type JobStatus = 'draft' | 'awaiting_confirmation' | 'scheduled' | 'assigned' | 'en_route' | 'arrived' | 'in_progress' | 'awaiting_quote' | 'awaiting_parts' | 'completed' | 'invoiced' | 'paid' | 'cancelled'
export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'expired'
export type InvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled'
export type PaymentMethod = 'paynow' | 'bank_transfer' | 'cash' | 'card' | 'cheque'

export interface Certification {
  id: string
  companyId: string
  userId: string
  name: string
  certNumber?: string
  issuingBody?: string
  issuedDate?: string
  expiryDate?: string
  notes?: string
  createdAt: string
}

export interface Company {
  id: string
  name: string
  uen?: string
  address?: string
  logo?: string
  phone?: string
  email?: string
  tradeTypes: TradeType[]
  currency: string
  gstEnabled: boolean
  gstRate: number
  invoicePrefix: string
  quotePrefix: string
  jobPrefix: string
  workingHours: string
  serviceAreas: string[]
  paymentTerms: string
  warrantyPeriod: string
  createdAt: string
}

export interface User {
  id: string
  companyId: string
  name: string
  email: string
  passwordHash: string
  role: UserRole
  skills: string[]
  isActive: boolean
  phone?: string
  avatar?: string
  createdAt: string
}

export interface Customer {
  id: string
  companyId: string
  name: string
  mobile?: string
  email?: string
  billingAddress?: string
  customerType: CustomerType
  notes?: string
  createdAt: string
}

export interface Site {
  id: string
  companyId: string
  customerId: string
  address: string
  unitNumber?: string
  accessInstructions?: string
  parkingInstructions?: string
  contactPerson?: string
  contactPhone?: string
  preferredHours?: string
  notes?: string
  mapLink?: string
  siteType?: string
  createdAt: string
}

export interface Asset {
  id: string
  companyId: string
  siteId: string
  customerId: string
  tradeType: TradeType
  category: string
  brand?: string
  model?: string
  serialNumber?: string
  installationDate?: string
  warrantyExpiry?: string
  location?: string
  lastServiceDate?: string
  nextServiceDate?: string
  notes?: string
  createdAt: string
}

export interface Lead {
  id: string
  companyId: string
  customerId?: string
  siteId?: string
  contactName: string
  contactPhone?: string
  contactEmail?: string
  source: LeadSource
  tradeType: TradeType
  urgency: Urgency
  description: string
  status: LeadStatus
  assignedTo?: string
  lostReason?: string
  scheduledDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  type: 'labour' | 'material' | 'service'
}

export interface PartUsed {
  id: string
  name: string
  quantity: number
  unitCost: number
  total: number
}

export interface Photo {
  id: string
  url: string
  caption?: string
  tag: 'before' | 'during' | 'after' | 'defect' | 'safety' | 'evidence'
  takenAt: string
}

export interface Quote {
  id: string
  quoteNumber: string
  companyId: string
  customerId: string
  siteId?: string
  jobId?: string
  leadId?: string
  items: LineItem[]
  subtotal: number
  discount: number
  gst: number
  total: number
  depositRequired: number
  validityDays: number
  paymentTerms?: string
  warrantyTerms?: string
  notes?: string
  status: QuoteStatus
  sentAt?: string
  viewedAt?: string
  approvedAt?: string
  rejectedAt?: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

export interface Job {
  id: string
  jobNumber: string
  companyId: string
  customerId: string
  siteId?: string
  assetIds: string[]
  leadId?: string
  quoteId?: string
  jobType: JobType
  tradeType: TradeType
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: JobStatus
  title: string
  description?: string
  appointmentDate?: string
  appointmentTime?: string
  estimatedDuration?: number
  assignedTechnicians: string[]
  internalNotes?: string
  faultDiagnosis?: string
  workPerformed?: string
  recommendations?: string
  partsUsed: PartUsed[]
  labourHours?: number
  timestamps: {
    assigned?: string
    enRoute?: string
    arrived?: string
    started?: string
    completed?: string
  }
  photos: Photo[]
  checklistData: Record<string, string>
  customerSignature?: string
  technicianSignature?: string
  requiresFollowUp: boolean
  hasSafetyIssue: boolean
  createdAt: string
  updatedAt: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  companyId: string
  customerId: string
  jobId?: string
  quoteId?: string
  items: LineItem[]
  subtotal: number
  discount: number
  gst: number
  total: number
  depositPaid: number
  amountDue: number
  paymentStatus: InvoiceStatus
  paymentDueDate?: string
  paymentMethod?: PaymentMethod
  paymentReference?: string
  notes?: string
  sentAt?: string
  paidAt?: string
  createdAt: string
  updatedAt: string
}

export interface ChecklistItem {
  key: string
  label: string
  options: string[]
}

export interface ChecklistTemplate {
  id: string
  companyId: string
  name: string
  tradeType: TradeType
  jobType?: JobType
  items: ChecklistItem[]
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface Database {
  companies: Company[]
  users: User[]
  customers: Customer[]
  sites: Site[]
  assets: Asset[]
  leads: Lead[]
  jobs: Job[]
  quotes: Quote[]
  invoices: Invoice[]
  checklistTemplates: ChecklistTemplate[]
  sequences: Record<string, number>
}

export interface TokenPayload {
  sub: string
  email: string
  companyId: string
  role: UserRole
  name: string
}
