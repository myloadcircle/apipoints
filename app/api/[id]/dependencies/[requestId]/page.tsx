import { addDependency } from '@/server/add-dependency'
import { listDependencies } from '@/server/list-dependencies'

export default async function DependenciesPage({ params }: any) {
  const apiId = params.id
  const requestId = params.requestId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  const deps = await listDependencies(requestId, userId)

  async function action(formData: FormData) {
    'use server'
    const dependsOnId = String(formData.get('dependsOnId'))
    await addDependency(userId, apiId, requestId, dependsOnId)
  }

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Request Dependencies</h1>

      <form action={action} className='space-y-4'>
        <input
          name='dependsOnId'
          placeholder='Request ID this depends on'
          className='border p-2 rounded w-full'
        />
        <button className='px-4 py-2 bg-black text-white rounded'>
          Add Dependency
        </button>
      </form>

      <div className='space-y-6'>
        <h2 className='text-xl font-semibold'>Dependencies</h2>

        {deps.map((d: any) => (
          <div key={d.id} className='border p-4 rounded bg-gray-50 space-y-2'>
            <p className='font-bold'>Depends on Request {d.depends_on}</p>
            <p className='text-sm text-gray-700'>Parent Status: {d.parent?.status}</p>

            <pre className='text-xs bg-white p-3 rounded border whitespace-pre-wrap'>
{JSON.stringify(d.parent?.payload, null, 2)}
            </pre>

            <p className='text-xs text-gray-500'>{d.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}