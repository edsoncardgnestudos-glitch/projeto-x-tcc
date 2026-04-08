import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import ManagerNavbar from '../_components/manager-navbar'
import CalendarView from '../_components/calendar-view'

export default async function ManagerCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('hospital_id, full_name, hospitals(name)')
    .eq('id', user.id)
    .single()

  if (!profile?.hospital_id) redirect('/dashboard/setup')

  const hospitalName =
    (profile.hospitals as unknown as { name: string } | null)?.name ?? 'Meu Hospital'

  // Mês/ano a exibir (via searchParams ou atual)
  const { year: yearParam, month: monthParam } = await searchParams
  const now = new Date()
  const year  = yearParam  ? parseInt(yearParam)  : now.getFullYear()
  const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1 // 1-12

  const firstDay = new Date(year, month - 1, 1)
  const lastDay  = new Date(year, month, 0)
  const dateFrom = firstDay.toISOString().slice(0, 10)
  const dateTo   = lastDay.toISOString().slice(0, 10)

  // Busca plantões do mês com nome do profissional titular
  const { data: rawShifts } = await supabase
    .from('shifts')
    .select(`
      id, date, time_start, time_end, role_needed, status,
      main_professional_id,
      professional:profiles!shifts_main_professional_id_fkey(full_name)
    `)
    .eq('hospital_id', profile.hospital_id)
    .gte('date', dateFrom)
    .lte('date', dateTo)
    .order('time_start', { ascending: true })

  type ShiftRow = {
    id: string
    date: string
    time_start: string
    time_end: string
    role_needed: string
    status: 'open' | 'filled' | 'completed' | 'canceled'
    main_professional_id: string | null
    professional_name: string | null
  }

  const shifts: ShiftRow[] = (rawShifts ?? []).map((s) => {
    const prof = s.professional as unknown as { full_name: string | null } | null
    return {
      id:                   s.id,
      date:                 s.date,
      time_start:           s.time_start,
      time_end:             s.time_end,
      role_needed:          s.role_needed,
      status:               s.status,
      main_professional_id: s.main_professional_id,
      professional_name:    prof?.full_name ?? null,
    }
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <ManagerNavbar hospitalName={hospitalName} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <CalendarView
          year={year}
          month={month}
          shifts={shifts}
        />
      </main>
    </div>
  )
}
