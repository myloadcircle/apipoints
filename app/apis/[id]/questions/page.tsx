import { askQuestion } from '@/lib/actions/questions'
import { listQuestions } from '@/lib/actions/questions'

export const dynamic = 'force-dynamic'

export default async function QuestionsPage({ params }: { params: { id: string } }) {
  const apiId = params.id
  const userId = 'REPLACE_WITH_AUTH_USER_ID'
  const questions = await listQuestions(apiId)

  async function action(formData: FormData) {
    'use server'
    const q = String(formData.get('question'))
    await askQuestion(userId, apiId, q)
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Questions & Answers</h1>

      <form action={action} className="space-y-4">
        <textarea
          name="question"
          placeholder="Ask a question about this API..."
          className="border p-2 rounded w-full h-32"
        />
        <button className="px-4 py-2 bg-black text-white rounded">
          Submit Question
        </button>
      </form>

      <div className="space-y-4">
        {questions.length === 0 && (
          <p className="text-gray-600">No questions yet.</p>
        )}
        {questions.map((q: any) => (
          <div key={q.id} className="border p-4 rounded bg-gray-50">
            <p className="font-bold">{q.users?.email || 'Anonymous'} asked:</p>
            <p className="text-gray-800 whitespace-pre-line">{q.question}</p>

            {q.answer ? (
              <div className="mt-3 p-3 bg-white border rounded">
                <p className="font-semibold">Answer:</p>
                <p className="text-gray-700 whitespace-pre-line">{q.answer}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-2">Awaiting answer...</p>
            )}

            <p className="text-xs text-gray-500 mt-2">{q.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
