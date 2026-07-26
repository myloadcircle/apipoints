import EnterpriseAdminConsole from '@/components/enterprise-admin'

export const dynamic = 'force-dynamic'

export default function EnterprisePage() {
  // In production, get teamId from session
  const teamId = '00000000-0000-0000-0000-000000000000'

  return <EnterpriseAdminConsole teamId={teamId} />
}
