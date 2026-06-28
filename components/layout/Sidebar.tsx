'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Briefcase, Users, MapPin, Cpu, FileText,
  Receipt, Settings, UserCog, PhoneIncoming, X, Zap, ClipboardList
} from 'lucide-react'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/leads', label: 'Leads & Enquiries', icon: PhoneIncoming },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/sites', label: 'Sites', icon: MapPin },
  { href: '/assets', label: 'Assets', icon: Cpu },
  { href: '/quotes', label: 'Quotations', icon: FileText },
  { href: '/invoices', label: 'Invoices', icon: Receipt },
]

const settingsNav = [
  { href: '/checklists', label: 'Checklists', icon: ClipboardList },
  { href: '/users', label: 'Users & Roles', icon: UserCog },
  { href: '/settings', label: 'Company Settings', icon: Settings },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 flex flex-col transition-transform duration-200 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0 lg:static lg:z-auto'
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg">ServiceOps</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive(href)
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
              )}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}

          <div className="pt-4 pb-1 px-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Administration</p>
          </div>

          {settingsNav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive(href)
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
              )}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700/50">
          <p className="text-xs text-slate-500">ServiceOps v1.0 MVP</p>
        </div>
      </aside>
    </>
  )
}
