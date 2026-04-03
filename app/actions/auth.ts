'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export type AuthState = {
  error?: string
  message?: string
} | null

export async function signUp(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient()

  const email      = formData.get('email') as string
  const password   = formData.get('password') as string
  const fullName   = formData.get('full_name') as string
  const role       = formData.get('role') as string
  const document   = formData.get('document') as string

  if (!email || !password || !fullName || !role) {
    return { error: 'Preencha todos os campos obrigatórios.' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,       // 'manager' | 'professional' — lido pelo trigger no DB
        document,   // CNPJ (gestor) ou CRM/COREN (profissional)
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function signIn(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient()

  const email    = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Informe e-mail e senha.' }
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
