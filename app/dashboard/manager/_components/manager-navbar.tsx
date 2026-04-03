import { signOut } from '@/app/actions/auth'
import { Stethoscope, LogOut } from 'lucide-react'

interface ManagerNavbarProps {
  hospitalName: string
}

export default function ManagerNavbar({ hospitalName }: ManagerNavbarProps) {
  return (
    <nav className="bg-slate-900 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

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
    </nav>
  )
}
