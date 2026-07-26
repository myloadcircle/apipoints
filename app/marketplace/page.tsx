import { searchMarketplace, getTeams } from '@/lib/actions/agents'
import MarketplaceSearch from '@/components/marketplace-search'
import MarketplaceResults from '@/components/marketplace-results'
import TeamManager from '@/components/team-manager'
import WorkflowAnalytics from '@/components/workflow-analytics'

export const dynamic = 'force-dynamic'

export default async function MarketplacePage() {
  let results: any[] = []
  try {
    results = await searchMarketplace()
  } catch (error) {
    console.error('Search failed:', error)
  }

  let teams: any[] = []
  try {
    teams = await getTeams('00000000-0000-0000-0000-000000000000')
  } catch (error) {
    console.error('Failed to fetch teams:', error)
  }

  return (
    <div className="p-8 max-w-7xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <p className="text-gray-600 mt-2">Search and rate shared agents</p>
      </div>

      <MarketplaceSearch onResults={(r) => { results = r }} />
      <MarketplaceResults
        results={results}
        onRate={async () => {
          results = await searchMarketplace()
        }}
      />

      <TeamManager
        teams={teams}
        onUpdate={async () => {
          teams = await getTeams('00000000-0000-0000-0000-000000000000')
        }}
      />

      <WorkflowAnalytics />
    </div>
  )
}
