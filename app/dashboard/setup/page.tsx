'use client'

import { useActionState } from 'react'
import { setupHospital } from '@/app/actions/manager'
import { Building2, Loader2 } from 'lucide-react'

export default function SetupPage() {
  const [state, formAction, pending] = useActionState(setupHospital, null)

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 text-white rounded-2xl p-3 mb-4 shadow-lg">
            <Building2 size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Configure sua Unidade
          </h1>
          <p className="text-slate-500 text-sm mt-1 text-center">
            Antes de publicar plantões, cadastre seu hospital ou clínica.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">
            Dados da Unidade de Saúde
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            Essas informações aparecerão nas vagas publicadas.
          </p>

          {state?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                Nome do Hospital / Clínica
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Hospital das Clínicas"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="cnpj" className="block text-sm font-medium text-slate-700 mb-1.5">
                CNPJ
              </label>
              <input
                id="cnpj"
                name="cnpj"
                type="text"
                required
                placeholder="00.000.000/0001-00"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1.5">
                Endereço Completo
              </label>
              <input
                id="address"
                name="address"
                type="text"
                placeholder="Rua das Flores, 100 — São Paulo, SP"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-2.5 text-sm transition-colors mt-2"
            >
              {pending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Salvando…
                </>
              ) : (
                'Salvar e continuar'
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
