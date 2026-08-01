import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { useAuth } from '../hook/useAuth'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { clearError } from '../state/auth.slice.js' 

const Login = () => {
  const { handleLogin } = useAuth()
  const { loading } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const error = useSelector((state) => state.auth.error)
  const dispatch = useDispatch()

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    dispatch(clearError())
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleLogin(formData)
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="mb-14 text-center">
          <h1 className="text-2xl font-semibold tracking-[0.3em] text-white">
            SNITCH
          </h1>
          <p className="mt-3 text-sm text-neutral-500">Welcome back</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs uppercase tracking-wider text-neutral-500"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full bg-transparent border-b border-neutral-800 py-2.5 text-white placeholder-neutral-600 outline-none transition-colors focus:border-violet-500"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs uppercase tracking-wider text-neutral-500"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-transparent border-b border-neutral-800 py-2.5 pr-8 text-white placeholder-neutral-600 outline-none transition-colors focus:border-violet-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-white py-3 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-12 text-center text-sm text-neutral-500">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-white hover:text-violet-400 transition-colors"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login