'use client'

import { useState, useEffect } from 'react'
import { getOrgPolicies, updateOrgPolicies } from '@/lib/actions/agents'
import { useRouter } from 'next/navigation'

export default function OrgPolicyAdmin({ teamId }: { teamId: string }) {
  const [policy, setPolicy] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchPolicy() {
      try {
        const data = await getOrgPolicies(teamId)
        setPolicy(data)
      } catch (error: any) {
        console.error('Failed to fetch policy:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPolicy()
  }, [teamId])

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)

    try {
      await updateOrgPolicies(teamId, {
        allow_external_api: formData.get('allow_external_api') === 'true',
        allow_code_execution: formData.get('allow_code_execution') === 'true',
        max_agent_runtime_ms: Number(formData.get('max_agent_runtime_ms')),
        max_parallel_agents: Number(formData.get('max_parallel_agents'))
      })
      alert('Policies updated!')
      router.refresh()
    } catch (error: any) {
      alert(error.message)
    }
  }

  if (loading) {
    return <p className="text-white p-10">Loading policies...</p>
  }

  return (
    <div className="bg-[#0D0D0D] border p-6 rounded-xl text-white space-y-6">
      <h2 className="text-2xl font-semibold">Org-Wide Policies</h2>

      <form onSubmit={handleUpdate} className="space-y-4">
        <label className="block">
          <span className="text-gray-300">External API Access</span>
          <select
            name="allow_external_api"
            defaultValue={policy?.allow_external_api ? 'true' : 'false'}
            className="w-full p-2 rounded bg-black border text-white mt-1"
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </label>

        <label className="block">
          <span className="text-gray-300">Code Execution</span>
          <select
            name="allow_code_execution"
            defaultValue={policy?.allow_code_execution ? 'true' : 'false'}
            className="w-full p-2 rounded bg-black border text-white mt-1"
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </label>

        <label className="block">
          <span className="text-gray-300">Max Agent Runtime (ms)</span>
          <input
            name="max_agent_runtime_ms"
            type="number"
            defaultValue={policy?.max_agent_runtime_ms || 20000}
            className="w-full p-2 rounded bg-black border text-white mt-1"
          />
        </label>

        <label className="block">
          <span className="text-gray-300">Max Parallel Agents</span>
          <input
            name="max_parallel_agents"
            type="number"
            defaultValue={policy?.max_parallel_agents || 5}
            className="w-full p-2 rounded bg-black border text-white mt-1"
          />
        </label>

        <button
          type="submit"
          className="w-full py-2 rounded bg-[#4A4AFF] hover:bg-[#5A5AFF]"
        >
          Save Policies
        </button>
      </form>
    </div>
  )
}
