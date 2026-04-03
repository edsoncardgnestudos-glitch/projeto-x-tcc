'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { signIn } from '@/app/actions/auth'
import { Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, null)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 z-0 bg-zinc-950 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=2064&auto=format&fit=crop')`,
        }}
      >
        <div className="absolute inset-0 bg-[#0f1115]/80 backdrop-blur-[2px]" />
      </div>

      {/* Back Button */}
      <div className="absolute top-8 left-8 z-10 w-full max-w-7xl mx-auto px-4 md:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-300 hover:text-white transition group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Voltar</span>
        </Link>
      </div>

      <div className="w-full max-w-[420px] z-10 flex flex-col items-center">
        
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-[2.5rem] font-bold text-[#4B96FF] tracking-tight mb-2">
            Projeto X
          </h1>
          <p className="text-zinc-200 text-sm">
            Marketplace de Plantões Médicos
          </p>
        </div>

        {/* Card */}
        <div className="w-full bg-[#18181A] rounded-[24px] p-8 shadow-2xl border border-zinc-800/80">
          <h2 className="text-[1.75rem] font-bold text-white mb-1.5 tracking-tight">Bem-vindo de volta</h2>
          <p className="text-zinc-400 text-sm mb-8">Entre na sua conta para continuar</p>

          {state?.error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-[0.85rem] font-medium text-zinc-300 mb-2">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="Insira seu e-mail"
                className="w-full rounded-xl border border-zinc-800 bg-[#09090B] px-4 py-3.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#4B96FF] focus:border-[#4B96FF] transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[0.85rem] font-medium text-zinc-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Insira sua senha"
                  className="w-full rounded-xl border border-zinc-800 bg-[#09090B] px-4 py-3.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#4B96FF] focus:border-[#4B96FF] transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full flex items-center justify-center gap-2 bg-[#4B96FF] hover:bg-[#3b82f6] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3.5 text-sm transition-colors mt-2"
            >
              {pending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Entrando…
                </>
              ) : (
                'Entrar'
              )}
            </button>
            
            <div className="flex flex-col items-center gap-4 mt-6">
              <Link href="#" className="text-[0.85rem] text-[#4B96FF] hover:text-[#7bb1ff] transition-colors">
                Esqueceu sua senha?
              </Link>
              
              <p className="text-[0.85rem] text-zinc-400">
                Não tem uma conta?{' '}
                <Link href="/register" className="text-[#4B96FF] hover:text-[#7bb1ff] transition-colors">
                  Cadastre-se
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
