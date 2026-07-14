import React from 'react'

const Notes = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-neutral-950 via-zinc-900 to-cyan-950 text-white flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-center text-[#31b8c6] mt-10">Thanks for registering!</h1>
        <p className="text-center text-sm text-zinc-300 mt-4">Please check your email for a welcome message and verification link.</p>
        <p className="text-center text-sm text-zinc-300 mt-2">Once you verify your email, you can log in and start chatting!</p>
    </div>
  )
}

export default Notes
