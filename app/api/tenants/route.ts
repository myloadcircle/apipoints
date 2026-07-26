import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const userId = 'REPLACE_WITH_AUTH_USER_ID' // Get from auth in production

  try {
    const { data, error } = await supabase
      .from('api_tenant_members')
      .select('tenant:tenant_id(id, name, created_at)')
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tenants: data?.map(d => d.tenant) || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const userId = 'REPLACE_WITH_AUTH_USER_ID'
  const body = await req.json()
  const { name } = body

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  try {
    // Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('api_tenants')
      .insert({ name })
      .select()
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 })
    }

    // Add user as owner
    const { error: memberError } = await supabase
      .from('api_tenant_members')
      .insert({
        tenant_id: tenant.id,
        user_id: userId,
        role: 'owner'
      })

    if (memberError) {
      return NextResponse.json({ error: 'Failed to add owner' }, { status: 500 })
    }

    return NextResponse.json({ tenant })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
