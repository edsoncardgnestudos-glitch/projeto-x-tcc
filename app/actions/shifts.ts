'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

/* ------------------------------------------------------------------ */
/* assignShiftCandidates — Triagem: define Titular + Reservas          */
/* Chamado diretamente de um Client Component via useTransition.       */
/* ------------------------------------------------------------------ */
export async function assignShiftCandidates(
  shiftId: string,
  titularId: string,
  reserva1Id: string | null,
  reserva2Id: string | null
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // Verifica que o gestor é dono desse hospital/shift
  const { data: profile } = await supabase
    .from('profiles')
    .select('hospital_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'manager' || !profile.hospital_id) {
    return { error: 'Acesso negado.' }
  }

  const { data: shift } = await supabase
    .from('shifts')
    .select('hospital_id')
    .eq('id', shiftId)
    .single()

  if (!shift || shift.hospital_id !== profile.hospital_id) {
    return { error: 'Vaga não pertence ao seu hospital.' }
  }

  // 1. Rejeita todos primeiro (operação base)
  const { error: rejectErr } = await supabase
    .from('shift_applications')
    .update({ status: 'rejected' })
    .eq('shift_id', shiftId)

  if (rejectErr) return { error: rejectErr.message }

  // 2. Atualiza os selecionados individualmente (sequencial evita conflito de types)
  await supabase
    .from('shift_applications')
    .update({ status: 'accepted_titular' })
    .eq('shift_id', shiftId)
    .eq('professional_id', titularId)

  if (reserva1Id) {
    await supabase
      .from('shift_applications')
      .update({ status: 'accepted_reserva1' })
      .eq('shift_id', shiftId)
      .eq('professional_id', reserva1Id)
  }

  if (reserva2Id) {
    await supabase
      .from('shift_applications')
      .update({ status: 'accepted_reserva2' })
      .eq('shift_id', shiftId)
      .eq('professional_id', reserva2Id)
  }

  // 3. Atualiza a vaga principal (status + profissionais)
  const { error: shiftErr } = await supabase
    .from('shifts')
    .update({
      status:                  'filled',
      main_professional_id:    titularId,
      backup1_professional_id: reserva1Id ?? null,
      backup2_professional_id: reserva2Id ?? null,
    })
    .eq('id', shiftId)

  if (shiftErr) return { error: shiftErr.message }

  revalidatePath('/dashboard/manager')
  revalidatePath('/dashboard/professional')

  return { success: true }
}

/* ------------------------------------------------------------------ */
/* cancelShift — Gestor cancela um plantão com justificativa           */
/* ------------------------------------------------------------------ */
export async function cancelShift(
  shiftId: string,
  reason: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('hospital_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'manager' || !profile.hospital_id) {
    return { error: 'Acesso negado.' }
  }

  const { data: shift } = await supabase
    .from('shifts')
    .select('id, hospital_id, date, time_start, created_at, status')
    .eq('id', shiftId)
    .single()

  if (!shift || shift.hospital_id !== profile.hospital_id) {
    return { error: 'Plantão não encontrado ou não pertence ao seu hospital.' }
  }

  if (shift.status === 'canceled') {
    return { error: 'Este plantão já está cancelado.' }
  }

  if (shift.status === 'completed') {
    return { error: 'Não é possível cancelar um plantão já concluído.' }
  }

  if (!reason || reason.trim().length < 10) {
    return { error: 'O motivo do cancelamento deve ter ao menos 10 caracteres.' }
  }

  // Determina o tipo de cancelamento (free | penalized)
  const now = new Date()
  const shiftDatetime = new Date(`${shift.date}T${shift.time_start}`)
  const createdAt = new Date(shift.created_at)

  const hoursUntilShift = (shiftDatetime.getTime() - now.getTime()) / 3_600_000
  const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / 3_600_000
  const hoursScheduledInAdvance = (shiftDatetime.getTime() - createdAt.getTime()) / 3_600_000

  let cancellationType: 'free' | 'penalized' = 'penalized'

  if (hoursUntilShift > 168 && hoursUntilShift >= 72) {
    cancellationType = 'free'
  } else if (hoursScheduledInAdvance > 48 && hoursUntilShift >= 36) {
    cancellationType = 'free'
  } else if (hoursScheduledInAdvance <= 48 && hoursSinceCreation <= 2) {
    cancellationType = 'free'
  }

  const { error: updateErr } = await supabase
    .from('shifts')
    .update({
      status:               'canceled',
      cancellation_reason:  reason.trim(),
      cancelled_at:         now.toISOString(),
      cancellation_type:    cancellationType,
    })
    .eq('id', shiftId)

  if (updateErr) return { error: updateErr.message }

  revalidatePath('/dashboard/manager')
  revalidatePath('/dashboard/professional')

  return { success: true }
}

/**
 * applyForShift — Candidatura de profissional a um plantão.
 * Chamado via .bind(null, shiftId) nas shift cards.
 */
export async function applyForShift(shiftId: string, _formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Garante que só profissionais candidatam
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'professional') return

  await supabase.from('shift_applications').insert({
    shift_id:       shiftId,
    professional_id: user.id,
    status:         'pending',
  })
  // Erro de duplicata (UNIQUE) é ignorado intencionalmente:
  // o botão reflete o estado correto no próximo render.

  revalidatePath('/dashboard/professional')
}
