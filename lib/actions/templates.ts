'use server'

import { supabase } from '@/lib/supabase'

export async function createTemplate(userId: string, apiId: string, name: string, payload: any) {
  const { error } = await supabase
    .from('api_request_templates')
    .insert({
      user_id: userId,
      api_id: apiId,
      name,
      payload,
    })

  if (error) throw new Error(error.message)
}

export async function listTemplates(userId: string, apiId: string) {
  const { data, error } = await supabase
    .from('api_request_templates')
    .select('*')
    .eq('user_id', userId)
    .eq('api_id', apiId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function applyTemplate(userId: string, apiId: string, templateId: string) {
  const { data: tpl, error: tplErr } = await supabase
    .from('api_request_templates')
    .select('*')
    .eq('id', templateId)
    .eq('user_id', userId)
    .single()

  if (tplErr) throw new Error(tplErr.message)

  const { error } = await supabase
    .from('requests')
    .insert({
      user_id: userId,
      api_id: apiId,
      payload: tpl.payload,
      status: 'template_applied',
    })

  if (error) throw new Error(error.message)
}
