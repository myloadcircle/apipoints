'use server'

import { supabase } from '@/lib/supabase'

export async function askQuestion(userId: string, apiId: string, question: string) {
  const { error } = await supabase
    .from('api_questions')
    .insert({
      user_id: userId,
      api_id: apiId,
      question,
    })

  if (error) throw new Error(error.message)
}

export async function answerQuestion(questionId: string, answer: string) {
  const { error } = await supabase
    .from('api_questions')
    .update({ answer })
    .eq('id', questionId)

  if (error) throw new Error(error.message)
}

export async function listQuestions(apiId: string) {
  const { data, error } = await supabase
    .from('api_questions')
    .select('*, users(email)')
    .eq('api_id', apiId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}
