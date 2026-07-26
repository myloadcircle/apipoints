import { z } from 'zod'

export const publishSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  endpoint: z.string().url(),
  price_per_request: z.number().default(0.01)
})
