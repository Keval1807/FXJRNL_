'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      setError('Check your email to confirm your account, then sign in.')
      setIsSignUp(false)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleOAuth(provider: 'google' | 'discord') {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4"
      style={{backgroundImage:'radial-gradient(circle at 20% 50%,rgba(0,212,160,.06) 0%,transparent 50%),radial-gradient(circle at 80% 20%,rgba(0,180,230,.06) 0%,transparent 50%)'}}>
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green to-blue flex items-center justify-center text-lg font-black text-black shadow-lg shadow-green/30">
            FX
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">FX Journal</div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-tx3">Terminal Pro</div>
          </div>
        </div>

        <div className="card p-8">
          <h1 className="text-xl font-bold mb-1">{isSignUp ? 'Create Account' : 'Welcome back'}</h1>
          <p className="text-sm text-tx3 mb-6">{isSignUp ? 'Start journaling your trades' : 'Sign in to your journal'}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="trader@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className={`text-xs ${error.includes('Check') ? 'text-green' : 'text-red'}`}>{error}</p>
            )}

            <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
              {loading ? 'Please wait…' : isSignUp ? 'Create Account' : 'Sign In →'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-tx4">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleOAuth('google')} className="btn-ghost flex items-center justify-center gap-2 py-2">
              <span>G</span> Google
            </button>
            <button onClick={() => handleOAuth('discord')} className="btn-ghost flex items-center justify-center gap-2 py-2">
              <span>💬</span> Discord
            </button>
          </div>

          <p className="text-center text-xs text-tx3 mt-5">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-green hover:underline font-semibold">
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-tx4 mt-4">
          Your data is private and secure. Powered by Supabase.
        </p>
      </div>
    </div>
  )
}
