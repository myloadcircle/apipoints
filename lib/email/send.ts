// Email sending utility using Resend (can be adapted for Postmark, SendGrid, etc.)
import { Resend } from 'resend'
import { supabase } from '@/lib/supabase'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from }: EmailOptions) {
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping email')
    return { success: false, error: 'Email provider not configured' }
  }

  try {
    const result = await resend.emails.send({
      from: from || process.env.EMAIL_FROM || 'noreply@APIPoints.dev',
      to: Array.isArray(to) ? to : [to],
      subject,
      html
    })

    return { success: true, data: result }
  } catch (error: any) {
    console.error('Failed to send email:', error)
    return { success: false, error: error.message }
  }
}

// Helper to get user email from user_id
export async function getUserEmail(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data.email
}
