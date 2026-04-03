'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

/* ------------------------------------------------------------------ */
/* requestShiftSwap — Profissional solicita troca ao gestor            */
/* Chamado diretamente de um Client Component via useTransition.       */
/* ------------------------------------------------------------------ */
export async function requestShiftSwap(
  shiftId: string,
  targetId: string,
  reason: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'professional') return { error: 'Acesso negado.' }

  // Garante que o solicitante é realmente o titular da vaga
  const { data: shift } = await supabase
    .from('shifts')
    .select('main_professional_id')
    .eq('id', shiftId)
    .single()

  if (!shift || shift.main_professional_id !== user.id) {
    return { error: 'Você não é o titular deste plantão.' }
  }

  // Profissional não pode solicitar troca para si mesmo
  if (targetId === user.id) {
    return { error: 'O substituto não pode ser você mesmo.' }
  }

  const { error } = await supabase.from('shift_swaps').insert({
    shift_id:                shiftId,
    original_professional_id: user.id,
    target_professional_id:  targetId,
    reason:                  reason.trim(),
    status:                  'pending_manager',
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/professional')
  revalidatePath('/dashboard/manager')
  return { success: true }
}

/* ------------------------------------------------------------------ */
/* approveShiftSwap — Gestor aprova a troca                            */
/* Chamado via .bind(null, swapId, shiftId, targetId) em um form.      */
/* ------------------------------------------------------------------ */
export async function approveShiftSwap(
  swapId: string,
  shiftId: string,
  targetId: string,
  _formData: FormData
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('hospital_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'manager' || !profile.hospital_id) return

  // Verifica que a troca pertence ao hospital do gestor
  const { data: shift } = await supabase
    .from('shifts')
    .select('hospital_id')
    .eq('id', shiftId)
    .single()

  if (!shift || shift.hospital_id !== profile.hospital_id) return

  // Muda status da troca para approved
  await supabase
    .from('shift_swaps')
    .update({ status: 'approved' })
    .eq('id', swapId)

  // Atualiza o titular da vaga para o substituto
  await supabase
    .from('shifts')
    .update({ main_professional_id: targetId })
    .eq('id', shiftId)

  revalidatePath('/dashboard/manager')
  revalidatePath('/dashboard/professional')
}

/* ------------------------------------------------------------------ */
/* rejectShiftSwap — Gestor recusa a troca                             */
/* Chamado via .bind(null, swapId) em um form.                         */
/* ------------------------------------------------------------------ */
export async function rejectShiftSwap(
  swapId: string,
  _formData: FormData
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'manager') return

  await supabase
    .from('shift_swaps')
    .update({ status: 'rejected' })
    .eq('id', swapId)

  revalidatePath('/dashboard/manager')
  revalidatePath('/dashboard/professional')
}
