'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const [email, setEmail] = useState('john@airtech.sg')
  const [password, setPassword] = useState('password123')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }

      if (data.user.role === 'technician') {
        router.push('/tech/my-jobs')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const demoUsers = [
    { label: 'Business Owner', email: 'john@airtech.sg', note: 'Full access' },
    { label: 'Admin', email: 'sarah@airtech.sg', note: 'Operations access' },
    { label: 'Dispatcher', email: 'mike@airtech.sg', note: 'Schedule & dispatch' },
    { label: 'Technician', email: 'david@airtech.sg', note: 'Mobile portal' },
    { label: 'Finance', email: 'amy@airtech.sg', note: 'Invoices & payments' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-500 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">ServiceOps</h1>
            <p className="text-blue-300 mt-1 text-sm">Field Service Management Platform</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
            <h2 className="text-white font-semibold text-lg mb-5">Sign In</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-blue-200">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-blue-200">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 pr-10 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-400/30 rounded-lg px-3 py-2.5">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full bg-blue-500 hover:bg-blue-400 text-white border-0 py-2.5 rounded-lg font-semibold mt-2">
                Sign In
              </Button>
            </form>
          </div>

          <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3">Demo Accounts (password: password123)</p>
            <div className="space-y-2">
              {demoUsers.map(u => (
                <button
                  key={u.email}
                  onClick={() => setEmail(u.email)}
                  className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors group"
                >
                  <span>
                    <span className="text-white text-sm font-medium">{u.label}</span>
                    <span className="text-blue-300 text-xs ml-2">{u.note}</span>
                  </span>
                  <span className="text-blue-400 text-xs opacity-0 group-hover:opacity-100">{u.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-center p-12 bg-blue-950/30">
        <div className="max-w-md text-center">
          <h2 className="text-4xl font-bold text-white leading-tight mb-6">
            One Platform for Your<br />
            <span className="text-blue-400">Service Business</span>
          </h2>
          <div className="grid grid-cols-2 gap-4 text-left">
            {[
              { icon: '📋', title: 'Job Management', desc: 'Full job lifecycle tracking' },
              { icon: '📱', title: 'Mobile Technicians', desc: 'Complete jobs on the go' },
              { icon: '💰', title: 'Quotes & Invoices', desc: 'Professional documents fast' },
              { icon: '📊', title: 'Live Dashboard', desc: 'Real-time business overview' },
              { icon: '🔧', title: 'Asset Tracking', desc: 'Full service history per asset' },
              { icon: '👥', title: 'Customer Portal', desc: 'Approve quotes, view reports' },
            ].map(f => (
              <div key={f.title} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-2xl mb-2">{f.icon}</div>
                <p className="text-white font-semibold text-sm">{f.title}</p>
                <p className="text-blue-300 text-xs mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
