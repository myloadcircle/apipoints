'use server'

import { supabase } from '@/lib/supabase'

export async function addDependency(userId: string, apiId: string, requestId: string, dependsOnId: string) {
  const { error } = await supabase
    .from('api_request_dependencies')
    .insert({
      user_id: userId,
      api_id: apiId,
      request_id: requestId,
      depends_on: dependsOnId,
    })

  if (error) throw new Error(error.message)
}

export async function listDependencies(apiId: string, userId: string) {
  const { data, error } = await supabase
    .from('api_request_dependencies')
    .select('*, parent:depends_on(payload, status), child:request_id(payload, status)')
    .eq('api_id', apiId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function enforceDependencies(requestId: string) {
  const { data: deps, error } = await supabase
    .from('api_request_dependencies')
    .select('*, parent:depends_on(status)')
    .eq('request_id', requestId)

  if (error) throw new Error(error.message)

  for (const d of deps || []) {
    if (d.parent?.status !== 'completed') {
      throw new Error('Dependency not satisfied: parent request not completed')
    }
  }
}
