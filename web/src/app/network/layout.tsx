import { createClient } from '@/lib/supabase/server'
import NetworkSidebar from './NetworkSidebar'

export default async function NetworkLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let sidebarUser = null
  if (user) {
    const { data } = await supabase
      .from('user_profiles')
      .select('username, display_name, avatar_url')
      .eq('id', user.id)
      .single()
    sidebarUser = data
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 52px)', alignItems: 'flex-start' }}>
      <NetworkSidebar user={sidebarUser} />
      <main className="net-content" style={{ flex: 1, minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}
