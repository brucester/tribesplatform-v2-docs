import { createClient } from '@/lib/supabase/server'
import NetworkSidebar from './NetworkSidebar'
import NetworkRightPanel from './NetworkRightPanel'

export default async function NetworkLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let sidebarUser = null
  let rightPanelData = null

  if (user) {
    const [profileRes, bioRes, offersRes, requestsRes] = await Promise.all([
      supabase.from('user_profiles').select('username, display_name, avatar_url, first_name, headline').eq('id', user.id).single(),
      supabase.from('user_bio').select('values_principles, skills, goals, personality_details').eq('user_id', user.id).maybeSingle(),
      supabase.from('user_offers').select('id').eq('user_id', user.id),
      supabase.from('user_requests').select('id').eq('user_id', user.id),
    ])

    const p = profileRes.data
    const b = bioRes.data
    const pd = b?.personality_details as any

    sidebarUser = p ? { username: p.username, display_name: p.display_name, avatar_url: p.avatar_url } : null

    const steps = [
      { label: 'Name',        complete: !!(p?.first_name) },
      { label: 'Headline',    complete: !!(p?.headline) },
      { label: 'Values',      complete: !!(b?.values_principles) },
      { label: 'Personality', complete: !!(pd?.myersBriggs) },
      { label: 'Skills',      complete: (b?.skills?.length ?? 0) > 0 },
      { label: 'Goals',       complete: !!(b?.goals) },
      { label: 'Offers',      complete: (offersRes.data?.length ?? 0) > 0 },
    ]
    const completed = steps.filter(s => s.complete).length
    const completeness = Math.round((completed / steps.length) * 100)

    rightPanelData = { steps, completed, completeness }
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 52px)', alignItems: 'flex-start' }}>
      <NetworkSidebar user={sidebarUser} />
      <main className="net-content" style={{ flex: 1, minWidth: 0 }}>
        {children}
      </main>
      <NetworkRightPanel data={rightPanelData} />
    </div>
  )
}
