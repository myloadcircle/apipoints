'use server'

import { supabase } from '@/lib/supabase'

export async function listPlans(apiId: string) {
  const { data, error } = await supabase
    .from('api_plans')
    .select('*')
    .eq('api_id', apiId)
    .order('price', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

export async function addPlan(apiId: string, name: string, price: number, monthly_limit?: number) {
  const { error } = await supabase
    .from('api_plans')
    .insert({
      api_id: apiId,
      name,
      price,
      monthly_limit,
    })

  if (error) throw new Error(error.message)
}
