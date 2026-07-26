import { supabase } from '@/lib/supabase'

export async function addDependency(userId: string, apiId: string, requestId: string, dependsOnId: string) {
  const { error } = await supabase
    .from('api_request_dependencies')
    .insert({
      user_id: userId,
      api_id: apiId,
      request_id: requestId,
      depends_on: dependsOnId
    })

  if (error) throw error
}