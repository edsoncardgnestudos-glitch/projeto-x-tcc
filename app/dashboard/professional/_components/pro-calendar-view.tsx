'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Building2 } from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
export type ProShift = {
  id: string
  date: string
  time_start: string
  time_end: string
  role_needed: string
  value: number
  status: 'open' | 'filled' | 'completed' | 'canceled'
  hospital_name: string | null
  my_role: 'titular' | 'reserva1' | 'reserva2'
}

/* ------------------------------------------------------------------ */
/* Configuração visual                                                  */
/* ------------------------------------------------------------------ */
const ROLE_STYLE = {
  titular:  { bg: 'bg-indigo-500',  text: 'text-white', badge: 'Titular',   badgeCls: 'bg-indigo-100 text-indigo-700' },
  reserva1: { bg: 'bg-blue-400',    text: 'text-white', badge: 'Reserva 1', badgeCls: 'bg-blue-100 text-blue-700' },
  reserva2: { bg: 'bg-sky-400',     text: 'text-white', badge: 'Reserva 2', badgeCls: 'bg-sky-100 text-sky-700' },
}

const STATUS_OVERLAY = {
  completed: 'opacity-60',
  canceled:  'opacity-40 line-through',
  filled:    '',
  open:      '',
}

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]
const WEEKDAYS_SHORT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

