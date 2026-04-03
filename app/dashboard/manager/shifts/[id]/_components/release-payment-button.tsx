'use client'

import { useTransition, useState } from 'react'
import { releaseSplitPayment } from '@/app/actions/payments'
import { Banknote, Loader2, CheckCircle2 } from 'lucide-react'

interface Props {
  shiftId: string
  totalCharged: number
  shiftValue: number
}

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function ReleasePaymentButton({ shiftId, totalCharged, shiftValue }: Props) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone]              = useState(false)

  const releaseAction = releaseSplitPayment.bind(null, shiftId)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    startTransition(async () => {
      const formData = new FormData()
      await releaseAction(formData)
      setDone(true)
    })
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold px-4 py-3">
        <CheckCircle2 size={16} />
        Pagamento liberado — {fmtBRL(shiftValue)} creditado ao titular
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Banknote size={18} className="text-emerald-600" />
        <h3 className="text-sm font-bold text-slate-800">Liberar Pagamento</h3>
      </div>

      <div className="space-y-1.5 text-xs text-slate-600">
        <div className="flex justify-between">
          <span>Valor retido em escrow</span>
          <span className="font-medium">{fmtBRL(totalCharged)}</span>
        </div>
        <div className="flex justify-between">
          <span>Creditado ao profissional</span>
          <span className="font-medium text-emerald-700">{fmtBRL(shiftValue)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 text-sm transition-colors"
        >
          {isPending ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Liberando…
            </>
          ) : (
            <>
              <Banknote size={15} />
              Confirmar e Liberar
            </>
          )}
        </button>
      </form>
    </div>
  )
}
