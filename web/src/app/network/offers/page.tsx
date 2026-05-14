'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, Gift, Pencil, Trash2, Loader2 } from 'lucide-react'

const CATEGORIES = [
  'Permaculture','Construction','Healing','Education',
  'Technology','Art','Music','Food','Childcare',
  'Legal','Finance','Consulting','Other',
]

const COMPENSATION = [
  { value: 'Free',        label: 'Free' },
  { value: 'Donation',    label: 'Donation-based' },
  { value: 'Fixed Price', label: 'Fixed Price' },
  { value: 'Hourly',      label: 'Hourly Rate' },
  { value: 'Barter',      label: 'Barter / Trade' },
  { value: 'Other',       label: 'Other' },
]

interface Offer {
  id: string; title: string; description: string | null
  category: string | null; compensation_model: string | null; price: string | null
  is_active: boolean; created_at: string
}

export default function OffersPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [offers, setOffers] = useState<Offer[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Offer | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [compensation, setCompensation] = useState('Other')
  const [price, setPrice] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)
      const { data } = await supabase.from('user_offers').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setOffers(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  function openNew() {
    setEditing(null); setTitle(''); setDescription(''); setCategory(''); setCompensation('Other'); setPrice('')
    setDialogOpen(true)
  }
  function openEdit(o: Offer) {
    setEditing(o); setTitle(o.title); setDescription(o.description ?? ''); setCategory(o.category ?? '')
    setCompensation(o.compensation_model ?? 'Other'); setPrice(o.price ?? '')
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!userId || !title.trim()) return
    setSaving(true)
    const payload = {
      user_id: userId, title, description: description || null,
      category: category || null, compensation_model: compensation, price: price || null, is_active: true,
    }
    if (editing) {
      const { data } = await supabase.from('user_offers').update(payload).eq('id', editing.id).select().single()
      setOffers(prev => prev.map(o => o.id === editing.id ? data! : o))
    } else {
      const { data } = await supabase.from('user_offers').insert(payload).select().single()
      setOffers(prev => [data!, ...prev])
    }
    setSaving(false); setDialogOpen(false)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    await supabase.from('user_offers').delete().eq('id', id)
    setOffers(prev => prev.filter(o => o.id !== id))
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
          <h1 className="text-2xl font-bold">My Offers</h1>
          <p className="text-muted-foreground text-sm mt-1">Services, skills, and resources you offer to the community</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Add Offer</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Offer' : 'New Offer'}</DialogTitle>
              <DialogDescription>Share a service, skill, or resource with the community.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Permaculture Design Consultation" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what you offer..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Compensation</Label>
                  <Select value={compensation} onValueChange={setCompensation}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{COMPENSATION.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              {(compensation === 'Fixed Price' || compensation === 'Hourly') && (
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g., $50/hour" />
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving || !title.trim()} className="flex-1">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editing ? 'Save Changes' : 'Add Offer'}
                </Button>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {offers.length === 0 ? (
        <Card className="border-card-border">
          <CardContent className="py-16 text-center">
            <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No offers yet</h3>
            <p className="text-muted-foreground mb-4">Share your skills and resources with the community.</p>
            <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Add Your First Offer</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {offers.map(o => (
            <Card key={o.id} className="border-card-border">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{o.title}</CardTitle>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(o)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(o.id)} disabled={deletingId === o.id}>
                      {deletingId === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {o.description && <p className="text-sm text-muted-foreground mb-3">{o.description}</p>}
                <div className="flex items-center gap-2 flex-wrap">
                  {o.category && <Badge variant="secondary">{o.category}</Badge>}
                  {o.compensation_model && <Badge variant="outline">{o.compensation_model}</Badge>}
                  {o.price && <span className="text-sm font-medium">{o.price}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
