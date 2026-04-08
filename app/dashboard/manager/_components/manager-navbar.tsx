'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import { Stethoscope, LogOut, LayoutDashboard, CalendarDays } from 'lucide-react'

interface ManagerNavbarProps {
  hospitalName: string
}

const TABS = [
  { label: 'Painel',      href: '/dashboard/manager',            icon: LayoutDashboard },
  { label: 'Calendário',  href: '/dashboard/manager/calendario', icon: CalendarDays },
]

export default function ManagerNavbar({ hospitalName }: ManagerNavbarProps) {
  const pathname = usePathname()

  return (
    <nav className="bg-slate-900 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          {/* Logo + Hospital */}
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500 rounded-xl p-1.5">
              <Stethoscope size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400 leading-none">Projeto X</p>
              <p className="text-sm font-semibold leading-tight truncate max-w-[200px]">
                {hospitalName}
              </p>
            </div>
          </div>

          {/* Sign out */}
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
            >
              <LogOut size={16} />
              Sair
            </button>
          </form>
        </div>

        {/* Abas de navegação */}
        <div className="flex gap-1 pb-0">
          {TABS.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/dashboard/manager' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2',
                  isActive
                    ? 'bg-slate-800 text-white border-indigo-500'
                    : 'text-slate-400 hover:text-white border-transparent hover:bg-slate-800/50',
                ].join(' ')}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
