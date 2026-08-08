import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useAuth } from '../hook/useAuth'
import { replace, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { clearError } from '../state/auth.slice.js'
import GoogleBtn from '../Components/GoogleBtn.jsx'

const initialForm = {
  fullName: '',
  email: '',
  contact: '',
  password: '',
  isSeller: false,
}

const Register = () => {
  const { handleRegister } = useAuth()
  const { loading } = useSelector((state) => state.auth)
  const [form, setForm] = useState(initialForm)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const error = useSelector((state) => state.auth.error)
  const dispatch = useDispatch()

  const onChange = (e) => {
    if (error) dispatch(clearError())
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const onSubmit = (e) => {
    e.preventDefault()
    handleRegister(form)
  }

  return (
    <div className="h-screen overflow-hidden bg-[#0b0b10] flex">

      {/* Editorial panel — hidden below lg to preserve no-scroll on small screens */}
      <div className="hidden lg:flex relative w-[46%] bg-[#131318] border-r border-white/[0.06] items-center justify-center overflow-hidden">

        {/* Ambient gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(134,59,255,0.16),transparent_60%)]" />

        {/* Fine grain texture via layered lines */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <pattern id="grain" width="3" height="3" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.5" fill="white" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grain)" />
        </svg>

        {/* Oversized rotated wordmark, bleeding off the edge */}
        <span
          className="absolute select-none text-[#f3f1f8]/[0.05] font-semibold whitespace-nowrap"
          style={{
            fontSize: '13rem',
            letterSpacing: '-0.04em',
            transform: 'rotate(-90deg)',
            left: '-9.5rem',
          }}
        >
          SNITCH
        </span>

        {/* Garment line-art silhouette */}
        <svg
          className="relative z-10 h-[46%] w-auto text-[#c9a9ff]/70"
          viewBox="0 0 200 320"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinejoin="round"
        >
          <path d="M78 18 L70 40 L58 46 L30 60 L38 130 L58 126 L60 300 L140 300 L142 126 L162 130 L170 60 L142 46 L130 40 L122 18 C122 18 112 30 100 30 C88 30 78 18 78 18 Z" />
          <path d="M78 18 C82 26 90 32 100 32 C110 32 118 26 122 18" />
          <line x1="60" y1="126" x2="140" y2="126" strokeDasharray="2 4" strokeWidth="0.6" />
        </svg>

        {/* Tag / eyebrow content anchored bottom-left */}
        <div className="absolute bottom-10 left-10 z-10">
          <p className="text-[11px] tracking-[0.25em] text-[#8e8a9b] uppercase mb-1.5">
            Season 01 — Founders Access
          </p>
          <p className="text-[#f3f1f8] text-lg font-medium tracking-tight max-w-[280px] leading-snug">
            Buy and sell without the noise.
          </p>
        </div>

        {/* Small logo mark, top-left */}
        <div className="absolute top-10 left-10 z-10">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="21" viewBox="0 0 48 46" fill="none">
            <path
              fill="#863bff"
              d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"
            />
          </svg>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-4">
        <div className="w-full max-w-[380px]">

          {/* Wordmark — only shown on small screens, since the panel covers it on lg */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="19" viewBox="0 0 48 46" fill="none">
              <path
                fill="#863bff"
                d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"
              />
            </svg>
            <span className="text-[#f3f1f8] text-sm font-semibold tracking-tight">Snitch</span>
          </div>

          <div className="text-center mb-5 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold text-[#f3f1f8] tracking-tight">
              Create your account
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[#8e8a9b]">
              A few details and you're in.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-3 sm:space-y-3.5">
            <Field
              label="Full name"
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={onChange}
              placeholder="Jordan Ade"
              autoComplete="name"
              required
            />

            <Field
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              placeholder="jordan@example.com"
              autoComplete="email"
              required
            />

            <Field
              label="Contact number"
              name="contact"
              type="tel"
              value={form.contact}
              onChange={onChange}
              placeholder="+1 555 000 1234"
              autoComplete="tel"
              required
            />

            <Field
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={onChange}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              minLength={6}
              required
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5c586b] hover:text-[#c9c5d4] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              name="isSeller"
              checked={form.isSeller}
              onChange={onChange}
              className="sr-only"
            />

            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-md border border-white/20">
              {form.isSeller && (
                <svg
                  className="h-3 w-3 text-[#863bff]"
                  viewBox="0 0 12 10"
                  fill="none"
                >
                  <path
                    d="M1 5L4.5 8.5L11 1.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>

            <span className="text-sm text-[#c9c5d4]">
              I'm signing up as a seller
            </span>
          </label>

            {error && <p className="text-xs sm:text-sm text-[#ff6b6b]">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#863bff] text-white text-sm font-medium py-3 mt-1 transition-colors hover:bg-[#9a5bff] focus:outline-none focus:ring-2 focus:ring-[#863bff] focus:ring-offset-2 focus:ring-offset-[#0b0b10] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
            <GoogleBtn />
          </form>

          <p className="text-center text-xs sm:text-sm text-[#8e8a9b] mt-4 sm:mt-5">
            Already have an account?{' '}
            <a href="/login" className="text-[#c9a9ff] hover:text-white transition-colors">
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

const Field = ({ label, name, rightElement, ...props }) => (
  <div className="space-y-1.5">
    <label htmlFor={name} className="block text-xs sm:text-sm text-[#8e8a9b]">
      {label}
    </label>
    <div className="relative">
      <input
        id={name}
        name={name}
        className={`w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-[#f3f1f8] placeholder-[#5c586b] text-sm outline-none transition-colors focus:border-[#863bff] focus:bg-white/[0.07] ${
          rightElement ? 'pr-10' : ''
        }`}
        {...props}
      />
      {rightElement}
    </div>
  </div>
)

export default Register