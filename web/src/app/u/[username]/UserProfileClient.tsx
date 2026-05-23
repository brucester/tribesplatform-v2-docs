'use client'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card'
import { Badge } from '@/core/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/core/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs'
import { Button } from '@/core/components/ui/button'
import { Progress } from '@/core/components/ui/progress'
import { MapPin, Heart, Brain, Star, Target, Gift, HelpCircle, Plane, Briefcase, Pencil, Sparkles } from 'lucide-react'

interface ProfileData {
  id: string; username: string; first_name: string | null; last_name: string | null
  headline: string | null; country: string | null; city: string | null
  avatar_url: string | null; user_types: string[] | null
}
interface BioData {
  values_principles: string | null; what_creating: string | null
  personality_details: { myersBriggs?: string | null; ocean?: { openness?: number; conscientiousness?: number; extraversion?: number; agreeableness?: number; neuroticism?: number } | null } | null
  archetypes: { astrology?: { sun?: string | null; moon?: string | null; rising?: string | null } | null; humanDesign?: string | null; geneKey?: string | null; mayan?: string | null } | null
  goals: string | null; fears: string | null; traumas: string | null
  skills: string[] | null; interests: string[] | null
  places_traveling: Array<{ location: string; startDate?: string; endDate?: string; notes?: string }> | null
}
interface OfferData { id: string; category: string | null; title: string; description: string | null; compensation_model: string | null; price: string | null }
interface RequestData { id: string; category: string | null; request_text: string; urgency: string | null }

interface Props {
  profile: ProfileData; bio: BioData | null
  offers: OfferData[]; requests: RequestData[]
  isOwn: boolean
  match?: { score: number; reasons: string[] } | null
}

const OCEAN_TRAITS = [
  { key: 'openness', label: 'Openness' },
  { key: 'conscientiousness', label: 'Conscientiousness' },
  { key: 'extraversion', label: 'Extraversion' },
  { key: 'agreeableness', label: 'Agreeableness' },
  { key: 'neuroticism', label: 'Neuroticism' },
] as const

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <Card className="border-card-border">
      <CardContent className="py-12 text-center">
        <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}

