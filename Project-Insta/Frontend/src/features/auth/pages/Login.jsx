import React from 'react'
import '../styles/form.scss'
import { Link, useNavigate } from 'react-router'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'


const Login = () => {
  const [username, setusername] = useState("")
  const [password, setpassword] = useState("")
  const { handleLogin, loading } = useAuth()
  const navigate = useNavigate()

  if(loading){
    return (
      <h1>Loading...</h1>
    )
  }
  async function handleSubmit(e){
    e.preventDefault()
    const isLoggedIn = await handleLogin(username, password)
    if (isLoggedIn) {
      navigate('/feed') // Redirect to feed after successful login
    }

  }

  return (
    <main>
      <h1>Login</h1>
      <div className='form-container'>
        <form onSubmit={handleSubmit}>
          <div className='form-group'>
            <input type='text' id='username' placeholder='Enter your username' value={username} onChange={(e) => setusername(e.target.value)} />
          </div>
          <div className='form-group'>
            <input type='password' id='password' placeholder='Enter your password' value={password} onChange={(e) => setpassword(e.target.value)} />
          </div>
          <button type='submit'>Login</button>
        </form>
        <p>
          Don't have an account? <Link className='toggleAuthForm' to='/register'>Register</Link>
        </p>
      </div>

    </main>
  )
}

export default Login
