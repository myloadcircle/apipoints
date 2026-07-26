import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query, role, minRating, userId } = body

    let supabaseQuery = supabase
      .from('shared_agents')
      .select(`
        *,
        agent_ratings(rating)
      `)
      .order('downloads', { ascending: false })

    if (query) {
      supabaseQuery = supabaseQuery.ilike('name', `%${query}%`)
    }

    if (role) {
      supabaseQuery = supabaseQuery.eq('role', role)
    }

    const { data, error } = await supabaseQuery

    if (error) throw new Error('Search failed')

    // Calculate average ratings
    let results = (data || []).map((agent: any) => {
      const ratings = agent.agent_ratings || []
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
        : 0
      return {
        ...agent,
        avg_rating: avgRating,
        rating_count: ratings.length
      }
    })

    // Filter by min rating
    if (minRating && minRating > 0) {
      results = results.filter(r => r.avg_rating >= minRating)
    }

    return NextResponse.json({ results })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
