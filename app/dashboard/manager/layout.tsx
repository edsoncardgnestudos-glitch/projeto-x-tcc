import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

// Guard: apenas managers acessam rotas /dashboard/manager/*
export default async function ManagerLayout({
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

  if (!profile || profile.role !== 'manager') {
    redirect('/dashboard')
  }

  return <>{children}</>
}
