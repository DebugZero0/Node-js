import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {useSelector} from 'react-redux'
import { Navigate } from 'react-router-dom'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const {handleLogin} =useAuth();

  // This is done to prevent loggen in user from accessing the login page again, if user is already logged in then it will redirect to home page
  const user= useSelector((state)=> state.auth.user)
  const loading= useSelector((state)=> state.auth.loading)
  if(!loading && user){
    return <Navigate to="/" replace />
  }

  const handleSubmitForm = async (event) => {
    event.preventDefault()

    const payload = {
      email,
      password,
    }

    try {
      await handleLogin(payload)
      navigate('/')
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-neutral-950 via-zinc-900 to-cyan-950 text-white">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-5 py-10">
        <div className="w-full rounded-2xl border border-[#31b8c6]/40 bg-zinc-900/80 p-7 shadow-[0_0_45px_-12px_rgba(49,184,198,0.65)] backdrop-blur-md">
          <h1 className="text-center text-3xl font-bold tracking-tight text-[#31b8c6]">Login</h1>
          <p className="mt-2 text-center text-sm text-zinc-300">Welcome back. Continue your chats.</p>

          {/* simplified text link for navigation placed below the form button */}

          <form className="mt-7 space-y-5" onSubmit={handleSubmitForm}>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-200" htmlFor="login-email">
                Email
              </label>
              <input
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-[#31b8c6] focus:ring-2 focus:ring-[#31b8c6]/40"
                id="login-email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-200" htmlFor="login-password">
                Password
              </label>
              <input
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-[#31b8c6] focus:ring-2 focus:ring-[#31b8c6]/40"
                id="login-password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                type="password"
                value={password}
              />
            </div>

            <button
              className="w-full rounded-lg bg-linear-to-r from-[#31b8c6] via-cyan-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:from-cyan-400 hover:via-cyan-300 hover:to-cyan-200 focus:outline-none focus:ring-2 focus:ring-[#31b8c6] focus:ring-offset-2 focus:ring-offset-zinc-900"
              type="submit"
            >
              Sign In
            </button>
            <p className="mt-3 text-center text-sm text-zinc-300">
              Don’t have an account?{' '}
              <Link className="text-[#31b8c6] font-semibold hover:underline" to="/register">Register</Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  )
}

export default Login
