'use server'

import { supabase } from '@/lib/supabase'

export async function getAPI(id: string) {
  const { data, error } = await supabase
    .from('apis')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}
