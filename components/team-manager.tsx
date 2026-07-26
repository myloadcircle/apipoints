'use client'

import { useState } from 'react'
import { createTeam } from '@/lib/actions/agents'

export default function TeamManager({ teams: initialTeams, onUpdate }: { teams: any[], onUpdate: () => void }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!name) {
      alert('Please enter a team name')
      return
    }

    setLoading(true)
    try {
      await createTeam(name, '00000000-0000-0000-0000-000000000000')
      alert('Team created!')
      setName('')
      onUpdate()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#0D0D0D] border p-6 rounded-xl text-white space-y-4">
      <h2 className="text-2xl font-semibold">Team Accounts</h2>

      <input
        className="w-full p-2 rounded bg-black border text-white"
        placeholder="Team Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button
        onClick={handleCreate}
        disabled={loading}
        className="w-full py-2 rounded bg-[#4A4AFF] hover:bg-[#5A5AFF] disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Team'}
      </button>

      <div className="mt-4">
        <h3 className="text-xl font-semibold mb-2">Your Teams ({initialTeams.length})</h3>
        {initialTeams.length === 0 ? (
          <p className="text-gray-400">No teams yet.</p>
        ) : (
          <ul className="space-y-2">
            {initialTeams.map((t) => (
              <li key={t.id} className="border-b border-gray-700 pb-2">
                <p className="font-bold">{t.name}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