function fmtTime(t: string) { return t.slice(0, 5) }
function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */
export default function ProCalendarView({
  year,
  month,
  shifts,
}: {
  year: number
  month: number  // 1–12
  shifts: ProShift[]
}) {
  const router = useRouter()

  // Mapa data → plantões
  const byDate: Record<string, ProShift[]> = {}
  for (const s of shifts) {
    if (!byDate[s.date]) byDate[s.date] = []
    byDate[s.date].push(s)
  }

  const firstWeekday = new Date(year, month - 1, 1).getDay()
  const daysInMonth  = new Date(year, month, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function navigate(delta: number) {
    let m = month + delta
    let y = year
    if (m < 1)  { m = 12; y -= 1 }
    if (m > 12) { m = 1;  y += 1 }
    router.push(`/dashboard/professional?tab=calendario&year=${y}&month=${m}`)
  }

  const todayStr = new Date().toISOString().slice(0, 10)

  // Resumo do mês
  const totalShifts   = shifts.filter(s => s.status !== 'canceled').length
  const totalEarnings = shifts
    .filter(s => s.status === 'completed')
    .reduce((acc, s) => acc + s.value, 0)
  const upcoming = shifts.filter(s => s.status === 'filled' && s.date >= todayStr).length

  return (
    <div className="space-y-4">

      {/* Header + navegação */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Minha Escala</h1>
          <p className="text-slate-500 text-sm mt-0.5">Visualização de plantões por dia</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <span className="text-base font-bold text-slate-800 min-w-[160px] text-center">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button
            onClick={() => navigate(+1)}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <ChevronRight size={18} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-3">
          <span className="w-3 h-10 rounded-full bg-indigo-500 shrink-0" />
          <div>
            <p className="text-2xl font-bold text-slate-800">{totalShifts}</p>
            <p className="text-xs text-slate-500">Plantões</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-3">
          <span className="w-3 h-10 rounded-full bg-emerald-500 shrink-0" />
          <div>
            <p className="text-2xl font-bold text-slate-800">{upcoming}</p>
            <p className="text-xs text-slate-500">Próximos</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-3">
          <span className="w-3 h-10 rounded-full bg-amber-400 shrink-0" />
          <div>
            <p className="text-xl font-bold text-slate-800 truncate">
              {totalEarnings > 0 ? fmtBRL(totalEarnings) : '—'}
            </p>
            <p className="text-xs text-slate-500">Recebido</p>
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex gap-3 flex-wrap">
        {(Object.entries(ROLE_STYLE) as [keyof typeof ROLE_STYLE, typeof ROLE_STYLE[keyof typeof ROLE_STYLE]][]).map(
          ([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-sm ${cfg.bg}`} />
              <span className="text-[10px] text-slate-500">{cfg.badge}</span>
            </div>
          )
        )}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 opacity-50" />
          <span className="text-[10px] text-slate-500">Cancelado</span>
        </div>
      </div>

      {/* Grid do calendário */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        {/* Cabeçalho dos dias */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {WEEKDAYS_SHORT.map((d, i) => (
            <div
              key={i}
              className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Semanas */}
        {Array.from({ length: cells.length / 7 }, (_, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7 border-b border-slate-50 last:border-b-0">
            {cells.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, dayIdx) => {
              if (day === null) {
                return (
                  <div
                    key={`blank-${weekIdx}-${dayIdx}`}
                    className="min-h-[110px] bg-slate-50/60 border-r border-slate-50 last:border-r-0"
                  />
                )
              }

              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayShifts = byDate[dateStr] ?? []
              const isToday = dateStr === todayStr
              const isPast  = dateStr < todayStr

              return (
                <div
                  key={day}
                  className={[
                    'min-h-[110px] p-1.5 border-r border-slate-50 last:border-r-0 flex flex-col gap-1',
                    isPast && !isToday ? 'bg-slate-50/30' : '',
                  ].join(' ')}
                >
                  {/* Número do dia */}
                  <div className="flex justify-end mb-0.5">
                    <span
                      className={[
                        'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full',
                        isToday
                          ? 'bg-indigo-600 text-white'
                          : isPast
                          ? 'text-slate-300'
                          : 'text-slate-600',
                      ].join(' ')}
                    >
                      {day}
                    </span>
                  </div>

                  {/* Plantões */}
                  {dayShifts.map((shift) => {
                    const roleCfg = ROLE_STYLE[shift.my_role]
                    const overlayCls = shift.status === 'canceled'
                      ? 'opacity-40 bg-slate-400'
                      : shift.status === 'completed'
                      ? `${roleCfg.bg} opacity-60`
                      : roleCfg.bg

                    return (
                      <div
                        key={shift.id}
                        className={[
                          'rounded-lg px-2 py-1.5 text-[10px] leading-tight text-white',
                          overlayCls,
                        ].join(' ')}
                        title={`${shift.role_needed} — ${shift.hospital_name ?? ''}`}
                      >
                        <p className="font-bold opacity-90">
                          {fmtTime(shift.time_start)}–{fmtTime(shift.time_end)}
                        </p>
                        <p className="truncate mt-0.5 opacity-95 font-medium">
                          {shift.role_needed}
                        </p>
                        {shift.hospital_name && (
                          <p className="truncate mt-0.5 opacity-80">
                            {shift.hospital_name}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Lista detalhada dos plantões do mês */}
      {shifts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-1">
            Detalhes do mês
          </p>
          {shifts
            .slice()
            .sort((a, b) => a.date.localeCompare(b.date) || a.time_start.localeCompare(b.time_start))
            .map((shift) => {
              const roleCfg = ROLE_STYLE[shift.my_role]
              const isCanceled = shift.status === 'canceled'
              return (
                <div
                  key={shift.id}
                  className={[
                    'bg-white rounded-2xl border shadow-sm overflow-hidden',
                    isCanceled ? 'opacity-50 border-slate-100' : 'border-slate-100',
                  ].join(' ')}
                >
                  <div className={`h-1 ${isCanceled ? 'bg-slate-300' : roleCfg.bg}`} />
                  <div className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={[
                            'text-[10px] font-bold px-2 py-0.5 rounded-full',
                            isCanceled ? 'bg-slate-100 text-slate-400' : roleCfg.badgeCls,
                          ].join(' ')}
                        >
                          {isCanceled ? 'Cancelado' : roleCfg.badge}
                        </span>
                        {shift.status === 'completed' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            Concluído
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {shift.role_needed}
                      </p>
                      {shift.hospital_name && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                          <Building2 size={10} />
                          {shift.hospital_name}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-slate-700">
                        {String(shift.date.split('-')[2]).padStart(2,'0')}/
                        {String(shift.date.split('-')[1]).padStart(2,'0')}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {fmtTime(shift.time_start)}–{fmtTime(shift.time_end)}
                      </p>
                      <p className="text-sm font-extrabold text-indigo-600 mt-1">
                        {fmtBRL(shift.value)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {shifts.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <p className="text-slate-400 text-sm font-medium">Nenhum plantão neste mês.</p>
          <p className="text-slate-300 text-xs mt-1">Navegue para outro mês ou candidate-se a novas vagas.</p>
        </div>
      )}
    </div>
  )
}
