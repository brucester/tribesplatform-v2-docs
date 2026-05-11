'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback?onboarding=1` },
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, marginBottom: 8 }}>Join the network</h1>
          <p style={{ color: 'var(--ink-3)', fontSize: 14 }}>
            Free to join. No password — we use a magic link sent to your email.
          </p>
        </div>

        {sent ? (
          <div style={{
            background: 'var(--accent-soft)', border: '1px solid rgba(45,106,79,0.2)',
            borderRadius: 'var(--radius-lg)', padding: '24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✉️</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Check your inbox</div>
            <p style={{ color: 'var(--ink-2)', fontSize: 14 }}>
              We sent a magic link to <strong>{email}</strong>. Click it to create your profile.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSignup} style={{
            background: 'var(--surface)', border: '1px solid var(--rule)',
            borderRadius: 'var(--radius-lg)', padding: '32px',
          }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--ink-2)' }}>
              Your email address
            </label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ marginBottom: 16 }}
            />
            {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button type="submit" disabled={loading} style={{
              width: '100%', background: 'var(--accent)', color: '#fff',
              fontWeight: 600, fontSize: 15, padding: '12px',
              borderRadius: 'var(--radius)', border: 'none',
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Sending...' : 'Get my magic link'}
            </button>
            <p style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 12, textAlign: 'center', lineHeight: 1.5 }}>
              By joining you agree to use the platform respectfully and in alignment with regenerative values.
            </p>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--ink-3)' }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
