import { supabase } from '@/lib/supabase'

export interface ReportTemplate {
  id: string
  name: string
  description: string
  entity_type: string
  template_schema: any
  version: string
  active: boolean
}

export interface GeneratedReport {
  id: string
  template_id: string
  entity_type: string
  entity_id: string
  report_data: any
  file_url?: string
  format: string
  status: string
  created_at: string
  completed_at?: string
}

/**
 * List report templates
 */
export async function listReportTemplates(entityType?: string) {
  let query = supabase
    .from('api_report_templates')
    .select('*')
    .eq('active', true)
    .order('name')

  if (entityType) {
    query = query.eq('entity_type', entityType)
  }

  const { data, error } = await query
  if (error) throw new Error('Failed to fetch templates')
  return data || []
}

/**
 * Get template by ID
 */
export async function getTemplate(id: string) {
  const { data, error } = await supabase
    .from('api_report_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) throw new Error('Template not found')
  return data
}

/**
 * Generate report from template + data
 */
export async function generateReport(
  templateId: string,
  entityType: string,
  entityId: string,
  userId: string,
  tenantId: string | null,
  reportData: any,
  format = 'json'
) {
  const { data, error } = await supabase
    .from('api_generated_reports')
    .insert({
      template_id: templateId,
      entity_type: entityType,
      entity_id: entityId,
      user_id: userId,
      tenant_id: tenantId,
      report_data: reportData,
      format,
      status: 'completed' // Simplified - in production would be async
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to generate report: ${error.message}`)
  return data
}

/**
 * Get user's reports
 */
export async function getUserReports(userId: string, status?: string) {
  let query = supabase
    .from('api_generated_reports')
    .select('*, template:template_id(name, entity_type)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw new Error('Failed to fetch reports')
  return data || []
}

/**
 * Render report as HTML (simplified)
 */
export function renderReportHtml(template: any, data: any): string {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${template.name} Report</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #1a1a1a; }
    .section { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 8px; }
    .label { font-size: 12px; color: #666; text-transform: uppercase; }
    .value { font-size: 18px; font-weight: bold; margin-top: 4px; }
    .score { font-size: 32px; font-weight: bold; color: #2563eb; }
  </style>
</head>
<body>
  <h1>${template.name} Report</h1>
  <p>Entity: ${data.entity_id || 'N/A'}</p>
  
  <div class="section">
    <div class="label">Overview</div>
    <div class="value">${data.summary || 'No summary available'}</div>
  </div>

  ${data.sections ? data.sections.map((s: any) => `
    <div class="section">
      <div class="label">${s.title}</div>
      <div class="value">${s.value || s.message || ''}</div>
    </div>
  `).join('') : ''}

  ${data.score !== undefined ? `
    <div class="section">
      <div class="label">Score</div>
      <div class="score">${data.score}/100</div>
    </div>
  ` : ''}

  <hr style="margin: 40px 0;" />
  <p style="font-size: 12px; color: #999;">Generated on ${new Date().toLocaleString()}</p>
</body>
</html>
  `
  return html
}
