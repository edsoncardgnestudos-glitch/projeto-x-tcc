import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

// Guard: apenas profissionais acessam /dashboard/professional/*
export default async function ProfessionalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'professional') {
    redirect('/dashboard')
  }

  return <>{children}</>
}