function AboutTab({ bio }: { bio: BioData | null }) {
  if (!bio || (!bio.values_principles && !bio.what_creating && !(bio.skills ?? []).length && !(bio.interests ?? []).length && !bio.goals && !bio.fears && !bio.traumas)) {
    return <EmptyState icon={Heart} message="No bio information added yet" />
  }
  return (
    <div className="space-y-4">
      {bio.values_principles && (
        <Card className="border-card-border">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Heart className="h-5 w-5 text-primary" />Values & Principles</CardTitle></CardHeader>
          <CardContent><p className="text-sm leading-relaxed whitespace-pre-wrap">{bio.values_principles}</p></CardContent>
        </Card>
      )}
      {((bio.skills ?? []).length > 0 || (bio.interests ?? []).length > 0) && (
        <Card className="border-card-border">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Briefcase className="h-5 w-5 text-primary" />Skills & Interests</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {(bio.skills ?? []).length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">{(bio.skills ?? []).map(s => <Badge key={s} variant="secondary">{s}</Badge>)}</div>
              </div>
            )}
            {(bio.interests ?? []).length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Interests</p>
                <div className="flex flex-wrap gap-2">{(bio.interests ?? []).map(i => <Badge key={i} variant="outline">{i}</Badge>)}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {(bio.goals || bio.what_creating) && (
        <Card className="border-card-border">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Target className="h-5 w-5 text-primary" />Goals & Projects</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {bio.goals && <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Goals</p><p className="text-sm leading-relaxed whitespace-pre-wrap">{bio.goals}</p></div>}
            {bio.what_creating && <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Currently Creating</p><p className="text-sm leading-relaxed whitespace-pre-wrap">{bio.what_creating}</p></div>}
          </CardContent>
        </Card>
      )}
      {(bio.fears || bio.traumas) && (
        <Card className="border-card-border">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Heart className="h-5 w-5 text-primary" />Growth & Healing</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {bio.fears && <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Fears & Challenges</p><p className="text-sm leading-relaxed whitespace-pre-wrap">{bio.fears}</p></div>}
            {bio.traumas && <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Healing Journey</p><p className="text-sm leading-relaxed whitespace-pre-wrap">{bio.traumas}</p></div>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function PersonalityTab({ bio }: { bio: BioData | null }) {
  const pd = bio?.personality_details
  const arc = bio?.archetypes
  const hasOcean = pd?.ocean && Object.values(pd.ocean).some(v => v != null)
  if (!pd?.myersBriggs && !hasOcean && !arc) return <EmptyState icon={Brain} message="No personality data added yet" />
  return (
    <div className="space-y-4">
      {pd?.myersBriggs && (
        <Card className="border-card-border">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Brain className="h-5 w-5 text-primary" />Myers-Briggs Type</CardTitle></CardHeader>
          <CardContent><div className="text-4xl font-bold text-primary">{pd.myersBriggs}</div></CardContent>
        </Card>
      )}
      {hasOcean && (
        <Card className="border-card-border">
          <CardHeader><CardTitle className="text-lg">OCEAN Personality Traits</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {OCEAN_TRAITS.map(({ key, label }) => {
              const value = (pd!.ocean as any)?.[key] ?? 50
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm"><span>{label}</span><span className="text-muted-foreground">{value}%</span></div>
                  <Progress value={value} className="h-2" />
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
      {arc && (arc.astrology?.sun || arc.astrology?.moon || arc.astrology?.rising || arc.humanDesign || arc.geneKey || arc.mayan) && (
        <Card className="border-card-border">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Star className="h-5 w-5 text-primary" />Archetypes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {(arc.astrology?.sun || arc.astrology?.moon || arc.astrology?.rising) && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Astrology</p>
                <div className="grid grid-cols-3 gap-4">
                  {arc.astrology?.sun && <div className="text-center p-3 rounded-lg bg-muted"><p className="text-xs text-muted-foreground">Sun</p><p className="font-medium">{arc.astrology.sun}</p></div>}
                  {arc.astrology?.moon && <div className="text-center p-3 rounded-lg bg-muted"><p className="text-xs text-muted-foreground">Moon</p><p className="font-medium">{arc.astrology.moon}</p></div>}
                  {arc.astrology?.rising && <div className="text-center p-3 rounded-lg bg-muted"><p className="text-xs text-muted-foreground">Rising</p><p className="font-medium">{arc.astrology.rising}</p></div>}
                </div>
              </div>
            )}
            {arc.humanDesign && <div><p className="text-sm font-medium text-muted-foreground">Human Design</p><p className="font-medium">{arc.humanDesign}</p></div>}
            {arc.geneKey && <div><p className="text-sm font-medium text-muted-foreground">Gene Key</p><p className="font-medium">{arc.geneKey}</p></div>}
            {arc.mayan && <div><p className="text-sm font-medium text-muted-foreground">Mayan Sign</p><p className="font-medium">{arc.mayan}</p></div>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function OffersTab({ offers }: { offers: OfferData[] }) {
  if (!offers.length) return <EmptyState icon={Gift} message="No offers yet" />
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {offers.map(o => (
        <Card key={o.id} className="border-card-border">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base">{o.title}</CardTitle>
              {o.category && <Badge variant="secondary" className="flex-shrink-0">{o.category}</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            {o.description && <p className="text-sm text-muted-foreground mb-3">{o.description}</p>}
            <div className="flex items-center gap-2">
              {o.compensation_model && <Badge variant="outline">{o.compensation_model}</Badge>}
              {o.price && <span className="text-sm font-medium">{o.price}</span>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function RequestsTab({ requests }: { requests: RequestData[] }) {
  if (!requests.length) return <EmptyState icon={HelpCircle} message="No requests yet" />
  return (
    <div className="space-y-4">
      {requests.map(r => (
        <Card key={r.id} className="border-card-border">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm flex-1">{r.request_text}</p>
              <div className="flex gap-2 flex-shrink-0">
                {r.category && <Badge variant="secondary">{r.category}</Badge>}
                {r.urgency && r.urgency !== 'normal' && (
                  <Badge variant={r.urgency === 'urgent' ? 'destructive' : 'outline'}>{r.urgency}</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TravelTab({ travels }: { travels: BioData['places_traveling'] }) {
  if (!travels?.length) return <EmptyState icon={Plane} message="No travel plans shared" />
  return (
    <div className="space-y-4">
      {travels.map((t, i) => (
        <Card key={i} className="border-card-border">
          <CardContent className="pt-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{t.location}</h4>
                {(t.startDate || t.endDate) && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {t.startDate && new Date(t.startDate).toLocaleDateString('en', { month: 'short', year: 'numeric' })}
                    {t.startDate && t.endDate && ' – '}
                    {t.endDate && new Date(t.endDate).toLocaleDateString('en', { month: 'short', year: 'numeric' })}
                  </p>
                )}
                {t.notes && <p className="text-sm text-muted-foreground mt-1">{t.notes}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function UserProfileClient({ profile: p, bio, offers, requests, isOwn, match }: Props) {
  const displayName = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.username
  const initial = displayName[0]?.toUpperCase() ?? '?'
  const location = [p.city, p.country].filter(Boolean).join(', ')

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <Card className="border-card-border overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20" />
        <CardContent className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg flex-shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">{initial}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-bold">{displayName}</h1>
                  <p className="text-muted-foreground text-sm">@{p.username}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isOwn && match && (
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      background: match.score >= 70
                        ? 'color-mix(in srgb, var(--m5) 10%, var(--surface))'
                        : match.score >= 40
                        ? 'color-mix(in srgb, #f59e0b 10%, var(--surface))'
                        : 'var(--bg-2)',
                      border: `1px solid ${match.score >= 70 ? 'color-mix(in srgb, var(--m5) 35%, var(--rule))' : match.score >= 40 ? 'color-mix(in srgb, #f59e0b 35%, var(--rule))' : 'var(--rule)'}`,
                      borderRadius: 12, padding: '10px 16px', minWidth: 90, gap: 4,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Sparkles style={{
                          width: 13, height: 13,
                          color: match.score >= 70 ? 'var(--m5)' : match.score >= 40 ? '#f59e0b' : 'var(--ink-4)',
                        }} />
                        <span style={{
                          fontSize: 22, fontWeight: 800, lineHeight: 1,
                          color: match.score >= 70 ? 'var(--m5)' : match.score >= 40 ? '#f59e0b' : 'var(--ink-3)',
                        }}>{match.score}%</span>
                      </div>
                      <span style={{ fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--ink-4)', letterSpacing: '0.04em' }}>
                        match
                      </span>
                      {match.reasons.length > 0 && (
                        <span style={{ fontSize: 10, color: 'var(--ink-3)', textAlign: 'center', lineHeight: 1.4, marginTop: 2 }}>
                          {match.reasons[0]}
                        </span>
                      )}
                    </div>
                  )}
                  {isOwn && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/profile/edit"><Pencil className="h-4 w-4 mr-1" />Edit profile</Link>
                    </Button>
                  )}
                </div>
              </div>
              {p.headline && <p className="text-sm mt-1 font-medium">{p.headline}</p>}
              {location && (
                <span className="flex items-center text-sm text-muted-foreground mt-1">
                  <MapPin className="mr-1 h-4 w-4" />{location}
                </span>
              )}
              {(p.user_types ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {(p.user_types ?? []).map(t => <Badge key={t} variant="outline">{t}</Badge>)}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="about" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="personality">Personality</TabsTrigger>
          <TabsTrigger value="offers">Offers ({offers.length})</TabsTrigger>
          <TabsTrigger value="requests">Requests ({requests.length})</TabsTrigger>
          <TabsTrigger value="travel">Travel</TabsTrigger>
        </TabsList>
        <TabsContent value="about" className="mt-6"><AboutTab bio={bio} /></TabsContent>
        <TabsContent value="personality" className="mt-6"><PersonalityTab bio={bio} /></TabsContent>
        <TabsContent value="offers" className="mt-6"><OffersTab offers={offers} /></TabsContent>
        <TabsContent value="requests" className="mt-6"><RequestsTab requests={requests} /></TabsContent>
        <TabsContent value="travel" className="mt-6"><TravelTab travels={bio?.places_traveling ?? []} /></TabsContent>
      </Tabs>
    </div>
  )
}
