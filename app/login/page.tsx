'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) {
      router.push('/dashboard')
    } else {
      alert(error.message)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="bg-[#0D0D0D] border p-8 rounded-xl w-96">
        <h1 className="text-3xl font-bold mb-6">Login</h1>

        <input
          className="w-full p-2 mb-4 rounded bg-black border text-white"
          placeholder="Email"
          type="email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full p-2 mb-4 rounded bg-black border text-white"
          placeholder="Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          className="w-full py-2 rounded bg-[#4A4AFF] hover:bg-[#5A5AFF]"
        >
          Login
        </button>

        <a
          href="/signup"
          className="block text-center mt-4 text-gray-400 hover:text-gray-200"
        >
          Create an account
        </a>
      </div>
    </div>
  )
}
