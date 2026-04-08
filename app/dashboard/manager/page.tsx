import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import ManagerNavbar from './_components/manager-navbar'
import MetricsCards from './_components/metrics-cards'
import ShiftsList from './_components/shifts-list'
import PublishShiftDialog from './_components/publish-shift-dialog'
import SwapRequests from './_components/swap-requests'

export default async function ManagerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Perfil com nome do hospital via join
  const { data: profile } = await supabase
    .from('profiles')
    .select('hospital_id, full_name, hospitals(name)')
    .eq('id', user.id)
    .single()

  // Sem hospital cadastrado → setup obrigatório
  if (!profile?.hospital_id) redirect('/dashboard/setup')

  const hospitalName =
    (profile.hospitals as unknown as { name: string } | null)?.name ?? 'Meu Hospital'

  // Busca métricas, plantões e trocas pendentes em paralelo
  const [
    { count: openCount },
    { count: completedCount },
    { count: totalCount },
    { data: shifts },
    { data: rawSwaps },
  ] = await Promise.all([
    supabase
      .from('shifts')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', profile.hospital_id)
      .eq('status', 'open'),
    supabase
      .from('shifts')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', profile.hospital_id)
      .eq('status', 'completed'),
    supabase
      .from('shifts')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', profile.hospital_id),
    supabase
      .from('shifts')
      .select('id, date, time_start, time_end, role_needed, value, status, created_at')
      .eq('hospital_id', profile.hospital_id)
      .order('date', { ascending: false })
      .limit(30),
    // RLS já restringe ao hospital do gestor logado
    supabase
      .from('shift_swaps')
      .select(`
        id, shift_id, target_professional_id, reason, created_at,
        shifts(date, time_start, time_end, role_needed),
        original_profile:profiles!shift_swaps_original_professional_id_fkey(full_name, crm_coren),
        target_profile:profiles!shift_swaps_target_professional_id_fkey(full_name, crm_coren)
      `)
      .eq('status', 'pending_manager')
      .order('created_at', { ascending: true }),
  ])

  const swapRequests = (rawSwaps ?? []) as any[]

  return (
    <div className="min-h-screen bg-slate-50">
      <ManagerNavbar hospitalName={hospitalName} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Painel do Gestor
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Bem-vindo de volta, {profile.full_name?.split(' ')[0]}.
            </p>
          </div>
          <PublishShiftDialog />
        </div>

        {/* Trocas pendentes (aparece apenas se houver) */}
        <SwapRequests swapRequests={swapRequests} />

        {/* Métricas */}
        <MetricsCards
          openCount={openCount ?? 0}
          completedCount={completedCount ?? 0}
          totalCount={totalCount ?? 0}
        />

        {/* Lista de plantões */}
        <ShiftsList shifts={(shifts ?? []) as any} />
      </main>
    </div>
  )
}
