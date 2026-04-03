import Link from 'next/link'
import { Users } from 'lucide-react'

type Shift = {
  id: string
  date: string
  time_start: string
  time_end: string
  role_needed: string
  value: number
  status: 'open' | 'filled' | 'completed' | 'canceled'
}

const STATUS_CONFIG = {
  open:      { label: 'Aberto',     classes: 'bg-emerald-100 text-emerald-700' },
  filled:    { label: 'Preenchido', classes: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Concluído',  classes: 'bg-slate-100 text-slate-600' },
  canceled:  { label: 'Cancelado',  classes: 'bg-red-100 text-red-600' },
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function formatTime(t: string) {
  return t.slice(0, 5) // "08:00:00" → "08:00"
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface ShiftsListProps {
  shifts: Shift[]
}

export default function ShiftsList({ shifts }: ShiftsListProps) {
  if (shifts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
        <p className="text-slate-400 text-sm">Nenhum plantão publicado ainda.</p>
        <p className="text-slate-400 text-xs mt-1">
          Clique em "Publicar Plantão" para começar.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-800">Plantões Publicados</h2>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
              <th className="px-6 py-3 font-medium">Data</th>
              <th className="px-6 py-3 font-medium">Horário</th>
              <th className="px-6 py-3 font-medium">Especialidade</th>
              <th className="px-6 py-3 font-medium">Valor</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Triagem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {shifts.map((shift) => {
              const status = STATUS_CONFIG[shift.status] ?? STATUS_CONFIG.open
              return (
                <tr key={shift.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {formatDate(shift.date)}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {formatTime(shift.time_start)} – {formatTime(shift.time_end)}
                  </td>
                  <td className="px-6 py-4 text-slate-700">{shift.role_needed}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {formatCurrency(shift.value)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.classes}`}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/manager/shifts/${shift.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-xs font-medium px-3 py-1.5 transition-colors"
                    >
                      <Users size={13} />
                      Ver Candidatos
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-slate-100">
        {shifts.map((shift) => {
          const status = STATUS_CONFIG[shift.status] ?? STATUS_CONFIG.open
          return (
            <div key={shift.id} className="px-4 py-4 flex justify-between items-start">
              <div>
                <p className="font-semibold text-slate-800 text-sm">{shift.role_needed}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatDate(shift.date)} · {formatTime(shift.time_start)}–{formatTime(shift.time_end)}
                </p>
              </div>
              <div className="text-right flex flex-col items-end gap-1.5">
                <p className="font-bold text-slate-800 text-sm">{formatCurrency(shift.value)}</p>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${status.classes}`}>
                  {status.label}
                </span>
                <Link
                  href={`/dashboard/manager/shifts/${shift.id}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-xs font-medium px-2.5 py-1 transition-colors"
                >
                  <Users size={12} />
                  Candidatos
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
