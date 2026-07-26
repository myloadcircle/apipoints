import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

export interface IdentityProvider {
  id: string
  name: string
  type: string
  config: any
  enabled: boolean
}

export interface UserIdentity {
  id: string
  user_id: string
  provider_id: string
  external_id: string
  last_login?: string
}

export interface AccessKey {
  id: string
  name: string
  key_hash: string
  permissions: string[]
  expires_at?: string
  last_used_at?: string
  revoked: boolean
}

export interface AccessPolicy {
  id: string
  name: string
  resource_type: string
  resource_id?: string
  permissions: any
  priority: number
}

/**
 * Get identity providers
 */
export async function getIdentityProviders() {
  const { data, error } = await supabase
    .from('identity_providers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error('Failed to fetch identity providers')
  return data || []
}

/**
 * Create identity provider
 */
export async function createIdentityProvider(provider: {
  name: string
  type: string
  config?: any
}) {
  const { data, error } = await supabase
    .from('identity_providers')
    .insert({
      name: provider.name,
      type: provider.type,
      config: provider.config || {}
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create provider: ${error.message}`)
  return data
}

/**
 * Get user identities
 */
export async function getUserIdentities(userId: string) {
  const { data, error } = await supabase
    .from('user_identities')
    .select('*, identity_providers(name, type)')
    .eq('user_id', userId)

  if (error) throw new Error('Failed to fetch user identities')
  return data || []
}

/**
 * Link user identity
 */
export async function linkUserIdentity(userId: string, providerId: string, externalId: string, metadata?: any) {
  const { data, error } = await supabase
    .from('user_identities')
    .insert({
      user_id: userId,
      provider_id: providerId,
      external_id: externalId,
      metadata
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to link identity: ${error.message}`)
  return data
}

/**
 * Generate access key
 */
export async function generateAccessKey(
  userId: string,
  name: string,
  permissions = ['read'],
  expiresInDays?: number
) {
  const rawKey = crypto.randomBytes(32).toString('hex')
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null

  const { data, error } = await supabase
    .from('access_keys')
    .insert({
      user_id: userId,
      name,
      key_hash: keyHash,
      permissions,
      expires_at: expiresAt
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to generate key: ${error.message}`)

  return { ...data, raw_key: rawKey } // Return raw key only once
}

/**
 * Get access keys
 */
export async function getAccessKeys(userId: string) {
  const { data, error } = await supabase
    .from('access_keys')
    .select('id, name, permissions, expires_at, last_used_at, revoked, created_at')
    .eq('user_id', userId)
    .eq('revoked', false)
    .order('created_at', { ascending: false })

  if (error) throw new Error('Failed to fetch access keys')
  return data || []
}

/**
 * Revoke access key
 */
export async function revokeAccessKey(keyId: string) {
  const { error } = await supabase
    .from('access_keys')
    .update({ revoked: true })
    .eq('id', keyId)

  if (error) throw new Error(`Failed to revoke key: ${error.message}`)
}

/**
 * Rotate access key
 */
export async function rotateAccessKey(keyId: string, userId: string) {
  const rawKey = crypto.randomBytes(32).toString('hex')
  const newHash = crypto.createHash('sha256').update(rawKey).digest('hex')

  const { data: oldKey } = await supabase
    .from('access_keys')
    .select('key_hash')
    .eq('id', keyId)
    .single()

  const { data, error } = await supabase
    .from('access_keys')
    .update({ key_hash: newHash })
    .eq('id', keyId)
    .select()
    .single()

  if (error) throw new Error(`Failed to rotate key: ${error.message}`)

  await supabase
    .from('key_rotations')
    .insert({
      access_key_id: keyId,
      old_key_hash: oldKey?.key_hash,
      new_key_hash: newHash,
      rotated_by: userId,
      status: 'completed'
    })

  return { ...data, raw_key: rawKey }
}

/**
 * Get access policies
 */
export async function getAccessPolicies(resourceType?: string, resourceId?: string) {
  let query = supabase
    .from('access_policies')
    .select('*')
    .order('priority', { ascending: false })

  if (resourceType) query = query.eq('resource_type', resourceType)
  if (resourceId) query = query.eq('resource_id', resourceId)

  const { data, error } = await query
  if (error) throw new Error('Failed to fetch access policies')
  return data || []
}

/**
 * Create access policy
 */
export async function createAccessPolicy(policy: {
  name: string
  resource_type: string
  resource_id?: string
  permissions: any
  priority?: number
}) {
  const { data, error } = await supabase
    .from('access_policies')
    .insert({
      name: policy.name,
      resource_type: policy.resource_type,
      resource_id: policy.resource_id,
      permissions: policy.permissions,
      priority: policy.priority || 0
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create policy: ${error.message}`)
  return data
}
