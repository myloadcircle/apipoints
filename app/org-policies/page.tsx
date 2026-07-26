import OrgPolicyAdmin from '@/components/org-policy-admin'

export const dynamic = 'force-dynamic'

export default function OrgPoliciesPage() {
  // In production, get teamId from session
  const teamId = '00000000-0000-0000-0000-000000000000'

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Organization Policies</h1>
        <p className="text-gray-600 mt-2">Configure org-wide security and execution policies</p>
      </div>

      <OrgPolicyAdmin teamId={teamId} />
    </div>
  )
}
