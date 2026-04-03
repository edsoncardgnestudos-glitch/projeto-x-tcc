'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signIn } from '@/app/actions/auth'
import { Loader2, Stethoscope } from 'lucide-react'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, null)

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 text-white rounded-2xl p-3 mb-4 shadow-lg">
            <Stethoscope size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Projeto X</h1>
          <p className="text-slate-500 text-sm mt-1">Marketplace de Plantões Médicos</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-1">Bem-vindo de volta</h2>
          <p className="text-slate-500 text-sm mb-6">Entre com suas credenciais para continuar.</p>

          {state?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="seu@email.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Senha
                </label>
                <Link href="#" className="text-xs text-indigo-600 hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
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
                  Entrando…
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Não tem conta?{' '}
          <Link href="/register" className="text-indigo-600 font-medium hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </main>
  )
}
