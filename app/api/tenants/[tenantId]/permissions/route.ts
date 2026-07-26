import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const tenantId = params.tenantId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'
  const body = await req.json()
  const { resource_type, resource_id, role_required } = body

  if (!resource_type || !role_required) {
    return NextResponse.json({ error: 'resource_type and role_required are required' }, { status: 400 })
  }

  try {
    // Verify requester has permission
    const { data: requester, error: reqError } = await supabase
      .from('api_tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single()

    if (reqError || !requester || !['owner', 'admin'].includes(requester.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Assign permission
    const { data, error } = await supabase
      .from('api_tenant_permissions')
      .insert({
        tenant_id: tenantId,
        resource_type,
        resource_id: resource_id || null,
        role_required
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ permission: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const tenantId = params.tenantId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  try {
    // Verify user is member
    const { data: member, error: memberError } = await supabase
      .from('api_tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single()

    if (memberError || !member) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get all permissions
    const { data, error } = await supabase
      .from('api_tenant_permissions')
      .select('*')
      .eq('tenant_id', tenantId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ permissions: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
