export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatCurrency(amount: number, currency = 'SGD'): string {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount)
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleString('en-SG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function formatTime(dateStr?: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export const JOB_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  awaiting_confirmation: 'Awaiting Confirmation',
  scheduled: 'Scheduled',
  assigned: 'Assigned',
  en_route: 'En Route',
  arrived: 'Arrived',
  in_progress: 'In Progress',
  awaiting_quote: 'Awaiting Quote',
  awaiting_parts: 'Awaiting Parts',
  completed: 'Completed',
  invoiced: 'Invoiced',
  paid: 'Paid',
  cancelled: 'Cancelled',
}

export const JOB_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  awaiting_confirmation: 'bg-yellow-100 text-yellow-800',
  scheduled: 'bg-blue-100 text-blue-800',
  assigned: 'bg-indigo-100 text-indigo-800',
  en_route: 'bg-purple-100 text-purple-800',
  arrived: 'bg-violet-100 text-violet-800',
  in_progress: 'bg-amber-100 text-amber-800',
  awaiting_quote: 'bg-orange-100 text-orange-800',
  awaiting_parts: 'bg-rose-100 text-rose-800',
  completed: 'bg-green-100 text-green-800',
  invoiced: 'bg-teal-100 text-teal-800',
  paid: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
}

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', sent: 'Sent', viewed: 'Viewed', approved: 'Approved', rejected: 'Rejected', expired: 'Expired',
}

export const QUOTE_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-800',
  viewed: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-orange-100 text-orange-800',
}

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', sent: 'Sent', partially_paid: 'Partially Paid', paid: 'Paid', overdue: 'Overdue', cancelled: 'Cancelled',
}

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-800',
  partially_paid: 'bg-amber-100 text-amber-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-700',
}

export const LEAD_STATUS_LABELS: Record<string, string> = {
  new: 'New', contacted: 'Contacted', site_visit: 'Site Visit', quoted: 'Quoted', won: 'Won', lost: 'Lost',
}

export const LEAD_STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-indigo-100 text-indigo-800',
  site_visit: 'bg-purple-100 text-purple-800',
  quoted: 'bg-amber-100 text-amber-800',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
}

export const JOB_TYPE_LABELS: Record<string, string> = {
  inspection: 'Inspection', repair: 'Repair', servicing: 'Servicing', preventive: 'Preventive Maintenance',
  emergency: 'Emergency Repair', installation: 'Installation', replacement: 'Replacement',
  survey: 'Site Survey', warranty: 'Warranty Callback', defect: 'Defect Rectification', followup: 'Follow-up Visit',
}

export const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-gray-500', normal: 'text-blue-500', high: 'text-amber-500', urgent: 'text-red-500',
}
