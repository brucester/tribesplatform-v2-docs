'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/core/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/core/components/ui/card'
import { Badge } from '@/core/components/ui/badge'
import { Button } from '@/core/components/ui/button'
import { Textarea } from '@/core/components/ui/textarea'
import { Label } from '@/core/components/ui/label'
import { Skeleton } from '@/core/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/core/components/ui/dialog'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/core/components/ui/select'
import { Plus, HelpCircle, Pencil, Trash2, Loader2 } from 'lucide-react'

const CATEGORIES = [
  'Housing','Transport','Skills','Resources','Community',
  'Mentorship','Funding','Land','Tools','Knowledge','Other',
]

const URGENCY_OPTIONS = [
  { value: 'low',    label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high',   label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

const URGENCY_COLORS: Record<string, string> = {
  low:    'bg-muted text-muted-foreground',
  normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  high:   'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

interface Request {
  id: string; request_text: string; category: string | null
  urgency: string | null; is_active: boolean; created_at: string
}

export default function SeeksPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<Request[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Request | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [requestText, setRequestText] = useState('')
  const [category, setCategory] = useState('Other')
  const [urgency, setUrgency] = useState('normal')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)
      const { data } = await supabase.from('user_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setRequests(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  function openNew() {
    setEditing(null); setRequestText(''); setCategory('Other'); setUrgency('normal')
    setDialogOpen(true)
  }
  function openEdit(r: Request) {
    setEditing(r); setRequestText(r.request_text); setCategory(r.category ?? 'Other'); setUrgency(r.urgency ?? 'normal')
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!userId || !requestText.trim()) return
    setSaving(true)
    const payload = { user_id: userId, request_text: requestText.trim(), category, urgency, is_active: true }
    if (editing) {
      const { data } = await supabase.from('user_requests').update(payload).eq('id', editing.id).select().single()
      setRequests(prev => prev.map(r => r.id === editing.id ? data! : r))
    } else {
      const { data } = await supabase.from('user_requests').insert(payload).select().single()
      setRequests(prev => [data!, ...prev])
    }
    setSaving(false); setDialogOpen(false)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    await supabase.from('user_requests').delete().eq('id', id)
    setRequests(prev => prev.filter(r => r.id !== id))
    setDeletingId(null)
  }

  if (loading) return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
      {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
    </div>
  )

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Seeks</h1>
          <p className="text-muted-foreground text-sm mt-1">Help, resources, and connections you're looking for</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Add Seek</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Seek' : 'New Seek'}</DialogTitle>
              <DialogDescription>Tell the community what you need or are looking for.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>What do you need? *</Label>
                <Textarea value={requestText} onChange={e => setRequestText(e.target.value)}
                  placeholder="e.g., Looking for land to co-steward in the Pacific Northwest..." className="min-h-[100px]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Urgency</Label>
                  <Select value={urgency} onValueChange={setUrgency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{URGENCY_OPTIONS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving || !requestText.trim()} className="flex-1">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editing ? 'Save Changes' : 'Post Seek'}
                </Button>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {requests.length === 0 ? (
        <Card className="border-card-border">
          <CardContent className="py-16 text-center">
            <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No seeks yet</h3>
            <p className="text-muted-foreground mb-4">Let the community know what you need.</p>
            <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Post Your First Seek</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {requests.map(r => (
            <Card key={r.id} className="border-card-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex gap-2 flex-wrap">
                    {r.category && <Badge variant="secondary">{r.category}</Badge>}
                    {r.urgency && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${URGENCY_COLORS[r.urgency] ?? ''}`}>
                        {r.urgency.charAt(0).toUpperCase() + r.urgency.slice(1)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(r.id)} disabled={deletingId === r.id}>
                      {deletingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <p className="text-sm">{r.request_text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
