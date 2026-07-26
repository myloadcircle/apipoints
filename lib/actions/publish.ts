'use server'

import { supabase } from '@/lib/supabase'
import { publishSchema } from '@/lib/validation'

export async function publishAPI(formData: FormData) {
  const parsed = publishSchema.parse({
    name: formData.get('name'),
    description: formData.get('description'),
    endpoint: formData.get('endpoint'),
    price_per_request: parseFloat(formData.get('price_per_request') as string) || 0.01,
  })

  const { data, error } = await supabase
    .from('apis')
    .insert(parsed)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
