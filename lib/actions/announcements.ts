'use server'

import { supabase } from '@/lib/supabase'

export async function createAnnouncement(apiId: string, title: string, body: string) {
  const { error } = await supabase
    .from('api_announcements')
    .insert({
      api_id: apiId,
      title,
      body,
    })

  if (error) throw new Error(error.message)
}

export async function listAnnouncements(apiId: string) {
  const { data, error } = await supabase
    .from('api_announcements')
    .select('*')
    .eq('api_id', apiId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}
