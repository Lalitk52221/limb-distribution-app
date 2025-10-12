import { z } from 'zod'

export const beneficiarySchema = z.object({
  camp_date: z.string().min(1, 'Camp date is required'),
  name: z.string().min(1, 'Name is required'),
  father_name: z.string().optional(),
  date_of_birth: z.string().optional(),
  age: z.coerce.number().min(0).max(120).optional(),
  address: z.string().optional(),
  state: z.string().optional(),
  phone_number: z.string().optional(),
  aadhar_number: z.string().optional(),
  type_of_aid: z.string().optional(),
  before_photo_url: z.string().optional(),
  after_photo_url: z.string().optional(),
})

export type BeneficiaryFormData = z.infer<typeof beneficiarySchema>