import { supabase } from '@/lib/supabase'

export async function applyTemplate(userId: string, apiId: string, templateId: string) {
  const { data: t, error: tErr } = await supabase
    .from('api_request_templates')
    .select('*')
    .eq('id', templateId)
    .eq('user_id', userId)
    .single()

  if (tErr) throw tErr

  const { error: reqErr } = await supabase
    .from('requests')
    .insert({
      user_id: userId,
      api_id: apiId,
      payload: t.payload,
      status: 'template_run'
    })

  if (reqErr) throw reqErr
}