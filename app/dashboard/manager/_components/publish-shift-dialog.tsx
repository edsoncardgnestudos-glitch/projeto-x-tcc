'use client'

import { useActionState, useEffect, useState } from 'react'
import { Loader2, Plus, CreditCard } from 'lucide-react'
import { createShift } from '@/app/actions/manager'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const ROLE_OPTIONS = [
  'Médico Clínico Geral',
  'Médico Plantonista',
  'Médico Emergencista',
  'Enfermeiro',
  'Técnico de Enfermagem',
  'Fisioterapeuta',
]

export default function PublishShiftDialog() {
  const [open, setOpen]         = useState(false)
  const [formKey, setFormKey]   = useState(0)
  const [valueStr, setValueStr] = useState('')
  const [state, formAction, pending] = useActionState(createShift, null)

  const parsedValue   = parseFloat(valueStr)
  const hasValue      = !isNaN(parsedValue) && parsedValue > 0
  const platformFee   = hasValue ? Math.round(parsedValue * 0.05 * 100) / 100 : 0
  const totalCharged  = hasValue ? Math.round((parsedValue + platformFee) * 100) / 100 : 0

  // Fecha o dialog ao sucesso
  useEffect(() => {
    if (state?.success) {
      setOpen(false)
      setFormKey((k) => k + 1)
    }
  }, [state])

  // Reseta o form ao abrir novamente
  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) {
      setFormKey((k) => k + 1)
      setValueStr('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors shadow-sm"
      >
        <Plus size={18} />
        Publicar Plantão
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-800">
            Novo Plantão
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Preencha os dados da vaga. Ela será publicada com status <strong>Aberto</strong>.
          </p>
        </DialogHeader>

        {state?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-3">
            {state.error}
          </div>
        )}

        <form key={formKey} action={formAction} className="space-y-4 pt-1">
          {/* Data */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Data do Plantão
            </label>
            <input
              name="date"
              type="date"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          {/* Horário */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Hora Início
              </label>
              <input
                name="time_start"
                type="time"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Hora Fim
              </label>
              <input
                name="time_end"
                type="time"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Especialidade */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tipo de Profissional
            </label>
            <select
              name="role_needed"
              required
              defaultValue=""
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            >
              <option value="" disabled>
                Selecione…
              </option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Valor */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Valor do Plantão (R$)
            </label>
            <input
              name="value"
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="1000.00"
              value={valueStr}
              onChange={(e) => setValueStr(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          {/* Preview da taxa — aparece quando o gestor digita um valor válido */}
          {hasValue && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Valor do plantão</span>
                <span className="font-medium">{fmtBRL(parsedValue)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Taxa da plataforma (5%)</span>
                <span className="font-medium text-amber-600">{fmtBRL(platformFee)}</span>
              </div>
              <div className="border-t border-indigo-200 pt-1.5 flex items-center justify-between text-sm font-bold text-indigo-700">
                <span>Total a pagar</span>
                <span>{fmtBRL(totalCharged)}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
          >
            {pending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processando pagamento…
              </>
            ) : (
              <>
                <CreditCard size={16} />
                Pagar e Publicar Vaga
              </>
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
