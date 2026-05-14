'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { computeMatch, type Bio } from '@/lib/match-score'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { MapPin, Search, Filter, Users, X, Sparkles } from 'lucide-react'

const ROLE_FILTERS = [
  { value: 'all',                   label: 'All Types' },
  { value: 'Exploring',             label: 'Exploring' },
  { value: 'Community Member',      label: 'Community Member' },
  { value: 'Vision Holder',         label: 'Vision Holder' },
  { value: 'Service Provider',      label: 'Service Provider' },
  { value: 'Resource Holder - Land',  label: 'Resource Holder – Land' },
  { value: 'Resource Holder - Money', label: 'Resource Holder – Money' },
]

interface Profile {
  id: string
  username: string
  first_name: string | null
  last_name: string | null
  headline: string | null
  country: string | null
  city: string | null
  avatar_url: string | null
  user_types: string[] | null
}

interface Props {
  profiles: Profile[]
  bioMap: Record<string, NonNullable<Bio>>
  myBio: Bio
  isLoggedIn: boolean
}

function UserCard({ profile: p, bio, score, reasons, isLoggedIn }: {
  profile: Profile; bio: NonNullable<Bio> | null; score: number; reasons: string[]; isLoggedIn: boolean
}) {
  const displayName = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.username
  const initial = displayName[0]?.toUpperCase() ?? '?'
  const location = [p.city, p.country].filter(Boolean).join(', ')

  return (
    <Link href={`/u/${p.username}`}>
      <Card className="border-card-border hover-elevate cursor-pointer h-full">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={p.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">{initial}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold truncate">{displayName}</h3>
                  <p className="text-sm text-muted-foreground">@{p.username}</p>
                </div>
                {(p.user_types ?? []).length > 0 && (
                  <Badge variant="secondary" className="flex-shrink-0 text-xs">
                    {(p.user_types ?? [])[0]}
                  </Badge>
                )}
              </div>
              {p.headline && <p className="text-sm mt-1 text-muted-foreground line-clamp-1">{p.headline}</p>}
              {location && (
                <span className="flex items-center text-xs text-muted-foreground mt-2">
                  <MapPin className="mr-1 h-3 w-3" />{location}
                </span>
              )}
              {bio && (bio.skills ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {(bio.skills ?? []).slice(0, 3).map((s: string) => (
                    <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                  ))}
                  {(bio.skills ?? []).length > 3 && (
                    <Badge variant="outline" className="text-xs">+{(bio.skills ?? []).length - 3}</Badge>
                  )}
                </div>
              )}
              {isLoggedIn && (
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground truncate">{reasons[0] ?? 'No overlap yet'}</p>
                  <span className={`text-sm font-bold shrink-0 ml-2 ${score >= 60 ? 'text-primary' : score >= 30 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                    {score}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function DiscoverClient({ profiles, bioMap, myBio, isLoggedIn }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const handleSearch = () => setDebouncedQuery(searchQuery)

  const members = useMemo(() => {
    let list = profiles.map(p => {
      const bio = bioMap[p.id] ?? null
      const { score, reasons } = computeMatch(myBio, bio)
      return { profile: p, bio, score, reasons }
    })

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase()
      list = list.filter(({ profile: p, bio }) =>
        (p.first_name ?? '').toLowerCase().includes(q) ||
        (p.last_name ?? '').toLowerCase().includes(q) ||
        (p.username ?? '').toLowerCase().includes(q) ||
        (p.city ?? '').toLowerCase().includes(q) ||
        (p.country ?? '').toLowerCase().includes(q) ||
        (p.headline ?? '').toLowerCase().includes(q) ||
        (bio?.skills ?? []).some((s: string) => s.toLowerCase().includes(q)) ||
        (bio?.interests ?? []).some((i: string) => i.toLowerCase().includes(q))
      )
    }

    if (roleFilter !== 'all') {
      list = list.filter(({ profile: p }) => (p.user_types ?? []).includes(roleFilter))
    }

    return list.sort((a, b) => b.score - a.score)
  }, [profiles, bioMap, myBio, debouncedQuery, roleFilter])

  const hasFilters = !!debouncedQuery || roleFilter !== 'all'
  const clearFilters = () => { setSearchQuery(''); setDebouncedQuery(''); setRoleFilter('all') }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Search the Network</h1>
        <p className="text-muted-foreground mt-1">Find like-minded people by values, skills, personality, interests, and more</p>
      </div>

      <Card className="border-card-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name, location, skills, interests..."
                className="pl-10" />
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_FILTERS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={handleSearch}>Search</Button>
            </div>
          </div>

          {hasFilters && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {debouncedQuery && (
                <Badge variant="secondary" className="gap-1">
                  "{debouncedQuery}"
                  <button onClick={() => { setSearchQuery(''); setDebouncedQuery('') }}><X className="h-3 w-3" /></button>
                </Badge>
              )}
              {roleFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {ROLE_FILTERS.find(r => r.value === roleFilter)?.label}
                  <button onClick={() => setRoleFilter('all')}><X className="h-3 w-3" /></button>
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters}>Clear all</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {members.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">{members.length} result{members.length !== 1 ? 's' : ''} found</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map(({ profile: p, bio, score, reasons }) => (
              <UserCard key={p.id} profile={p} bio={bio} score={score} reasons={reasons} isLoggedIn={isLoggedIn} />
            ))}
          </div>
        </>
      ) : (
        <Card className="border-card-border">
          <CardContent className="py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No members found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {hasFilters ? 'Try adjusting your search terms or filters.' : 'Be the first to complete your profile and start building the network!'}
            </p>
            {hasFilters && <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear Filters</Button>}
          </CardContent>
        </Card>
      )}

      {!isLoggedIn && (
        <Card className="border-card-border bg-primary/5 border-primary/20">
          <CardContent className="py-10 text-center space-y-3">
            <Sparkles className="h-10 w-10 text-primary mx-auto" />
            <p className="font-semibold text-lg">Join to see compatibility scores</p>
            <p className="text-sm text-muted-foreground">Create a profile to discover your best community matches.</p>
            <Button asChild><Link href="/auth/login">Create profile</Link></Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
