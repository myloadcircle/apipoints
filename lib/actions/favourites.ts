'use server'

import { supabase } from '@/lib/supabase'

export async function toggleFavourite(apiId: string, userId: string) {
  const { data } = await supabase
    .from('favourites')
    .select('*')
    .eq('api_id', apiId)
    .eq('user_id', userId)
    .single()

  if (data) {
    await supabase
      .from('favourites')
      .delete()
      .eq('api_id', apiId)
      .eq('user_id', userId)
  } else {
    await supabase
      .from('favourites')
      .insert({ api_id: apiId, user_id: userId })
  }
}

export async function listFavourites(userId: string) {
  const { data, error } = await supabase
    .from('favourites')
    .select('api_id')
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  return data?.map((f: any) => f.api_id) || []
}
