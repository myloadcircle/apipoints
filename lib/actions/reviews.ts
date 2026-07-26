'use server'

import { supabase } from '@/lib/supabase'

export async function listReviews(apiId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('api_id', apiId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function addReview(apiId: string, rating: number, comment: string, userId: string) {
  const { error } = await supabase
    .from('reviews')
    .insert({
      api_id: apiId,
      rating,
      comment,
      user_id: userId,
    })

  if (error) throw new Error(error.message)
}
