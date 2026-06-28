'use client'
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import type { ChecklistTemplate, ChecklistItem, TradeType } from '@/lib/types'

const TRADE_OPTIONS = [
  { value: 'aircon', label: 'Air-conditioning' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'maintenance', label: 'General Maintenance' },
  { value: 'multi', label: 'Multi-trade' },
]

const TRADE_COLORS: Record<string, string> = {
  aircon: 'info', electrical: 'warning', plumbing: 'success', maintenance: 'purple', multi: 'info',
}

const DEFAULT_OPTIONS = ['Good', 'Fair', 'Poor', 'N/A', 'Pass', 'Fail', 'Clean', 'Dirty', 'Normal', 'Faulty', 'Replaced']

function ItemEditor({ items, onChange }: { items: ChecklistItem[]; onChange: (items: ChecklistItem[]) => void }) {
  function updateItem(i: number, field: keyof ChecklistItem, value: string | string[]) {
    const next = [...items]
    next[i] = { ...next[i], [field]: value }
    onChange(next)
  }

  function addItem() {
    onChange([...items, { key: `item_${Date.now()}`, label: '', options: ['Good', 'Fair', 'Poor', 'N/A'] }])
  }

  function removeItem(i: number) {
    onChange(items.filter((_, idx) => idx !== i))
  }

  function updateOptions(i: number, raw: string) {
    updateItem(i, 'options', raw.split(',').map(s => s.trim()).filter(Boolean))
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={item.key} className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 w-5 text-center">{i + 1}</span>
            <input
              className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Item label (e.g. Air Filter Condition)"
              value={item.label}
              onChange={e => updateItem(i, 'label', e.target.value)}
            />
            <button type="button" onClick={() => removeItem(i)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 pl-7">
            <span className="text-xs text-gray-500 flex-shrink-0">Options:</span>
            <input
              className="flex-1 text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Good, Fair, Poor, N/A"
              value={item.options.join(', ')}
              onChange={e => updateOptions(i, e.target.value)}
            />
          </div>
        </div>
      ))}
      <button type="button" onClick={addItem}
        className="w-full border border-dashed border-gray-300 rounded-xl py-2.5 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> Add Item
      </button>
    </div>
  )
}

const emptyForm = (): Partial<ChecklistTemplate> => ({
  name: '', tradeType: 'aircon', items: [
    { key: 'item_1', label: '', options: ['Good', 'Fair', 'Poor', 'N/A'] },
  ],
})

export default function ChecklistsPage() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [tradeFilter, setTradeFilter] = useState<TradeType | ''>('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [modal, setModal] = useState<'new' | 'edit' | null>(null)
  const [editTarget, setEditTarget] = useState<ChecklistTemplate | null>(null)
  const [form, setForm] = useState<Partial<ChecklistTemplate>>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/checklists')
      .then(r => r.json())
      .then(d => { setTemplates(d); setLoading(false) })
  }, [])

  function openNew() {
    setForm(emptyForm())
    setEditTarget(null)
    setModal('new')
  }

  function openEdit(t: ChecklistTemplate) {
    setForm({ name: t.name, tradeType: t.tradeType, jobType: t.jobType, items: JSON.parse(JSON.stringify(t.items)) })
    setEditTarget(t)
    setModal('edit')
  }

  async function save() {
    if (!form.name?.trim() || !form.tradeType) return
    setSaving(true)
    if (modal === 'new') {
      const res = await fetch('/api/checklists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { const t = await res.json(); setTemplates(prev => [...prev, t]) }
    } else if (editTarget) {
      const res = await fetch(`/api/checklists/${editTarget.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { const t = await res.json(); setTemplates(prev => prev.map(x => x.id === t.id ? t : x)) }
    }
    setSaving(false)
    setModal(null)
  }

  async function deleteTemplate(id: string) {
    const res = await fetch(`/api/checklists/${id}`, { method: 'DELETE' })
    if (res.ok) setTemplates(prev => prev.filter(t => t.id !== id))
    else {
      const err = await res.json()
      alert(err.error || 'Cannot delete this template')
    }
    setDeleteConfirm(null)
  }

  const filtered = templates.filter(t => !tradeFilter || t.tradeType === tradeFilter)

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Checklist Templates</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure service checklists by trade type</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> New Template</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setTradeFilter('')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${tradeFilter === '' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
          All ({templates.length})
        </button>
        {TRADE_OPTIONS.map(opt => {
          const count = templates.filter(t => t.tradeType === opt.value).length
          if (!count) return null
          return (
            <button key={opt.value} onClick={() => setTradeFilter(opt.value as TradeType)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${tradeFilter === opt.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
              {opt.label} ({count})
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No templates yet</p>
          <p className="text-sm text-gray-400 mt-1">Create your first checklist template to get started</p>
          <Button onClick={openNew} className="mt-4"><Plus className="w-4 h-4" /> New Template</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-4 px-4 py-3.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{t.name}</span>
                    <Badge variant={TRADE_COLORS[t.tradeType] as 'info' | 'warning' | 'success' | 'purple'}>
                      {TRADE_OPTIONS.find(o => o.value === t.tradeType)?.label}
                    </Badge>
                    {t.isDefault && <Badge variant="info">Default</Badge>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{t.items.length} checklist items</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(t)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  {!t.isDefault && (
                    <button onClick={() => setDeleteConfirm(t.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => setExpanded(expanded === t.id ? null : t.id)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                    {expanded === t.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {expanded === t.id && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {t.items.map((item, i) => (
                    <div key={item.key} className="flex items-start gap-3 px-4 py-2.5">
                      <span className="text-xs text-gray-400 font-mono w-5 text-right mt-0.5">{i + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{item.label || <span className="italic text-gray-400">Unnamed item</span>}</p>
                        <div className="flex gap-1.5 flex-wrap mt-1">
                          {item.options.map(opt => (
                            <span key={opt} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{opt}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  {t.items.length === 0 && <p className="px-4 py-3 text-sm text-gray-400 italic">No items in this template</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'new' ? 'New Checklist Template' : 'Edit Template'}>
        <div className="space-y-4">
          <Input label="Template Name *" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Aircon Annual Service" />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Trade Type *</label>
            <select
              value={form.tradeType || ''}
              onChange={e => setForm(f => ({ ...f, tradeType: e.target.value as TradeType }))}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              {TRADE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Checklist Items</p>
            <p className="text-xs text-gray-400 mb-3">Enter a label per item. Options are comma-separated — technicians tap to select one.</p>
            <ItemEditor items={form.items || []} onChange={items => setForm(f => ({ ...f, items }))} />
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Cancel</Button>
            <Button onClick={save} loading={saving} disabled={!form.name?.trim()} className="flex-1">
              {modal === 'new' ? 'Create Template' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Template?" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">This template will be permanently deleted. This cannot be undone.</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1">Cancel</Button>
            <Button onClick={() => deleteConfirm && deleteTemplate(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-700">Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
