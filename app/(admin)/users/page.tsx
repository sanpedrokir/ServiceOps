'use client'
import { useState, useEffect } from 'react'
import { Plus, UserCheck, UserX, Shield } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import type { User } from '@/lib/types'

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  dispatcher: 'bg-indigo-100 text-indigo-800',
  technician: 'bg-green-100 text-green-800',
  finance: 'bg-amber-100 text-amber-800',
  storekeeper: 'bg-teal-100 text-teal-800',
  readonly: 'bg-gray-100 text-gray-700',
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner', admin: 'Admin', dispatcher: 'Dispatcher',
  technician: 'Technician', finance: 'Finance', storekeeper: 'Storekeeper', readonly: 'Read-Only',
}

const SKILLS = [
  'aircon_servicing', 'aircon_installation', 'electrical_troubleshooting', 'plumbing_repair', 'water_heater_installation',
]

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [newModal, setNewModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'technician', skills: [] as string[] })

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(d => { setUsers(d); setLoading(false) })
  }, [])

  async function toggleActive(user: User) {
    const res = await fetch(`/api/users/${user.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !user.isActive }) })
    if (res.ok) { const u = await res.json(); setUsers(prev => prev.map(x => x.id === user.id ? { ...x, ...u } : x)) }
  }

  function toggleSkill(skill: string) {
    setForm(f => ({ ...f, skills: f.skills.includes(skill) ? f.skills.filter(s => s !== skill) : [...f.skills, skill] }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) {
      const user = await res.json()
      setUsers(prev => [...prev, user])
      setNewModal(false)
      setForm({ name: '', email: '', phone: '', role: 'technician', skills: [] })
    }
    setSaving(false)
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users & Roles</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.filter(u => u.isActive).length} active of {users.length} total</p>
        </div>
        <Button onClick={() => setNewModal(true)}><Plus className="w-4 h-4" /> Invite User</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="p-8 text-center"><div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="divide-y divide-gray-50">
            {users.map(user => (
              <div key={user.id} className={`flex items-center gap-4 px-4 sm:px-5 py-4 ${!user.isActive ? 'opacity-60' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${user.isActive ? 'bg-blue-600' : 'bg-gray-400'}`}>
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                    {!user.isActive && <span className="text-xs text-red-500 font-medium">(Inactive)</span>}
                  </div>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  {user.skills && user.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.skills.map(s => (
                        <span key={s} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{s.replace(/_/g, ' ')}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[user.role]}`}>{ROLE_LABELS[user.role]}</span>
                  <button onClick={() => toggleActive(user)} title={user.isActive ? 'Deactivate' : 'Activate'}
                    className={`p-1.5 rounded-lg transition-colors ${user.isActive ? 'text-red-400 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}>
                    {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Role Permissions</p>
            <ul className="space-y-0.5 text-xs text-blue-700">
              <li><strong>Owner</strong> — Full access to all features</li>
              <li><strong>Admin</strong> — Jobs, customers, quotes, invoices</li>
              <li><strong>Dispatcher</strong> — Jobs, schedules, technicians</li>
              <li><strong>Technician</strong> — Assigned jobs, checklists, photos</li>
              <li><strong>Finance</strong> — Quotes, invoices, payment tracking</li>
            </ul>
          </div>
        </div>
      </div>

      <Modal open={newModal} onClose={() => setNewModal(false)} title="Invite User" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Full Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Input label="Email Address *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          <Input label="Phone" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <Select label="Role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
            options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))} />
          {['technician', 'admin'].includes(form.role) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map(skill => (
                  <label key={skill} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-xs font-medium transition-colors ${form.skills.includes(skill) ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                    <input type="checkbox" checked={form.skills.includes(skill)} onChange={() => toggleSkill(skill)} className="hidden" />
                    {skill.replace(/_/g, ' ')}
                  </label>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500 bg-gray-50 rounded p-2">Default password: <strong>Password123!</strong> — user should change on first login</p>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setNewModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create User</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
