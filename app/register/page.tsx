'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { signUp } from '@/app/actions/auth'
import {
  Building2,
  UserRound,
  Loader2,
  Stethoscope,
  ChevronRight,
} from 'lucide-react'

type Role = 'manager' | 'professional' | null

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(signUp, null)
  const [role, setRole] = useState<Role>(null)

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
          <h2 className="text-xl font-semibold text-slate-800 mb-1">Criar conta</h2>
          <p className="text-slate-500 text-sm mb-6">Primeiro, escolha seu perfil de acesso.</p>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <RoleCard
              selected={role === 'manager'}
              onSelect={() => setRole('manager')}
              icon={<Building2 size={28} />}
              title="Gestor Hospitalar"
              description="Publico e gerencio plantões"
            />
            <RoleCard
              selected={role === 'professional'}
              onSelect={() => setRole('professional')}
              icon={<UserRound size={28} />}
              title="Profissional"
              description="Médico ou Enfermeiro"
            />
          </div>

          {state?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            {/* Hidden role field */}
            <input type="hidden" name="role" value={role ?? ''} />

            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-slate-700 mb-1.5">
                Nome Completo
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                placeholder="Dr. João Silva"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

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

            {/* Campo dinâmico: CNPJ para gestor, CRM/COREN para profissional */}
            <div>
              <label htmlFor="document" className="block text-sm font-medium text-slate-700 mb-1.5">
                {role === 'manager' ? 'CNPJ da Empresa' : role === 'professional' ? 'CRM / COREN' : 'CPF / CNPJ / CRM'}
              </label>
              <input
                id="document"
                name="document"
                type="text"
                placeholder={
                  role === 'manager'
                    ? '00.000.000/0001-00'
                    : role === 'professional'
                    ? 'CRM-SP 123456'
                    : '—'
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Mín. 8 caracteres"
                minLength={8}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={pending || !role}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-2.5 text-sm transition-colors mt-2"
            >
              {pending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Criando conta…
                </>
              ) : (
                <>
                  Criar conta
                  <ChevronRight size={16} />
                </>
              )}
            </button>

            {!role && (
              <p className="text-center text-xs text-slate-400">
                Selecione um perfil para continuar
              </p>
            )}
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Já tem conta?{' '}
          <Link href="/login" className="text-indigo-600 font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  )
}

/* ------------------------------------------------------------------ */
/* Subcomponent: RoleCard                                               */
/* ------------------------------------------------------------------ */
function RoleCard({
  selected,
  onSelect,
  icon,
  title,
  description,
}: {
  selected: boolean
  onSelect: () => void
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all duration-150 cursor-pointer',
        selected
          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100',
      ].join(' ')}
    >
      <span className={selected ? 'text-indigo-600' : 'text-slate-400'}>{icon}</span>
      <span className="text-sm font-semibold leading-tight">{title}</span>
      <span className="text-xs text-slate-400 leading-tight">{description}</span>
    </button>
  )
}
