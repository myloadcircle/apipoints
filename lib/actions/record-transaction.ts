'use server'

import { supabase } from '@/lib/supabase'

export async function recordTransaction(apiId: string, ownerId: string, amount: number) {
  const { error } = await supabase.from('transactions').insert({
    api_id: apiId,
    owner_id: ownerId,
    amount: amount,
  })

  if (error) throw new Error(error.message)
}
