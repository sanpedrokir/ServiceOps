'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap } from 'lucide-react'

export default function TechLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setUser(data.user); else router.push('/login') })
  }, [])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-lg mx-auto">
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 safe-area-inset-top">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none">ServiceOps</p>
            {user && <p className="text-xs text-slate-400 leading-none mt-0.5">{user.name}</p>}
          </div>
        </div>
        <button onClick={logout} className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded">
          Sign Out
        </button>
      </header>
      <main className="pb-20">{children}</main>
    </div>
  )
}
