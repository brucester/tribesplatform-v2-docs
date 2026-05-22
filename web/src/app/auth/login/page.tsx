'use client'
import { useState } from 'react'
import { createClient } from '@/core/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card'
import { Button } from '@/core/components/ui/button'
import { Input } from '@/core/components/ui/input'
import { Label } from '@/core/components/ui/label'
import { Loader2, Sprout, Users, Globe, Heart } from 'lucide-react'

type Mode = 'login' | 'register' | 'forgot'

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const supabase = createClient()
  const router = useRouter()

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Register state
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [regFirstName, setRegFirstName] = useState('')
  const [regError, setRegError] = useState('')
  const [regLoading, setRegLoading] = useState(false)
  const [regSent, setRegSent] = useState(false)

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword })
    if (error) {
      setLoginError(error.message)
    } else {
      router.push('/home')
      router.refresh()
    }
    setLoginLoading(false)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setRegError('')
    if (regPassword !== regConfirm) { setRegError("Passwords don't match"); return }
    if (regPassword.length < 6) { setRegError('Password must be at least 6 characters'); return }
    setRegLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        data: { first_name: regFirstName },
        emailRedirectTo: `${location.origin}/auth/callback?onboarding=1`,
      },
    })
    if (error) {
      setRegError(error.message)
    } else if (data.user && !data.session) {
      setRegSent(true)
    } else {
      router.push('/home')
      router.refresh()
    }
    setRegLoading(false)
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setForgotError('')
    setForgotLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${location.origin}/auth/reset-password`,
    })
    if (error) {
      setForgotError(error.message)
    } else {
      setForgotSent(true)
    }
    setForgotLoading(false)
  }

  const titles: Record<Mode, string> = {
    login: 'Welcome back',
    register: 'Join the network',
    forgot: 'Reset your password',
  }
  const descriptions: Record<Mode, string> = {
    login: 'Sign in to connect with the regenerative community',
    register: 'Create your profile and start building connections',
    forgot: 'Enter your email and we\'ll send you a reset link',
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md border-card-border">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Sprout className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold">MyCoNet</span>
            </div>
            <CardTitle className="text-2xl">{titles[mode]}</CardTitle>
            <CardDescription>{descriptions[mode]}</CardDescription>
          </CardHeader>
          <CardContent>
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" required
                    value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                    placeholder="you@example.com" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <button type="button" onClick={() => setMode('forgot')}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      Forgot password?
                    </button>
                  </div>
                  <Input id="login-password" type="password" required
                    value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                    placeholder="Enter your password" />
                </div>
                {loginError && <p className="text-sm text-destructive">{loginError}</p>}
                <Button type="submit" className="w-full" disabled={loginLoading}>
                  {loginLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : 'Sign in'}
                </Button>
              </form>
            )}

            {mode === 'register' && (regSent ? (
              <div className="text-center py-6 space-y-3">
                <div className="text-4xl">✉️</div>
                <p className="font-semibold">Check your inbox</p>
                <p className="text-sm text-muted-foreground">
                  We sent a confirmation link to <strong>{regEmail}</strong>. Click it to activate your account.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">First Name</Label>
                  <Input id="reg-name" required
                    value={regFirstName} onChange={e => setRegFirstName(e.target.value)}
                    placeholder="Jane" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input id="reg-email" type="email" required
                    value={regEmail} onChange={e => setRegEmail(e.target.value)}
                    placeholder="you@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input id="reg-password" type="password" required
                    value={regPassword} onChange={e => setRegPassword(e.target.value)}
                    placeholder="Create a password (min 6 chars)" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-confirm">Confirm Password</Label>
                  <Input id="reg-confirm" type="password" required
                    value={regConfirm} onChange={e => setRegConfirm(e.target.value)}
                    placeholder="Confirm your password" />
                </div>
                {regError && <p className="text-sm text-destructive">{regError}</p>}
                <Button type="submit" className="w-full" disabled={regLoading}>
                  {regLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : 'Create account'}
                </Button>
              </form>
            ))}

            {mode === 'forgot' && (forgotSent ? (
              <div className="text-center py-6 space-y-3">
                <div className="text-4xl">✉️</div>
                <p className="font-semibold">Check your inbox</p>
                <p className="text-sm text-muted-foreground">
                  We sent a password reset link to <strong>{forgotEmail}</strong>.
                </p>
                <Button variant="outline" className="mt-2" onClick={() => { setForgotSent(false); setMode('login') }}>
                  Back to sign in
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input id="forgot-email" type="email" required
                    value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                    placeholder="you@example.com" />
                </div>
                {forgotError && <p className="text-sm text-destructive">{forgotError}</p>}
                <Button type="submit" className="w-full" disabled={forgotLoading}>
                  {forgotLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : 'Send reset link'}
                </Button>
              </form>
            ))}

            <div className="mt-6 text-center space-y-2">
              {mode === 'login' && (
                <button type="button" onClick={() => setMode('register')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors block w-full">
                  Don't have an account? Sign up
                </button>
              )}
              {mode === 'register' && (
                <button type="button" onClick={() => setMode('login')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors block w-full">
                  Already have an account? Sign in
                </button>
              )}
              {mode === 'forgot' && !forgotSent && (
                <button type="button" onClick={() => setMode('login')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors block w-full">
                  Back to sign in
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="hidden lg:flex flex-col justify-center p-12 bg-primary text-primary-foreground">
        <div className="max-w-lg">
          <h1 className="text-4xl font-bold mb-6">Connect with aligned humans</h1>
          <p className="text-xl mb-12 opacity-90">
            MyCoNet is your community portal — connect with members, explore the project plan, and build together.
          </p>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Deep Profiles</h3>
                <p className="opacity-80">Share your values, personality, and goals to find suggested matches.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Global & Local Networks</h3>
                <p className="opacity-80">Find community builders across the world or in your region.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
                <Heart className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Value Exchange</h3>
                <p className="opacity-80">Share your offerings and discover what others can provide.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
