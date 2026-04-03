'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

/* ------------------------------------------------------------------ */
/* releaseSplitPayment — Gestor libera o pagamento ao profissional     */
/* Simula a liquidação do escrow: credita a carteira do titular.       */
/* ------------------------------------------------------------------ */
export async function releaseSplitPayment(
  shiftId: string,
  _formData: FormData
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Verifica que o usuário é gestor com hospital vinculado
  const { data: profile } = await supabase
    .from('profiles')
    .select('hospital_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'manager' || !profile.hospital_id) return

  // Busca o plantão com os dados financeiros e o titular
  const { data: shift } = await supabase
    .from('shifts')
    .select('hospital_id, value, payment_state, main_professional_id, role_needed, date')
    .eq('id', shiftId)
    .single()

  if (!shift) return
  if (shift.hospital_id !== profile.hospital_id) return
  if (shift.payment_state !== 'escrow_retained') return
  if (!shift.main_professional_id) return

  // 1. Atualiza o plantão: libera escrow e marca como completed
  const { error: shiftErr } = await supabase
    .from('shifts')
    .update({ payment_state: 'released', status: 'completed' })
    .eq('id', shiftId)

  if (shiftErr) return

  // 2. Credita a carteira do profissional titular com o valor bruto do plantão
  const description = `Plantão: ${shift.role_needed} — ${shift.date}`
  await supabase.from('wallet_transactions').insert({
    professional_id: shift.main_professional_id,
    shift_id:        shiftId,
    amount:          shift.value,
    type:            'credit',
    description,
  })

  revalidatePath('/dashboard/manager')
  revalidatePath('/dashboard/professional')
  revalidatePath(`/dashboard/manager/shifts/${shiftId}`)
}
