'use client'
// app/auth/register/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setLoading(false); return }
    setDone(true)
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0e1117' }}>
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-xl font-bold mb-2">Check your email</h2>
        <p className="text-tx3 text-sm">We&apos;ve sent a confirmation link to <strong className="text-tx">{email}</strong>. Click it to activate your account.</p>
        <Link href="/auth/login" className="inline-block mt-6 text-teal text-sm hover:underline">← Back to login</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(circle at 80% 50%, rgba(0,180,230,.05) 0%, transparent 50%), #0e1117' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-black text-lg"
            style={{ background: 'linear-gradient(135deg, #00d4a0, #00b4e6)' }}>
            FX
          </div>
          <div>
            <div className="text-lg font-bold">FX Journal</div>
            <div className="text-xs text-tx3 uppercase tracking-widest">Terminal Pro</div>
          </div>
        </div>

        <div className="rounded-2xl border p-8" style={{ background: '#151b25', borderColor: '#1e2d42' }}>
          <h1 className="text-xl font-bold mb-1">Create account</h1>
          <p className="text-tx3 text-sm mb-6">Start journaling your trades today</p>

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-tx3 mb-1.5">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field w-full rounded-lg px-3 py-2.5 text-sm border"
                style={{ background: '#1a2232', borderColor: '#263650', color: '#c8d8f0' }} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-tx3 mb-1.5">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="input-field w-full rounded-lg px-3 py-2.5 text-sm border"
                style={{ background: '#1a2232', borderColor: '#263650', color: '#c8d8f0' }} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-tx3 mb-1.5">Confirm Password</label>
              <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat password"
                className="input-field w-full rounded-lg px-3 py-2.5 text-sm border"
                style={{ background: '#1a2232', borderColor: '#263650', color: '#c8d8f0' }} />
            </div>
            {error && <p className="text-rose text-xs">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg font-bold text-sm text-black disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #00d4a0, #00b4e6)', boxShadow: '0 4px 16px rgba(0,212,160,.3)' }}>
              {loading ? 'Creating…' : 'Create Account →'}
            </button>
          </form>

          <p className="text-center text-xs text-tx3 mt-5">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-teal hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
