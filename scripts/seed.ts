import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const apis = [
  {
    name: 'Text Summarizer',
    description: 'Summarizes long text using AI',
    endpoint: 'https://api.example.com/summarize',
    price_per_request: 0.05,
  },
  {
    name: 'Image Classifier',
    description: 'Classifies images into categories',
    endpoint: 'https://api.example.com/classify',
    price_per_request: 0.10,
  },
  {
    name: 'Code Generator',
    description: 'Generates code from natural language',
    endpoint: 'https://api.example.com/codegen',
    price_per_request: 0.15,
  },
]

async function seed() {
  const { data, error } = await supabase.from('apis').insert(apis).select()
  if (error) throw error
  console.log('Seeded', data.length, 'APIs')
}

seed()
