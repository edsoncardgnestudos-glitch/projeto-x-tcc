'use client'

import { useState, useTransition } from 'react'
import { Trash2, AlertTriangle, AlertOctagon, Loader2, CheckCircle2 } from 'lucide-react'
import { cancelShift } from '@/app/actions/shifts'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

/* ------------------------------------------------------------------ */
/* Lógica de janelas de cancelamento                                    */
/* ------------------------------------------------------------------ */
type CancellationInfo = {
  type: 'free' | 'penalized'
  rule: 'A' | 'B' | 'C' | 'penalized'
  title: string
  description: string
}

function computeCancellation(
  shiftDate: string,
  shiftTimeStart: string,
  createdAt: string,
): CancellationInfo {
  const now = new Date()
  const shiftDatetime = new Date(`${shiftDate}T${shiftTimeStart}`)
  const createdAtDate = new Date(createdAt)

  const hoursUntilShift = (shiftDatetime.getTime() - now.getTime()) / 3_600_000
  const hoursSinceCreation = (now.getTime() - createdAtDate.getTime()) / 3_600_000
  const hoursScheduledInAdvance =
    (shiftDatetime.getTime() - createdAtDate.getTime()) / 3_600_000

  // Regra A: plantão a mais de 1 semana (168h) de distância
  if (hoursUntilShift > 168) {
    if (hoursUntilShift >= 72) {
      return {
        type: 'free',
        rule: 'A',
        title: 'Cancelamento sem multa',
        description:
          'Este plantão está a mais de 1 semana. O cancelamento é gratuito pois ainda faltam mais de 72 h para o início.',
      }
    }
    return {
      type: 'penalized',
      rule: 'penalized',
      title: 'Cancelamento com multa',
      description:
        'O prazo de 72 h antes do plantão (regra para plantões a mais de 1 semana) já foi ultrapassado. A empresa será cobrada e o profissional selecionado receberá uma porcentagem da multa.',
    }
  }

  // Regra B: plantão na semana corrente, publicado com mais de 48 h de antecedência
  if (hoursScheduledInAdvance > 48) {
    if (hoursUntilShift >= 36) {
      return {
        type: 'free',
        rule: 'B',
        title: 'Cancelamento sem multa',
        description:
          'Plantão na semana corrente publicado com mais de 48 h de antecedência. O cancelamento é gratuito pois ainda faltam mais de 36 h para o início.',
      }
    }
    return {
      type: 'penalized',
      rule: 'penalized',
      title: 'Cancelamento com multa',
      description:
        'O prazo de 36 h antes do plantão já foi ultrapassado. A empresa será cobrada e o profissional selecionado receberá uma porcentagem da multa.',
    }
  }

  // Regra C: urgência — plantão publicado com menos de 48 h de antecedência
  if (hoursSinceCreation <= 2) {
    return {
      type: 'free',
      rule: 'C',
      title: 'Cancelamento de urgência sem multa',
      description:
        'Plantão publicado há menos de 2 h. O cancelamento de urgência é permitido sem multa dentro desse período.',
    }
  }

  return {
    type: 'penalized',
    rule: 'penalized',
    title: 'Cancelamento com multa',
    description:
      'O prazo de 2 h após a publicação para cancelamentos de urgência já passou. A empresa será cobrada e o profissional selecionado receberá uma porcentagem da multa.',
  }
}

/* ------------------------------------------------------------------ */
/* Componente                                                           */
/* ------------------------------------------------------------------ */
interface Props {
  shiftId: string
  shiftDate: string
  shiftTimeStart: string
  createdAt: string
}

export default function CancelShiftButton({
  shiftId,
  shiftDate,
  shiftTimeStart,
  createdAt,
}: Props) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [done, setDone] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const info = computeCancellation(shiftDate, shiftTimeStart, createdAt)
  const canSubmit = reason.trim().length >= 10

  function handleOpenChange(next: boolean) {
    if (isPending) return
    setOpen(next)
    if (next) {
      setReason('')
      setDone(false)
      setServerError(null)
    }
  }

  function handleConfirm() {
    if (!canSubmit) return
    setServerError(null)
    startTransition(async () => {
      const result = await cancelShift(shiftId, reason.trim())
      if (result?.error) {
        setServerError(result.error)
        return
      }
      setDone(true)
      setTimeout(() => setOpen(false), 1800)
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger className="inline-flex items-center gap-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium px-2.5 py-1.5 transition-colors">
        <Trash2 size={13} />
        <span className="hidden sm:inline">Cancelar</span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-800">
            Cancelar Plantão
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <CheckCircle2 size={44} className="text-emerald-500" />
            <p className="font-semibold text-slate-700">Plantão cancelado.</p>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {/* Banner de multa / gratuito */}
            {info.type === 'penalized' ? (
              <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <AlertOctagon size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-700">{info.title}</p>
                  <p className="text-xs text-red-600 mt-0.5 leading-relaxed">
                    {info.description}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-700">{info.title}</p>
                  <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
                    {info.description}
                  </p>
                </div>
              </div>
            )}

            {/* Justificativa */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Motivo do cancelamento{' '}
                <span className="text-slate-400 font-normal">(mínimo 10 caracteres)</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="Descreva o motivo do cancelamento…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition resize-none"
              />
              <p className="text-right text-xs text-slate-400 mt-1">
                {reason.trim().length} / 10 mín.
              </p>
            </div>

            {serverError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                {serverError}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="flex-1 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium py-2.5 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirm}
                disabled={!canSubmit || isPending}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold py-2.5 transition-colors"
              >
                {isPending ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Cancelando…
                  </>
                ) : (
                  'Confirmar cancelamento'
                )}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
