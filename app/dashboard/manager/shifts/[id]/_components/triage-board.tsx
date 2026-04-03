'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { assignShiftCandidates } from '@/app/actions/shifts'
import { UserCircle2, CheckCircle2, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
type Candidate = {
  application_id: string
  professional_id: string
  current_status: string
  full_name: string | null
  crm_coren: string | null
  bio: string | null
}

type SlotKey = 'titular' | 'reserva1' | 'reserva2'

type Assignments = Record<SlotKey, string | null>

const SLOT_CONFIG: Record<SlotKey, { label: string; short: string; color: string; ring: string; badge: string }> = {
  titular: {
    label: 'Atribuir como Titular',
    short: 'Titular',
    color: 'bg-indigo-600 text-white hover:bg-indigo-700',
    ring:  'ring-2 ring-indigo-500 border-indigo-300',
    badge: 'bg-indigo-100 text-indigo-700',
  },
  reserva1: {
    label: 'Reserva 1',
    short: 'Reserva 1',
    color: 'bg-blue-500 text-white hover:bg-blue-600',
    ring:  'ring-2 ring-blue-400 border-blue-300',
    badge: 'bg-blue-100 text-blue-700',
  },
  reserva2: {
    label: 'Reserva 2',
    short: 'Reserva 2',
    color: 'bg-sky-500 text-white hover:bg-sky-600',
    ring:  'ring-2 ring-sky-400 border-sky-300',
    badge: 'bg-sky-100 text-sky-700',
  },
}

/* ------------------------------------------------------------------ */
/* TriageBoard                                                          */
/* ------------------------------------------------------------------ */
export default function TriageBoard({
  shiftId,
  candidates,
  readOnly,
}: {
  shiftId: string
  candidates: Candidate[]
  readOnly: boolean
}) {
  // Pre-populate from existing DB status if readOnly
  const initial: Assignments = { titular: null, reserva1: null, reserva2: null }
  if (readOnly) {
    for (const c of candidates) {
      if (c.current_status === 'accepted_titular')  initial.titular  = c.professional_id
      if (c.current_status === 'accepted_reserva1') initial.reserva1 = c.professional_id
      if (c.current_status === 'accepted_reserva2') initial.reserva2 = c.professional_id
    }
  }

  const [assignments, setAssignments] = useState<Assignments>(initial)
  const [error, setError]             = useState<string | null>(null)
  const [done, setDone]               = useState(false)
  const [isPending, startTransition]  = useTransition()
  const router = useRouter()

  function assign(professionalId: string, slot: SlotKey) {
    if (readOnly) return
    setAssignments((prev) => {
      const next: Assignments = { ...prev }
      // Remove desse profissional qualquer slot atual
      for (const key of Object.keys(next) as SlotKey[]) {
        if (next[key] === professionalId) next[key] = null
      }
      // Toggle: se já estava nesse slot, desatribui
      if (prev[slot] === professionalId) {
        next[slot] = null
      } else {
        next[slot] = professionalId
      }
      return next
    })
  }

  function getSlot(professionalId: string): SlotKey | null {
    for (const key of Object.keys(assignments) as SlotKey[]) {
      if (assignments[key] === professionalId) return key
    }
    return null
  }

  function getAssigneeName(slot: SlotKey) {
    const id = assignments[slot]
    if (!id) return '—'
    return candidates.find((c) => c.professional_id === id)?.full_name ?? id
  }

  async function handleConfirm() {
    if (!assignments.titular) return
    setError(null)
    startTransition(async () => {
      const result = await assignShiftCandidates(
        shiftId,
        assignments.titular!,
        assignments.reserva1,
        assignments.reserva2
      )
      if (result?.error) {
        setError(result.error)
        return
      }
      setDone(true)
      setTimeout(() => router.push('/dashboard/manager'), 1500)
    })
  }

  /* ── Tela de sucesso ── */
  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <CheckCircle2 size={52} className="text-emerald-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Escala confirmada!</h2>
        <p className="text-slate-500 text-sm mt-1">Redirecionando para o painel…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Grid de candidatos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {candidates.map((candidate) => {
          const slot = getSlot(candidate.professional_id)
          const cfg  = slot ? SLOT_CONFIG[slot] : null

          return (
            <div
              key={candidate.professional_id}
              className={[
                'bg-white rounded-2xl border shadow-sm transition-all duration-150 flex flex-col',
                cfg ? cfg.ring : 'border-slate-100',
              ].join(' ')}
            >
              {/* Badge de slot atribuído */}
              {cfg && (
                <div className={`rounded-t-2xl px-4 py-1.5 text-xs font-bold ${cfg.badge} flex items-center gap-1.5`}>
                  <ShieldCheck size={13} />
                  {cfg.short}
                </div>
              )}

              {/* Dados do candidato */}
              <div className="p-5 flex-1">
                <div className="flex items-start gap-3 mb-3">
                  <div className="bg-slate-100 rounded-full p-2 shrink-0">
                    <UserCircle2 size={22} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 leading-tight">
                      {candidate.full_name ?? 'Sem nome'}
                    </p>
                    {candidate.crm_coren && (
                      <p className="text-xs text-indigo-600 font-medium mt-0.5">
                        {candidate.crm_coren}
                      </p>
                    )}
                  </div>
                </div>

                {candidate.bio ? (
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                    {candidate.bio}
                  </p>
                ) : (
                  <p className="text-xs text-slate-300 italic">Sem bio cadastrada.</p>
                )}
              </div>

              {/* Botões de atribuição */}
              {!readOnly && (
                <div className="px-5 pb-5 pt-3 border-t border-slate-50 grid grid-cols-3 gap-2">
                  {(Object.keys(SLOT_CONFIG) as SlotKey[]).map((slotKey) => {
                    const isActive = assignments[slotKey] === candidate.professional_id
                    const takenByOther = assignments[slotKey] !== null && !isActive
                    return (
                      <button
                        key={slotKey}
                        onClick={() => assign(candidate.professional_id, slotKey)}
                        disabled={takenByOther}
                        title={takenByOther ? `Slot ocupado por outro candidato` : SLOT_CONFIG[slotKey].label}
                        className={[
                          'rounded-lg py-1.5 text-xs font-semibold transition-all duration-100',
                          isActive
                            ? SLOT_CONFIG[slotKey].color
                            : takenByOther
                            ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                        ].join(' ')}
                      >
                        {slotKey === 'titular' ? 'Titular' : slotKey === 'reserva1' ? 'Res. 1' : 'Res. 2'}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Modo leitura: mostra status atual */}
              {readOnly && slot && (
                <div className={`mx-5 mb-5 rounded-xl px-3 py-2 text-xs font-semibold text-center ${SLOT_CONFIG[slot].badge}`}>
                  {SLOT_CONFIG[slot].short} confirmado
                </div>
              )}
              {readOnly && !slot && (
                <div className="mx-5 mb-5 rounded-xl px-3 py-2 text-xs font-medium text-center bg-slate-100 text-slate-400">
                  Não alocado
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Painel de confirmação (sticky bottom) ── */}
      {!readOnly && (
        <div className="sticky bottom-0 bg-white border-t border-slate-200 shadow-lg rounded-t-2xl p-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
              <AlertTriangle size={15} />
              {error}
            </div>
          )}

          {/* Resumo da escala */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {(Object.keys(SLOT_CONFIG) as SlotKey[]).map((slot) => (
              <div key={slot} className="text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                  {SLOT_CONFIG[slot].short}
                </p>
                <p className={[
                  'text-xs font-bold mt-0.5 truncate',
                  assignments[slot] ? 'text-slate-800' : 'text-slate-300',
                ].join(' ')}>
                  {getAssigneeName(slot)}
                </p>
              </div>
            ))}
          </div>

          {!assignments.titular && (
            <p className="text-center text-xs text-amber-600 flex items-center justify-center gap-1.5 mb-3">
              <AlertTriangle size={13} />
              Selecione ao menos um Titular para confirmar a escala.
            </p>
          )}

          <button
            onClick={handleConfirm}
            disabled={!assignments.titular || isPending}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 text-sm transition-colors"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Confirmando escala…
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                Confirmar Escala
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
