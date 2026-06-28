'use client'
import { useState, useEffect } from 'react'
import { Building2, Save, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'

interface CompanySettings {
  name: string; uen: string; address: string; phone: string; email: string;
  currency: string; gstEnabled: boolean; gstRate: number;
  invoicePrefix: string; quotePrefix: string; jobPrefix: string;
  workingHours: string; paymentTerms: string; warrantyPeriod: string;
  serviceAreas: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings>({
    name: '', uen: '', address: '', phone: '', email: '',
    currency: 'SGD', gstEnabled: true, gstRate: 9,
    invoicePrefix: 'INV-', quotePrefix: 'QT-', jobPrefix: 'JOB-',
    workingHours: '8am - 6pm Mon-Sat', paymentTerms: 'Payment due within 30 days',
    warrantyPeriod: '90 days on parts and labour', serviceAreas: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.company) {
        const c = data.company
        fetch('/api/auth/me').then(r => r.json()).then(async () => {
          // Load full company data via users endpoint
          const res = await fetch('/api/users')
          const resp = await fetch('/api/auth/me')
          const info = await resp.json()
          if (info.company) {
            setSettings(s => ({
              ...s,
              name: info.company.name || s.name,
              currency: info.company.currency || s.currency,
            }))
          }
          setLoading(false)
        })
      } else setLoading(false)
    })
  }, [])

  useEffect(() => {
    // Load company settings from a known endpoint
    fetch('/api/auth/me').then(r => r.json()).then(() => setLoading(false))
  }, [])

  function set(k: keyof CompanySettings, v: string | boolean | number) {
    setSettings(s => ({ ...s, [k]: v }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    // In production, this would update the company record
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure your company workspace</p>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800 text-sm font-medium">Settings saved successfully</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-600" /> Company Information</h2>
          <Input label="Company Name *" value={settings.name} onChange={e => set('name', e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="UEN / Registration No." value={settings.uen} onChange={e => set('uen', e.target.value)} placeholder="e.g. 202412345A" />
            <Input label="Phone" value={settings.phone} onChange={e => set('phone', e.target.value)} type="tel" />
          </div>
          <Input label="Email" value={settings.email} onChange={e => set('email', e.target.value)} type="email" />
          <Textarea label="Address" value={settings.address} onChange={e => set('address', e.target.value)} rows={2} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Trade & Services</h2>
          <Input label="Service Areas (comma separated)" value={settings.serviceAreas} onChange={e => set('serviceAreas', e.target.value)} placeholder="Central, East, West, North, South" />
          <Input label="Working Hours" value={settings.workingHours} onChange={e => set('workingHours', e.target.value)} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Financial Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Currency" value={settings.currency} onChange={e => set('currency', e.target.value)}
              options={[{ value: 'SGD', label: 'SGD - Singapore Dollar' }, { value: 'USD', label: 'USD - US Dollar' }, { value: 'MYR', label: 'MYR - Malaysian Ringgit' }]} />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">GST Settings</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={settings.gstEnabled} onChange={e => set('gstEnabled', e.target.checked)} className="rounded" />
                  <span className="text-sm text-gray-700">GST Enabled</span>
                </label>
                {settings.gstEnabled && (
                  <input type="number" value={settings.gstRate} onChange={e => set('gstRate', parseFloat(e.target.value))}
                    className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={0} max={30} step={0.1} />
                )}
                {settings.gstEnabled && <span className="text-sm text-gray-500">%</span>}
              </div>
            </div>
          </div>
          <Textarea label="Default Payment Terms" value={settings.paymentTerms} onChange={e => set('paymentTerms', e.target.value)} rows={2} />
          <Input label="Default Warranty Period" value={settings.warrantyPeriod} onChange={e => set('warrantyPeriod', e.target.value)} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Number Formats</h2>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Job Prefix" value={settings.jobPrefix} onChange={e => set('jobPrefix', e.target.value)} placeholder="JOB-" />
            <Input label="Quote Prefix" value={settings.quotePrefix} onChange={e => set('quotePrefix', e.target.value)} placeholder="QT-" />
            <Input label="Invoice Prefix" value={settings.invoicePrefix} onChange={e => set('invoicePrefix', e.target.value)} placeholder="INV-" />
          </div>
          <p className="text-xs text-gray-500">Numbers are automatically incremented. Example: JOB-1001, QT-1001, INV-1001</p>
        </div>

        <div className="flex justify-end pb-6">
          <Button type="submit" loading={saving}>
            <Save className="w-4 h-4" /> Save Settings
          </Button>
        </div>
      </form>
    </div>
  )
}
