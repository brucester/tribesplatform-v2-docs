'use client'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, Heart, Star, Users, MapPin } from 'lucide-react'

interface Match {
  profile: {
    id: string; username: string
    first_name: string | null; last_name: string | null
    city: string | null; country: string | null
    avatar_url: string | null; user_types: string[] | null
  }
  bio: any
  score: number
  reasons: string[]
}

function MatchCard({ match: { profile: p, bio, score, reasons } }: { match: Match }) {
  const displayName = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.username
  const initial = displayName[0]?.toUpperCase() ?? '?'
  const location = [p.city, p.country].filter(Boolean).join(', ')

  return (
    <Link href={`/u/${p.username}`}>
      <Card className="border-card-border hover-elevate cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 flex-shrink-0">
              <AvatarImage src={p.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">{initial}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{displayName}</h3>
                  <p className="text-sm text-muted-foreground">@{p.username}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className={`font-bold text-lg ${score >= 70 ? 'text-primary' : score >= 40 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                    {score}%
                  </span>
                </div>
              </div>

              {location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                  <MapPin className="h-3 w-3" />{location}
                </p>
              )}

              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Match Strength</p>
                  <Progress value={score} className="h-2" />
                </div>

                {reasons.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Why you match:</p>
                    <div className="flex flex-wrap gap-1">
                      {reasons.slice(0, 3).map((r, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{r}</Badge>
                      ))}
                      {reasons.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{reasons.length - 3} more</Badge>
                      )}
                    </div>
                  </div>
                )}

                {bio && ((bio.skills?.length > 0) || (bio.interests?.length > 0)) && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(bio.skills ?? []).slice(0, 3).map((s: string) => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                    {(bio.interests ?? []).slice(0, 2).map((i: string) => (
                      <Badge key={i} variant="outline" className="text-xs">{i}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function EmptySection({ Icon, message }: { Icon: React.ElementType; message: string }) {
  return (
    <Card className="border-card-border">
      <CardContent className="py-12 text-center">
        <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}

export default function MatchesTabs({ matches }: { matches: Match[] }) {
  const top       = matches.filter(m => m.score >= 70)
  const good      = matches.filter(m => m.score >= 50 && m.score < 70)
  const potential = matches.filter(m => m.score < 50)

  return (
    <Tabs defaultValue="top" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="top"><Heart className="h-4 w-4 mr-2" />Top Matches ({top.length})</TabsTrigger>
        <TabsTrigger value="good"><Star className="h-4 w-4 mr-2" />Good Matches ({good.length})</TabsTrigger>
        <TabsTrigger value="potential"><Users className="h-4 w-4 mr-2" />Potential ({potential.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="top" className="mt-6 space-y-4">
        {top.length === 0
          ? <EmptySection Icon={Heart} message="No top matches yet. Complete your profile to find your tribe!" />
          : top.map(m => <MatchCard key={m.profile.id} match={m} />)}
      </TabsContent>
      <TabsContent value="good" className="mt-6 space-y-4">
        {good.length === 0
          ? <EmptySection Icon={Star} message="No good matches found yet." />
          : good.map(m => <MatchCard key={m.profile.id} match={m} />)}
      </TabsContent>
      <TabsContent value="potential" className="mt-6 space-y-4">
        {potential.length === 0
          ? <EmptySection Icon={Users} message="No potential matches to show." />
          : potential.map(m => <MatchCard key={m.profile.id} match={m} />)}
      </TabsContent>
    </Tabs>
  )
}
