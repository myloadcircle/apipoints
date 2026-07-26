'use server'

import { supabase } from '@/lib/supabase'

export async function addReview(userId: string, apiId: string, rating: number, review: string) {
  const { error } = await supabase
    .from('api_reviews')
    .insert({
      user_id: userId,
      api_id: apiId,
      rating,
      review,
    })

  if (error) throw new Error(error.message)
}

export async function listReviews(apiId: string) {
  const { data, error } = await supabase
    .from('api_reviews')
    .select('*, users(email)')
    .eq('api_id', apiId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}
