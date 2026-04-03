'use client'

import { useState, useTransition } from 'react'
import { requestShiftSwap } from '@/app/actions/swaps'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ArrowLeftRight, Loader2, AlertTriangle } from 'lucide-react'

type Professional = {
  id: string
  full_name: string | null
  crm_coren: string | null
}

interface Props {
  shiftId: string
  shiftLabel: string   // ex: "Médico Plantonista · 15/04 07:00–19:00"
  professionals: Professional[]
}

export default function SwapRequestDialog({ shiftId, shiftLabel, professionals }: Props) {
  const [open, setOpen]         = useState(false)
  const [targetId, setTargetId] = useState('')
  const [reason, setReason]     = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function reset() {
    setTargetId('')
    setReason('')
    setError(null)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) reset()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!targetId) { setError('Selecione o profissional substituto.'); return }
    if (!reason.trim()) { setError('Informe o motivo da falta.'); return }
    setError(null)

    startTransition(async () => {
      const result = await requestShiftSwap(shiftId, targetId, reason)
      if (result?.error) {
        setError(result.error)
        return
      }
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-semibold px-3 py-2 transition-colors">
        <ArrowLeftRight size={13} />
        Passar Plantão
      </DialogTrigger>

      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-800">
            Solicitar Substituição
          </DialogTitle>
          <p className="text-xs text-slate-500 leading-relaxed">
            {shiftLabel}
          </p>
        </DialogHeader>

        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
          A troca só será efetivada após aprovação do Gestor do hospital.
        </p>

        {error && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Motivo */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Motivo da falta
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Filho internado, consulta médica urgente…"
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
            />
          </div>

          {/* Substituto */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Profissional substituto
            </label>
            {professionals.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                Nenhum profissional disponível no momento.
              </p>
            ) : (
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              >
                <option value="" disabled>Selecione…</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name ?? 'Sem nome'}
                    {p.crm_coren ? ` · ${p.crm_coren}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending || professionals.length === 0}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 text-sm transition-colors"
          >
            {isPending ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Enviando…
              </>
            ) : (
              <>
                <ArrowLeftRight size={15} />
                Enviar Solicitação
              </>
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
