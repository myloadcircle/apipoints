'use server'

import { supabase } from '@/lib/supabase'

export async function listCollections() {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function listCollectionAPIs(collectionId: string) {
  const { data, error } = await supabase
    .from('collection_items')
    .select('api_id')
    .eq('collection_id', collectionId)

  if (error) throw new Error(error.message)
  return data?.map((i: any) => i.api_id) || []
}

export async function addToCollection(collectionId: string, apiId: string) {
  const { error } = await supabase
    .from('collection_items')
    .insert({ collection_id: collectionId, api_id: apiId })

  if (error) throw new Error(error.message)
}
