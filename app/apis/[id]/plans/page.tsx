import { listPlans } from '@/lib/actions/plans'
import { addPlan } from '@/lib/actions/plans'

export const dynamic = 'force-dynamic'

export default async function PlansPage({ params }: { params: { id: string } }) {
  const apiId = params.id
  const plans = await listPlans(apiId)

  async function action(formData: FormData) {
    'use server'
    const name = String(formData.get('name'))
    const price = Number(formData.get('price'))
    const limit = formData.get('limit') ? Number(formData.get('limit')) : undefined
    await addPlan(apiId, name, price, limit)
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Billing Plans</h1>

      <form action={action} className="space-y-4">
        <input
          name="name"
          placeholder="Plan name (Free, Pro, Enterprise)"
          className="border p-2 rounded w-full"
        />
        <input
          name="price"
          placeholder="Monthly price ($)"
          type="number"
          step="0.01"
          className="border p-2 rounded w-full"
        />
        <input
          name="limit"
          placeholder="Monthly request limit (optional)"
          type="number"
          className="border p-2 rounded w-full"
        />
        <button className="px-4 py-2 bg-black text-white rounded">
          Add Plan
        </button>
      </form>

      <div className="space-y-4">
        {plans.length === 0 && (
          <p className="text-gray-600">No plans yet.</p>
        )}
        {plans.map((p: any) => (
          <div key={p.id} className="border p-4 rounded bg-gray-50">
            <h2 className="font-bold">{p.name}</h2>
            <p className="text-gray-700">${p.price} / month</p>
            {p.monthly_limit && (
              <p className="text-gray-600 text-sm">
                {p.monthly_limit} requests / month
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">{p.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
