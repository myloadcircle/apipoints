import { supabase } from '@/lib/supabase'
import { logActivity } from './log-activity'

export type TenantRole = 'owner' | 'admin' | 'developer' | 'auditor' | 'viewer'

export interface TenantMember {
  user_id: string
  role: TenantRole
}

/**
 * Get user's tenants
 */
export async function getUserTenants(userId: string) {
  const { data, error } = await supabase
    .from('api_tenant_members')
    .select('tenant:tenant_id(id, name, created_at)')
    .eq('user_id', userId)

  if (error) throw new Error('Failed to fetch tenants')
  return (data || []).map(d => d.tenant)
}

/**
 * Create a new tenant
 */
export async function createTenant(name: string, userId: string) {
  // Create tenant
  const { data: tenant, error } = await supabase
    .from('api_tenants')
    .insert({ name })
    .select()
    .single()

  if (error || !tenant) throw new Error('Failed to create tenant')

  // Add user as owner
  const { error: memberError } = await supabase
    .from('api_tenant_members')
    .insert({
      tenant_id: tenant.id,
      user_id: userId,
      role: 'owner'
    })

  if (memberError) throw new Error('Failed to add owner')

  await logActivity(userId, '', 'tenant_created', { tenant_id: tenant.id, name })
  return tenant
}

/**
 * Add member to tenant
 */
export async function addTenantMember(
  tenantId: string,
  ownerId: string,
  newUserId: string,
  role: TenantRole
) {
  // Verify owner has permission
  const { data: owner } = await supabase
    .from('api_tenant_members')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', ownerId)
    .single()

  if (!owner || !['owner', 'admin'].includes(owner.role)) {
    throw new Error('Insufficient permissions')
  }

  const { error } = await supabase
    .from('api_tenant_members')
    .insert({
      tenant_id: tenantId,
      user_id: newUserId,
      role
    })

  if (error) throw new Error('Failed to add member')

  await logActivity(ownerId, '', 'tenant_member_added', {
    tenant_id: tenantId,
    new_user_id: newUserId,
    role
  })
}

/**
 * Change member role
 */
export async function changeMemberRole(
  tenantId: string,
  ownerId: string,
  targetUserId: string,
  newRole: TenantRole
) {
  // Verify permissions
  const { data: owner } = await supabase
    .from('api_tenant_members')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', ownerId)
    .single()

  if (!owner || !['owner', 'admin'].includes(owner.role)) {
    throw new Error('Insufficient permissions')
  }

  const { error } = await supabase
    .from('api_tenant_members')
    .update({ role: newRole })
    .eq('tenant_id', tenantId)
    .eq('user_id', targetUserId)

  if (error) throw new Error('Failed to change role')

  await logActivity(ownerId, '', 'tenant_member_role_changed', {
    tenant_id: tenantId,
    target_user_id: targetUserId,
    new_role: newRole
  })
}

/**
 * Assign resource permission
 */
export async function assignPermission(
  tenantId: string,
  userId: string,
  resourceType: string,
  resourceId: string | null,
  roleRequired: string
) {
  // Verify permissions
  const { data: member } = await supabase
    .from('api_tenant_members')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .single()

  if (!member || !['owner', 'admin'].includes(member.role)) {
    throw new Error('Insufficient permissions')
  }

  const { error } = await supabase
    .from('api_tenant_permissions')
    .insert({
      tenant_id: tenantId,
      resource_type: resourceType,
      resource_id: resourceId,
      role_required: roleRequired
    })

  if (error) throw new Error('Failed to assign permission')

  await logActivity(userId, '', 'tenant_permission_assigned', {
    tenant_id: tenantId,
    resource_type: resourceType,
    role_required: roleRequired
  })
}

/**
 * Check if user has access to resource
 */
export async function hasResourceAccess(
  userId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  // Get user's tenants
  const { data: memberships } = await supabase
    .from('api_tenant_members')
    .select('tenant_id, role')
    .eq('user_id', userId)

  if (!memberships || memberships.length === 0) return false

  const tenantIds = memberships.map(m => m.tenant_id)

  // Check permissions
  const { data: permissions } = await supabase
    .from('api_tenant_permissions')
    .select('role_required')
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)
    .in('tenant_id', tenantIds)

  if (!permissions || permissions.length === 0) {
    // No specific permission, check if resource belongs to user's tenant
    return true // Simplified - in production, check tenant_id on resource
  }

  // Check if user's role matches required role
  const userRoles = memberships.map(m => m.role)
  const requiredRoles = permissions.map(p => p.role_required)

  return requiredRoles.some(rr => userRoles.includes(rr))
}
