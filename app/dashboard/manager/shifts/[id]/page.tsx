import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { ArrowLeft, CalendarDays, Clock, Building2 } from 'lucide-react'
import TriageBoard from './_components/triage-board'
import ReleasePaymentButton from './_components/release-payment-button'

function fmt(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}
function fmtTime(t: string) {
  return t.slice(0, 5)
}

export default async function ShiftTriagePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Busca a vaga com dados do hospital e campos financeiros
  const { data: shift } = await supabase
    .from('shifts')
    .select('id, date, time_start, time_end, role_needed, value, status, payment_state, total_charged, main_professional_id, hospitals(name)')
    .eq('id', id)
    .single()

  if (!shift) redirect('/dashboard/manager')

  // Verifica que o gestor é dono desse hospital
  const { data: profile } = await supabase
    .from('profiles')
    .select('hospital_id')
    .eq('id', user.id)
    .single()

  const hospital = shift.hospitals as unknown as { name: string } | null
  if (!profile?.hospital_id || (shift as any).hospital_id !== profile.hospital_id) {
    redirect('/dashboard/manager')
  }

  // Busca candidaturas com dados do profissional
  const { data: applications } = await supabase
    .from('shift_applications')
    .select('id, professional_id, status, profiles:professional_id(full_name, crm_coren, bio)')
    .eq('shift_id', id)
    .order('created_at', { ascending: true })

  type Candidate = {
    application_id: string
    professional_id: string
    current_status: string
    full_name: string | null
    crm_coren: string | null
    bio: string | null
  }

  const candidates: Candidate[] = (applications ?? []).map((a) => {
    const prof = a.profiles as unknown as {
      full_name: string | null
      crm_coren: string | null
      bio: string | null
    } | null
    return {
      application_id:   a.id,
      professional_id:  a.professional_id,
      current_status:   a.status,
      full_name:        prof?.full_name ?? null,
      crm_coren:        prof?.crm_coren ?? null,
      bio:              prof?.bio ?? null,
    }
  })

  const alreadyFilled      = shift.status === 'filled'
  const paymentReleased    = (shift as any).payment_state === 'released'
  const canReleasePayment  = alreadyFilled && !paymentReleased && !!(shift as any).main_professional_id

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link
            href="/dashboard/manager"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            Voltar ao Painel
          </Link>

          <h1 className="text-xl font-bold">{shift.role_needed}</h1>

          <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-300">
            <span className="flex items-center gap-1.5">
              <Building2 size={14} />
              {hospital?.name ?? '—'}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays size={14} />
              {fmt(shift.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {fmtTime(shift.time_start)} – {fmtTime(shift.time_end)}
            </span>
          </div>

          {alreadyFilled && (
            <span className="mt-3 inline-flex items-center rounded-full bg-blue-500/20 text-blue-200 text-xs font-medium px-3 py-1">
              Escala já confirmada — visualização somente leitura
            </span>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Botão de liberação de pagamento — aparece quando escala está confirmada e pagamento retido */}
        {canReleasePayment && (
          <ReleasePaymentButton
            shiftId={id}
            totalCharged={(shift as any).total_charged ?? shift.value}
            shiftValue={shift.value}
          />
        )}

        {candidates.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
            <p className="text-slate-400 font-medium">Nenhum candidato ainda.</p>
            <p className="text-slate-400 text-sm mt-1">
              Os profissionais aparecerão aqui quando demonstrarem interesse.
            </p>
          </div>
        ) : (
          <TriageBoard
            shiftId={id}
            candidates={candidates}
            readOnly={alreadyFilled}
          />
        )}
      </main>
    </div>
  )
}
