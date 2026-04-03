import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { signOut } from '@/app/actions/auth'
import { applyForShift } from '@/app/actions/shifts'
import SwapRequestDialog from './_components/swap-request-dialog'
import {
  Stethoscope,
  LogOut,
  MapPin,
  Clock,
  CalendarDays,
  BadgeCheck,
  Hourglass,
  XCircle,
  AlertCircle,
  Briefcase,
  Wallet,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
type Hospital = { name: string; address: string | null }

type Shift = {
  id: string
  date: string
  time_start: string
  time_end: string
  role_needed: string
  value: number
  hospitals: Hospital | null
}

type ApplicationStatus =
  | 'pending'
  | 'accepted_titular'
  | 'accepted_reserva1'
  | 'accepted_reserva2'
  | 'rejected'

type Application = {
  id: string
  status: ApplicationStatus
  created_at: string
  shifts: {
    date: string
    time_start: string
    time_end: string
    role_needed: string
    value: number
    hospitals: { name: string } | null
  } | null
}

type MyShift = {
  id: string
  date: string
  time_start: string
  time_end: string
  role_needed: string
  value: number
  status: string
  hospitals: { name: string } | null
}

type Professional = {
  id: string
  full_name: string | null
  crm_coren: string | null
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
function fmt(date: string) {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}
function fmtTime(t: string) { return t.slice(0, 5) }
function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const STATUS_MAP: Record<
  ApplicationStatus,
  { label: string; classes: string; icon: React.ReactNode }
> = {
  pending: {
    label: 'Em Análise',
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <Hourglass size={14} />,
  },
  accepted_titular: {
    label: 'Aprovado — Titular',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <BadgeCheck size={14} />,
  },
  accepted_reserva1: {
    label: 'Reserva 1',
    classes: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <BadgeCheck size={14} />,
  },
  accepted_reserva2: {
    label: 'Reserva 2',
    classes: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: <BadgeCheck size={14} />,
  },
  rejected: {
    label: 'Não aprovado',
    classes: 'bg-slate-100 text-slate-500 border-slate-200',
    icon: <XCircle size={14} />,
  },
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default async function ProfessionalDashboard({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const currentTab =
    tab === 'candidaturas' ? 'candidaturas'
    : tab === 'escalas' ? 'escalas'
    : 'vagas'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, crm_coren')
    .eq('id', user.id)
    .single()

  /* ---------- dados por aba ---------- */
  let shifts: Shift[]            = []
  let appliedIds                  = new Set<string>()
  let applications: Application[] = []
  let myShifts: MyShift[]        = []
  let professionals: Professional[] = []

  if (currentTab === 'vagas') {
    const [{ data: shiftsData }, { data: myApps }] = await Promise.all([
      supabase
        .from('shifts')
        .select('id, date, time_start, time_end, role_needed, value, hospitals(name, address)')
        .eq('status', 'open')
        .order('date', { ascending: true })
        .limit(50),
      supabase
        .from('shift_applications')
        .select('shift_id')
        .eq('professional_id', user.id),
    ])
    shifts     = (shiftsData ?? []) as unknown as Shift[]
    appliedIds = new Set((myApps ?? []).map((a) => a.shift_id))

  } else if (currentTab === 'candidaturas') {
    const { data } = await supabase
      .from('shift_applications')
      .select(
        'id, status, created_at, shifts(date, time_start, time_end, role_needed, value, hospitals(name))'
      )
      .eq('professional_id', user.id)
      .order('created_at', { ascending: false })
    applications = (data ?? []) as unknown as Application[]

  } else {
    // escalas: plantões onde sou o titular
    const [{ data: myShiftsData }, { data: profsData }] = await Promise.all([
      supabase
        .from('shifts')
        .select('id, date, time_start, time_end, role_needed, value, status, hospitals(name)')
        .eq('main_professional_id', user.id)
        .order('date', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, full_name, crm_coren')
        .eq('role', 'professional')
        .neq('id', user.id)
        .order('full_name'),
    ])
    myShifts      = (myShiftsData ?? []) as unknown as MyShift[]
    professionals = (profsData ?? []) as unknown as Professional[]
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Profissional'

  /* ---------------------------------------------------------------- */
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
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/professional/wallet"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs transition-colors"
            >
              <Wallet size={14} />
              Carteira
            </Link>
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
        </div>
      </nav>

      {/* ── Tabs ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-lg mx-auto px-2 flex">
          <TabLink href="?tab=vagas" active={currentTab === 'vagas'}>
            Mural
          </TabLink>
          <TabLink href="?tab=candidaturas" active={currentTab === 'candidaturas'}>
            Candidaturas
          </TabLink>
          <TabLink href="?tab=escalas" active={currentTab === 'escalas'}>
            Meus Plantões
          </TabLink>
        </div>
      </div>

      {/* ── Conteúdo ── */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 space-y-4">

        {/* ── ABA: MURAL DE VAGAS ── */}
        {currentTab === 'vagas' && (
          <>
            {shifts.length === 0 ? (
              <EmptyState message="Nenhuma vaga aberta no momento." sub="Volte em breve!" />
            ) : (
              shifts.map((shift) => {
                const applied = appliedIds.has(shift.id)
                const applyAction = applyForShift.bind(null, shift.id)
                return (
                  <ShiftCard
                    key={shift.id}
                    shift={shift}
                    applied={applied}
                    applyAction={applyAction}
                  />
                )
              })
            )}
          </>
        )}

        {/* ── ABA: MINHAS CANDIDATURAS ── */}
        {currentTab === 'candidaturas' && (
          <>
            {applications.length === 0 ? (
              <EmptyState
                message="Você ainda não se candidatou a nenhuma vaga."
                sub='Explore o "Mural" e toque em "Tenho Interesse".'
              />
            ) : (
              applications.map((app) => (
                <ApplicationCard key={app.id} app={app} />
              ))
            )}
          </>
        )}

        {/* ── ABA: MEUS PLANTÕES (ESCALA) ── */}
        {currentTab === 'escalas' && (
          <>
            {myShifts.length === 0 ? (
              <EmptyState
                message="Nenhum plantão na sua escala ainda."
                sub="Quando o Gestor confirmar sua alocação, ele aparecerá aqui."
              />
            ) : (
              myShifts.map((shift) => (
                <MyShiftCard
                  key={shift.id}
                  shift={shift}
                  professionals={professionals}
                />
              ))
            )}
          </>
        )}
      </main>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                       */
/* ------------------------------------------------------------------ */

function TabLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={[
        'flex-1 text-center py-3 text-sm font-medium border-b-2 transition-colors',
        active
          ? 'border-indigo-600 text-indigo-600'
          : 'border-transparent text-slate-500 hover:text-slate-700',
      ].join(' ')}
    >
      {children}
    </Link>
  )
}

function ShiftCard({
  shift,
  applied,
  applyAction,
}: {
  shift: Shift
  applied: boolean
  applyAction: (formData: FormData) => Promise<void>
}) {
  const hospital = shift.hospitals
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-blue-400" />
      <div className="p-5">
        <div className="mb-3">
          <p className="font-bold text-slate-800 text-base leading-tight">
            {hospital?.name ?? '—'}
          </p>
          {hospital?.address && (
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin size={11} />
              {hospital.address}
            </p>
          )}
        </div>
        <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1 mb-3">
          {shift.role_needed}
        </span>
        <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={14} className="text-slate-400" />
            {fmt(shift.date)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} className="text-slate-400" />
            {fmtTime(shift.time_start)} – {fmtTime(shift.time_end)}
          </span>
        </div>
        <p className="text-2xl font-extrabold text-indigo-700 mb-4">
          {fmtBRL(shift.value)}
        </p>
        {applied ? (
          <div className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold py-2.5">
            <BadgeCheck size={16} />
            Candidatura enviada
          </div>
        ) : (
          <form action={applyAction}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white text-sm font-bold py-3 shadow-sm transition-all active:scale-95"
            >
              Tenho Interesse
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function ApplicationCard({ app }: { app: Application }) {
  const shift = app.shifts
  const statusCfg = STATUS_MAP[app.status] ?? STATUS_MAP.pending
  const isTitular = app.status === 'accepted_titular'
  return (
    <div
      className={[
        'bg-white rounded-2xl shadow-sm border overflow-hidden',
        isTitular ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-slate-100',
      ].join(' ')}
    >
      {isTitular && <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-400" />}
      <div className="p-5">
        <div className="mb-3">
          <p className="font-bold text-slate-800 text-base leading-tight">
            {shift?.role_needed ?? '—'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {(shift?.hospitals as { name: string } | null)?.name ?? '—'}
          </p>
        </div>
        {shift && (
          <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={14} className="text-slate-400" />
              {fmt(shift.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-slate-400" />
              {fmtTime(shift.time_start)} – {fmtTime(shift.time_end)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <p className="text-xl font-extrabold text-indigo-700">
            {shift ? fmtBRL(shift.value) : '—'}
          </p>
          <span
            className={[
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
              statusCfg.classes,
            ].join(' ')}
          >
            {statusCfg.icon}
            {statusCfg.label}
          </span>
        </div>
      </div>
    </div>
  )
}

function MyShiftCard({
  shift,
  professionals,
}: {
  shift: MyShift
  professionals: Professional[]
}) {
  const hospital = shift.hospitals
  const isFilled = shift.status === 'filled'
  const shiftLabel = `${shift.role_needed} · ${fmt(shift.date)} ${fmtTime(shift.time_start)}–${fmtTime(shift.time_end)}`

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400" />
      <div className="p-5">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="font-bold text-slate-800 text-base leading-tight">
              {shift.role_needed}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <Briefcase size={11} />
              {hospital?.name ?? '—'}
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 shrink-0">
            Titular
          </span>
        </div>

        {/* Data / Hora */}
        <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={14} className="text-slate-400" />
            {fmt(shift.date)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} className="text-slate-400" />
            {fmtTime(shift.time_start)} – {fmtTime(shift.time_end)}
          </span>
        </div>

        <p className="text-2xl font-extrabold text-indigo-700 mb-4">
          {fmtBRL(shift.value)}
        </p>

        {/* Botão de troca (apenas para plantões confirmados) */}
        {isFilled && (
          <SwapRequestDialog
            shiftId={shift.id}
            shiftLabel={shiftLabel}
            professionals={professionals}
          />
        )}
      </div>
    </div>
  )
}

function EmptyState({ message, sub }: { message: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertCircle size={40} className="text-slate-300 mb-3" />
      <p className="text-slate-500 font-medium text-sm">{message}</p>
      <p className="text-slate-400 text-xs mt-1 max-w-xs">{sub}</p>
    </div>
  )
}
