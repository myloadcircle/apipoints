import { supabase } from '@/lib/supabase'

export interface TransformConfig {
  enabled: boolean
  transform_type: 'mapping' | 'template' | 'script'
  mapping_rules?: Record<string, string>
  template_body?: string
  script_body?: string
}

/**
 * Apply transformation to payload
 */
export async function applyTransform(
  webhookId: string,
  payload: any
): Promise<any> {
  // Get transform config
  const { data: transform, error } = await supabase
    .from('api_request_webhook_transforms')
    .select('*')
    .eq('webhook_id', webhookId)
    .single()

  if (error || !transform || !transform.enabled) {
    // No transform or disabled, return original payload
    return payload
  }

  try {
    switch (transform.transform_type) {
      case 'mapping':
        return applyMapping(payload, transform.mapping_rules || {})
      
      case 'template':
        return applyTemplate(payload, transform.template_body)
      
      case 'script':
        return applyScript(payload, transform.script_body)
      
      default:
        return payload
    }
  } catch (error) {
    console.error('Transform failed:', error)
    throw new Error('Payload transformation failed')
  }
}

/**
 * Apply key mapping transformation
 */
function applyMapping(payload: any, mapping: Record<string, string>): any {
  const result: any = {}
  
  for (const [oldKey, newKey] of Object.entries(mapping)) {
    const value = getNestedValue(payload, oldKey)
    setNestedValue(result, newKey, value)
  }
  
  // Keep fields not in mapping
  for (const key of Object.keys(payload)) {
    if (!Object.keys(mapping).includes(key)) {
      result[key] = payload[key]
    }
  }
  
  return result
}

/**
 * Apply template transformation (simple JSON template)
 */
function applyTemplate(payload: any, templateStr: string | null): any {
  if (!templateStr) return payload
  
  // Simple template replacement: {{key}} or {{nested.key}}
  let result = templateStr
  
  // Replace {{payload}} with full payload
  result = result.replace(/\{\{payload\}\}/g, JSON.stringify(payload))
  
  // Replace {{key}} with values
  for (const [key, value] of Object.entries(payload)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    result = result.replace(regex, typeof value === 'object' ? JSON.stringify(value) : String(value))
  }
  
  // Try to parse back to JSON
  try {
    return JSON.parse(result)
  } catch {
    return result
  }
}

/**
 * Apply script transformation (sandboxed)
 */
function applyScript(payload: any, scriptStr: string | null): any {
  if (!scriptStr) return payload
  
  // Create sandboxed environment
  const sandbox = {
    input: { payload } as any,
    output: null as any,
    console: { log: (...args: any[]) => console.log('[Transform]', ...args) }
  }
  
  // Execute with timeout (50ms)
  const script = `
    const input = sandbox.input;
    const output = (function() {
      ${scriptStr}
    })();
    sandbox.output = output;
  `
  
  try {
    const fn = new Function('sandbox', script)
    const start = Date.now()
    
    fn(sandbox)
    
    if (Date.now() - start > 50) {
      throw new Error('Script execution timeout (50ms)')
    }
    
    return sandbox.output || payload
  } catch (error: any) {
    throw new Error(`Script error: ${error.message}`)
  }
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * Set nested value in object using dot notation
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.')
  const lastKey = keys.pop()!
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {}
    return current[key]
  }, obj)
  target[lastKey] = value
}
