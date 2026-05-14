import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { computeMatch } from '@/lib/match-score'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Pencil } from 'lucide-react'
import MatchesTabs from './MatchesTabs'

export default async function MatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profilesRes, biosRes, myBioRes] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('id, username, first_name, last_name, city, country, avatar_url, user_types')
      .neq('id', user.id),
    supabase.from('user_bio').select('*'),
    supabase.from('user_bio').select('*').eq('user_id', user.id).maybeSingle(),
  ])

  const myBio = myBioRes.data
  const bioMap: Record<string, any> = {}
  for (const b of biosRes.data ?? []) bioMap[b.user_id] = b

  const matches = (profilesRes.data ?? [])
    .map(p => {
      const { score, reasons } = computeMatch(myBio, bioMap[p.id] ?? null)
      return { profile: p, bio: bioMap[p.id] ?? null, score, reasons }
    })
    .sort((a, b) => b.score - a.score)

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          Your Matches
        </h1>
        <p className="text-muted-foreground mt-2">People in the network who share your values, interests, and goals</p>
      </div>

      {!myBio && (
        <Card className="border-card-border bg-primary/5 border-primary/20">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-semibold mb-1">Complete your profile to unlock match scores</p>
              <p className="text-sm text-muted-foreground">Add your values, skills, and personality to find your best matches.</p>
            </div>
            <Button asChild>
              <Link href="/profile/edit"><Pencil className="h-4 w-4 mr-2" />Complete Profile</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-card-border bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader><CardTitle className="text-lg">How Matching Works</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>We analyze multiple dimensions to find your best matches:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Shared Skills</strong> — up to 30 pts (5 each)</li>
            <li><strong>Shared Interests</strong> — up to 20 pts (4 each)</li>
            <li><strong>OCEAN Similarity</strong> — up to 25 pts</li>
            <li><strong>MBTI Compatibility</strong> — up to 25 pts</li>
          </ul>
        </CardContent>
      </Card>

      <MatchesTabs matches={matches} />
    </div>
  )
}
