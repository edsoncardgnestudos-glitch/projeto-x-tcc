import { approveShiftSwap, rejectShiftSwap } from '@/app/actions/swaps'
import { ArrowLeftRight, CheckCircle2, XCircle } from 'lucide-react'

type SwapRequest = {
  id: string
  shift_id: string
  target_professional_id: string
  reason: string
  created_at: string
  shifts: { date: string; time_start: string; time_end: string; role_needed: string } | null
  original_profile: { full_name: string | null; crm_coren: string | null } | null
  target_profile: { full_name: string | null; crm_coren: string | null } | null
}

function fmt(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}
function fmtTime(t: string) { return t.slice(0, 5) }

interface Props {
  swapRequests: SwapRequest[]
}

export default function SwapRequests({ swapRequests }: Props) {
  if (swapRequests.length === 0) return null

  return (
    <section className="mb-8">
      {/* Alert header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-amber-100 text-amber-600 rounded-lg p-1.5">
          <ArrowLeftRight size={16} />
        </div>
        <h2 className="text-base font-bold text-slate-800">
          Solicitações de Troca Pendentes
        </h2>
        <span className="ml-1 inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold w-5 h-5">
          {swapRequests.length}
        </span>
      </div>

      <div className="space-y-3">
        {swapRequests.map((swap) => {
          const shift = swap.shifts
          const orig  = swap.original_profile
          const tgt   = swap.target_profile

          const approveAction = approveShiftSwap.bind(
            null,
            swap.id,
            swap.shift_id,
            swap.target_professional_id
          )
          const rejectAction = rejectShiftSwap.bind(null, swap.id)

          return (
            <div
              key={swap.id}
              className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden"
            >
              {/* Linha de destaque */}
              <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />

              <div className="p-5">
                {/* Plantão */}
                {shift && (
                  <p className="text-xs text-slate-500 mb-2 font-medium">
                    {shift.role_needed} · {fmt(shift.date)} ·{' '}
                    {fmtTime(shift.time_start)}–{fmtTime(shift.time_end)}
                  </p>
                )}

                {/* Resumo da troca */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="font-bold text-slate-800 text-sm">
                    {orig?.full_name ?? 'Profissional'}
                  </span>
                  {orig?.crm_coren && (
                    <span className="text-xs text-indigo-500">{orig.crm_coren}</span>
                  )}
                  <ArrowLeftRight size={13} className="text-amber-500 shrink-0" />
                  <span className="font-bold text-slate-800 text-sm">
                    {tgt?.full_name ?? 'Substituto'}
                  </span>
                  {tgt?.crm_coren && (
                    <span className="text-xs text-indigo-500">{tgt.crm_coren}</span>
                  )}
                </div>

                {/* Motivo */}
                <div className="bg-slate-50 rounded-xl px-3 py-2.5 mb-4">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">Motivo:</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{swap.reason}</p>
                </div>

                {/* Ações */}
                <div className="flex gap-2">
                  <form action={approveAction} className="flex-1">
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 transition-colors"
                    >
                      <CheckCircle2 size={15} />
                      Aprovar Troca
                    </button>
                  </form>
                  <form action={rejectAction} className="flex-1">
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-sm font-bold py-2.5 transition-colors border border-slate-200 hover:border-red-200"
                    >
                      <XCircle size={15} />
                      Recusar
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
