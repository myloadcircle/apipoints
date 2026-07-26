import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const userId = 'REPLACE_WITH_AUTH_USER_ID' // Get from auth in production
  const webhookId = req.nextUrl.searchParams.get('webhookId')

  try {
    if (webhookId) {
      // Get health for specific webhook
      const { data, error } = await supabase
        .from('api_request_webhook_health')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ health: data })
    } else {
      // Get all webhooks with health status for user
      const { data: webhooks, error: whError } = await supabase
        .from('api_request_webhooks')
        .select(`
          *,
          health:api_request_webhook_health(
            last_check_at,
            last_status_code,
            last_success,
            consecutive_failures,
            response_time_ms
          )
        `)
        .eq('user_id', userId)

      if (whError) {
        return NextResponse.json({ error: whError.message }, { status: 500 })
      }

      // Get latest health check for each webhook
      const webhooksWithHealth = (webhooks || []).map(wh => {
        const latestHealth = wh.health?.sort((a: any, b: any) => 
          new Date(b.last_check_at).getTime() - new Date(a.last_check_at).getTime()
        )[0]

        return {
          id: wh.id,
          url: wh.url,
          event: wh.event,
          health: latestHealth || null,
          status: latestHealth?.last_success 
            ? 'healthy' 
            : latestHealth?.consecutive_failures >= 3 
              ? 'unhealthy' 
              : 'warning'
        }
      })

      return NextResponse.json({ webhooks: webhooksWithHealth })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const userId = 'REPLACE_WITH_AUTH_USER_ID' // Get from auth in production
  const body = await req.json()
  const { webhookId } = body

  try {
    if (webhookId) {
      // Run health check for specific webhook
      const { runHealthCheck } = await import('@/server/webhook-health')
      const result = await runHealthCheck(webhookId)
      return NextResponse.json(result)
    } else {
      // Run health checks for all user's webhooks
      const { runAllHealthChecks } = await import('@/server/webhook-health')
      const results = await runAllHealthChecks(userId)
      return NextResponse.json({ results })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
