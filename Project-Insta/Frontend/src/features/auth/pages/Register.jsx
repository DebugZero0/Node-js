import React from 'react'
import '../styles/form.scss' 
import { Link, useNavigate } from 'react-router'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const Register = () => {
  const [username, setusername] = useState("")
  const [email, setemail] = useState("")
  const [password, setpassword] = useState("")
  const [bio, setBio] = useState("")
  const [profileImage, setProfileImage] = useState("")
  const {loading, handleRegister} = useAuth()
  const navigate = useNavigate()
  
  if(loading) {
    return <h1>Loading...</h1>
  }

  async function handleSubmit(e){
    e.preventDefault()
    const isRegistered = await handleRegister(username, email, password, bio, profileImage)
      if (isRegistered) {
        navigate('/feed')
      }
  }


  return (
    <main>
      <h1>Register</h1>
      <div className='form-container'>
        <form onSubmit={handleSubmit}>
          <div className='form-group'>
            <input 
            type='text' id='username' placeholder='Enter your username' 
            value={username}
            onChange={(e) => setusername(e.target.value)}
            />
          </div>
          <div className='form-group'>
            <input 
            type='email' id='email' placeholder='Enter your email' 
            value={email}
            onChange={(e) => setemail(e.target.value)}
            />
          </div>
          <div className='form-group'>
            <input 
            type='password' id='password' placeholder='Enter your password' 
            value={password}
            onChange={(e) => setpassword(e.target.value)}
            />
          </div>
          <div className='form-group'>
            <input 
            type='text' id='bio' placeholder='Write a bio (optional)' 
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            />
          </div>
          <div className='form-group'>
            <input 
            type='url' id='profileImage' placeholder='Profile image URL (optional)' 
            value={profileImage}
            onChange={(e) => setProfileImage(e.target.value)}
            />
          </div>
          <button type='submit'>Register</button>
        </form>
        <p>
          Already have an account? <Link className='toggleAuthForm' to='/login'>Login</Link>
        </p>
      </div>
    </main>

  )
}

export default Register
