'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export type ManagerState = {
  error?: string
  success?: boolean
} | null

/* ------------------------------------------------------------------ */
/* setupHospital: Primeiro acesso — cria o hospital e vincula ao perfil */
/* ------------------------------------------------------------------ */
export async function setupHospital(
  prevState: ManagerState,
  formData: FormData
): Promise<ManagerState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const name    = formData.get('name') as string
  const cnpj    = formData.get('cnpj') as string
  const address = formData.get('address') as string

  if (!name || !cnpj) return { error: 'Nome e CNPJ são obrigatórios.' }

  // 1. Cria o hospital
  const { data: hospital, error: hospitalError } = await supabase
    .from('hospitals')
    .insert({ name, cnpj, address })
    .select('id')
    .single()

  if (hospitalError) return { error: hospitalError.message }

  // 2. Vincula o gestor ao hospital
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ hospital_id: hospital.id })
    .eq('id', user.id)

  if (profileError) return { error: profileError.message }

  redirect('/dashboard/manager')
}

/* ------------------------------------------------------------------ */
/* createShift: Publica um novo plantão                                 */
/* ------------------------------------------------------------------ */
export async function createShift(
  prevState: ManagerState,
  formData: FormData
): Promise<ManagerState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // Verifica role e hospital_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('hospital_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'manager') return { error: 'Acesso negado.' }
  if (!profile.hospital_id) return { error: 'Configure o hospital primeiro.' }

  const date       = formData.get('date') as string
  const timeStart  = formData.get('time_start') as string
  const timeEnd    = formData.get('time_end') as string
  const roleNeeded = formData.get('role_needed') as string
  const value      = parseFloat(formData.get('value') as string)

  if (!date || !timeStart || !timeEnd || !roleNeeded || isNaN(value) || value <= 0) {
    return { error: 'Preencha todos os campos obrigatórios.' }
  }

  // Cálculo da taxa de plataforma (5%) e total debitado do gestor
  const platformFee   = Math.round(value * 0.05 * 100) / 100
  const totalCharged  = Math.round((value + platformFee) * 100) / 100

  // Simulação de delay do gateway de pagamento (~1,2 s)
  await new Promise((resolve) => setTimeout(resolve, 1200))

  const { error } = await supabase.from('shifts').insert({
    hospital_id:    profile.hospital_id,
    date,
    time_start:     timeStart,
    time_end:       timeEnd,
    role_needed:    roleNeeded,
    value,
    platform_fee:   platformFee,
    total_charged:  totalCharged,
    payment_state:  'escrow_retained',
    status:         'open',
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/manager')
  return { success: true }
}
