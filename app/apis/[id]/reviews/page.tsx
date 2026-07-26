import { addReview } from '@/lib/actions/api-reviews'
import { listReviews } from '@/lib/actions/api-reviews'

export const dynamic = 'force-dynamic'

export default async function ReviewsPage({ params }: { params: { id: string } }) {
  const apiId = params.id
  const userId = 'REPLACE_WITH_AUTH_USER_ID'
  const reviews = await listReviews(apiId)

  async function action(formData: FormData) {
    'use server'
    const rating = Number(formData.get('rating'))
    const review = String(formData.get('review'))
    await addReview(userId, apiId, rating, review)
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">API Reviews</h1>

      <form action={action} className="space-y-4">
        <select name="rating" className="border p-2 rounded">
          <option value="5">★★★★★</option>
          <option value="4">★★★★☆</option>
          <option value="3">★★★☆☆</option>
          <option value="2">★★☆☆☆</option>
          <option value="1">★☆☆☆☆</option>
        </select>

        <textarea
          name="review"
          placeholder="Write your review..."
          className="border p-2 rounded w-full h-32"
        />

        <button className="px-4 py-2 bg-black text-white rounded">
          Submit Review
        </button>
      </form>

      <div className="space-y-4">
        {reviews.length === 0 && (
          <p className="text-gray-600">No reviews yet.</p>
        )}
        {reviews.map((r: any) => (
          <div key={r.id} className="border p-4 rounded bg-gray-50">
            <p className="font-bold">
              {r.rating} / 5 — {r.users?.email || 'Anonymous'}
            </p>
            <p className="text-gray-700 whitespace-pre-line">{r.review}</p>
            <p className="text-xs text-gray-500 mt-2">{r.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
