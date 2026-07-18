import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Notes from './Notes'
import { Eye, EyeOff } from 'lucide-react'

const Register = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { handleRegister } = useAuth()

  const handleSubmitForm = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    const payload = { username, email, password }

    try {
      await handleRegister(payload)
      navigate('/notes', { replace: true })
    } catch (err) {
      const message =
        err?.response?.data?.errors?.[0]?.msg ||
        err?.response?.data?.message ||
        err?.message ||
        'Something went wrong. Please try again.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-neutral-950 via-zinc-900 to-cyan-950 text-white">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-5 py-10">
        <div className="w-full rounded-2xl border border-[#31b8c6]/40 bg-zinc-900/80 p-7 shadow-[0_0_45px_-12px_rgba(49,184,198,0.65)] backdrop-blur-md">
          <h1 className="text-center text-3xl font-bold tracking-tight text-[#31b8c6]">Register</h1>
          <p className="mt-2 text-center text-sm text-zinc-300">Create your account to get started.</p>

          {error && (
            <div className="mt-5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
              {error}
            </div>
          )}

          <form className="mt-7 space-y-5" onSubmit={handleSubmitForm}>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-200" htmlFor="register-username">
                Username
              </label>
              <input
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-[#31b8c6] focus:ring-2 focus:ring-[#31b8c6]/40"
                id="register-username"
                name="username"
                onChange={(event) => {
                  setUsername(event.target.value)
                  if (error) setError('')
                }}
                placeholder="Choose a username"
                required
                type="text"
                value={username}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-200" htmlFor="register-email">
                Email
              </label>
              <input
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-[#31b8c6] focus:ring-2 focus:ring-[#31b8c6]/40"
                id="register-email"
                name="email"
                onChange={(event) => {
                  setEmail(event.target.value)
                  if (error) setError('')
                }}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-200" htmlFor="register-password">
                Password
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-4 py-2.5 pr-11 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-[#31b8c6] focus:ring-2 focus:ring-[#31b8c6]/40"
                  id="register-password"
                  name="password"
                  onChange={(event) => {
                    setPassword(event.target.value)
                    if (error) setError('')
                  }}
                  placeholder="Enter your password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                />
                <button
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-[#31b8c6] focus:outline-none"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  type="button"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#31b8c6] via-cyan-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:from-cyan-400 hover:via-cyan-300 hover:to-cyan-200 focus:outline-none focus:ring-2 focus:ring-[#31b8c6] focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting}
              type="submit"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
            <p className="mt-3 text-center text-sm text-zinc-300">
              Already have an account?{' '}
              <Link className="text-[#31b8c6] font-semibold hover:underline" to="/login">Login</Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  )
}

export default Register