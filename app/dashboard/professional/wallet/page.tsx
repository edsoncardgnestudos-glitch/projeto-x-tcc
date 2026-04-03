import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { signOut } from '@/app/actions/auth'
import {
  Stethoscope,
  LogOut,
  Wallet,
  ArrowDownCircle,
  ArrowLeft,
  CalendarDays,
} from 'lucide-react'

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(d: string) {
  const date = new Date(d)
  return date.toLocaleDateString('pt-BR', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
    hour:  '2-digit',
    minute: '2-digit',
  })
}

type WalletTransaction = {
  id:          string
  amount:      number
  type:        'credit' | 'debit'
  description: string
  created_at:  string
  shift_id:    string | null
}

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: txns }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single(),
    supabase
      .from('wallet_transactions')
      .select('id, amount, type, description, created_at, shift_id')
      .eq('professional_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const transactions = (txns ?? []) as WalletTransaction[]

  const balance = transactions.reduce((acc, t) => {
    return t.type === 'credit' ? acc + t.amount : acc - t.amount
  }, 0)

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Profissional'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Navbar ── */}
      <nav className="bg-slate-900 text-white shadow-md">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-500 rounded-xl p-1.5">
              <Stethoscope size={18} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 leading-none">Projeto X</p>
              <p className="text-sm font-semibold leading-tight">{firstName}</p>
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs transition-colors"
            >
              <LogOut size={14} />
              Sair
            </button>
          </form>
        </div>
      </nav>

      {/* ── Back link ── */}
      <div className="max-w-lg mx-auto w-full px-4 pt-5">
        <Link
          href="/dashboard/professional"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm transition-colors"
        >
          <ArrowLeft size={15} />
          Voltar ao Painel
        </Link>
      </div>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 space-y-5">

        {/* ── Card de saldo ── */}
        <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-4 opacity-80">
            <Wallet size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Saldo disponível
            </span>
          </div>
          <p className="text-4xl font-extrabold tracking-tight">
            {fmtBRL(balance)}
          </p>
          <p className="text-xs mt-2 opacity-70">
            {transactions.length === 0
              ? 'Nenhuma movimentação ainda'
              : `${transactions.length} ${transactions.length === 1 ? 'transação' : 'transações'}`}
          </p>
        </div>

        {/* ── Extrato ── */}
        <div>
          <h2 className="text-sm font-bold text-slate-700 mb-3">Extrato</h2>

          {transactions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
              <Wallet size={36} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-medium">
                Nenhuma movimentação ainda.
              </p>
              <p className="text-slate-300 text-xs mt-1">
                Os valores dos plantões aparecerão aqui após a liberação.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 flex items-center gap-4"
                >
                  {/* Ícone */}
                  <div className={[
                    'rounded-full p-2 shrink-0',
                    t.type === 'credit'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-red-50 text-red-500',
                  ].join(' ')}>
                    <ArrowDownCircle
                      size={18}
                      className={t.type === 'debit' ? 'rotate-180' : ''}
                    />
                  </div>

                  {/* Descrição */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {t.description}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <CalendarDays size={11} />
                      {fmtDate(t.created_at)}
                    </p>
                  </div>

                  {/* Valor */}
                  <p className={[
                    'text-base font-extrabold shrink-0',
                    t.type === 'credit' ? 'text-emerald-600' : 'text-red-500',
                  ].join(' ')}>
                    {t.type === 'credit' ? '+' : '−'}{fmtBRL(t.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
