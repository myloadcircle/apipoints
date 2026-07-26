import { getTeams, getTeamUsageAnalytics } from '@/lib/actions/agents'
import TeamBilling from '@/components/team-billing'
import TeamAnalytics from '@/components/team-analytics'

export const dynamic = 'force-dynamic'

export default async function TeamDashboardPage() {
  let teams: any[] = []
  try {
    teams = await getTeams('00000000-0000-0000-0000-000000000000')
  } catch (error) {
    console.error('Failed to fetch teams:', error)
  }

  return (
    <div className="p-8 max-w-7xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Team Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your teams, billing, and analytics</p>
      </div>

      {teams.length === 0 ? (
        <p className="text-gray-400">No teams yet. Create one to get started.</p>
      ) : (
        teams.map((team: any) => (
          <div key={team.id} className="space-y-6">
            <div className="bg-[#0D0D0D] border p-6 rounded-xl text-white">
              <h2 className="text-xl font-semibold">{team.name}</h2>
              <p className="text-gray-400 text-sm">Team ID: {team.id}</p>
            </div>

            <TeamBilling teamId={team.id} />
            <TeamAnalytics teamId={team.id} />
          </div>
        ))
      )}
    </div>
  )
}
