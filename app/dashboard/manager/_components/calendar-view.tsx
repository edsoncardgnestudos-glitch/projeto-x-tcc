'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
type ShiftRow = {
  id: string
  date: string
  time_start: string
  time_end: string
  role_needed: string
  status: 'open' | 'filled' | 'completed' | 'canceled'
  main_professional_id: string | null
  professional_name: string | null
}

/* ------------------------------------------------------------------ */
/* Config de cores por status                                           */
/* ------------------------------------------------------------------ */
const STATUS_STYLE = {
  open:      { bg: 'bg-emerald-500', text: 'text-white',      dot: 'bg-emerald-400', label: 'Aberto' },
  filled:    { bg: 'bg-indigo-500',  text: 'text-white',      dot: 'bg-indigo-400',  label: 'Preenchido' },
  completed: { bg: 'bg-slate-400',   text: 'text-white',      dot: 'bg-slate-300',   label: 'Concluído' },
  canceled:  { bg: 'bg-red-400',     text: 'text-white',      dot: 'bg-red-300',     label: 'Cancelado' },
}

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]
const WEEKDAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

function fmtTime(t: string) { return t.slice(0, 5) }

/* ------------------------------------------------------------------ */
/* CalendarView                                                         */
/* ------------------------------------------------------------------ */
export default function CalendarView({
  year,
  month,
  shifts,
}: {
  year: number
  month: number   // 1-12
  shifts: ShiftRow[]
}) {
  const router = useRouter()

  // Mapa: "YYYY-MM-DD" → ShiftRow[]
  const shiftsByDate: Record<string, ShiftRow[]> = {}
  for (const s of shifts) {
    if (!shiftsByDate[s.date]) shiftsByDate[s.date] = []
    shiftsByDate[s.date].push(s)
  }

  // Montar grid: primeiro dia da semana e total de dias
  const firstWeekday = new Date(year, month - 1, 1).getDay()  // 0=Dom
  const daysInMonth  = new Date(year, month, 0).getDate()

  // Células: null para espaços em branco antes do dia 1
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Completa última linha com nulls
  while (cells.length % 7 !== 0) cells.push(null)

  function navigate(delta: number) {
    let m = month + delta
    let y = year
    if (m < 1)  { m = 12; y -= 1 }
    if (m > 12) { m = 1;  y += 1 }
    router.push(`/dashboard/manager/calendario?year=${y}&month=${m}`)
  }

  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Escala Mensal
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Visualização de plantões por dia
          </p>
        </div>

        {/* Navegação de mês */}
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

      {/* Legenda */}
      <div className="flex flex-wrap gap-3">
        {(Object.entries(STATUS_STYLE) as [keyof typeof STATUS_STYLE, typeof STATUS_STYLE[keyof typeof STATUS_STYLE]][]).map(
          ([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-sm ${cfg.bg}`} />
              <span className="text-xs text-slate-500">{cfg.label}</span>
            </div>
          )
        )}
      </div>

      {/* Grid do calendário */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
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
              const dayShifts = shiftsByDate[dateStr] ?? []
              const isToday = dateStr === todayStr
              const isSunday = (firstWeekday + day - 1) % 7 === 0
              const isSaturday = (firstWeekday + day - 1) % 7 === 6

              return (
                <div
                  key={day}
                  className={[
                    'min-h-[110px] p-1.5 border-r border-slate-50 last:border-r-0 flex flex-col gap-1',
                    isSunday || isSaturday ? 'bg-slate-50/50' : '',
                  ].join(' ')}
                >
                  {/* Número do dia */}
                  <div className="flex justify-end mb-0.5">
                    <span
                      className={[
                        'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full',
                        isToday
                          ? 'bg-indigo-600 text-white'
                          : isSunday || isSaturday
                          ? 'text-slate-400'
                          : 'text-slate-600',
                      ].join(' ')}
                    >
                      {day}
                    </span>
                  </div>

                  {/* Plantões do dia */}
                  {dayShifts.map((shift) => {
                    const cfg = STATUS_STYLE[shift.status] ?? STATUS_STYLE.open
                    return (
                      <Link
                        key={shift.id}
                        href={`/dashboard/manager/shifts/${shift.id}`}
                        className={[
                          'block rounded-lg px-2 py-1.5 text-[10px] leading-tight cursor-pointer hover:opacity-90 transition-opacity',
                          cfg.bg,
                          cfg.text,
                        ].join(' ')}
                      >
                        {/* Horário */}
                        <p className="font-bold opacity-90">
                          {fmtTime(shift.time_start)}–{fmtTime(shift.time_end)}
                        </p>
                        {/* Especialidade (truncada) */}
                        <p className="truncate mt-0.5 opacity-95 font-medium">
                          {shift.role_needed}
                        </p>
                        {/* Nome do profissional (se preenchido) */}
                        {shift.professional_name && (
                          <p className="truncate mt-0.5 opacity-80">
                            {shift.professional_name.split(' ').slice(0, 2).join(' ')}
                          </p>
                        )}
                      </Link>
                    )
                  })}

                  {/* Indicador de +N quando há muitos plantões */}
                  {dayShifts.length === 0 && (
                    <div className="flex-1" />
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Resumo do mês */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(Object.entries(STATUS_STYLE) as [keyof typeof STATUS_STYLE, typeof STATUS_STYLE[keyof typeof STATUS_STYLE]][]).map(
          ([key, cfg]) => {
            const count = shifts.filter((s) => s.status === key).length
            return (
              <div
                key={key}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-3"
              >
                <span className={`w-3 h-10 rounded-full ${cfg.bg} shrink-0`} />
                <div>
                  <p className="text-2xl font-bold text-slate-800">{count}</p>
                  <p className="text-xs text-slate-500">{cfg.label}</p>
                </div>
              </div>
            )
          }
        )}
      </div>
    </div>
  )
}
