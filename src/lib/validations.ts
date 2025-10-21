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
  type_of_aid: z.object({
    left_below_knee: z.boolean().optional(),
    left_above_knee: z.boolean().optional(),
    right_below_knee: z.boolean().optional(),
    right_above_knee: z.boolean().optional(),
    left_caliper: z.boolean().optional(),
    right_caliper: z.boolean().optional(),
    stick: z.boolean().optional(),
    stick_qty: z.number().optional(),
    crutches: z.boolean().optional(),
    crutches_qty: z.number().optional(),
    shoes: z.boolean().optional(),
    above_hand: z.boolean().optional(),
    below_hand: z.boolean().optional(),
    gloves: z.boolean().optional(),
    walker: z.boolean().optional(),
    elbow_crutches: z.boolean().optional(),
    elbow_crutches_qty: z.number().optional(),
    others: z.boolean().optional(),
    others_specify: z.string().optional(),
  }).optional().refine(data => {
    // If no type_of_aid object provided, allow (field is optional)
    if (!data) return true;
    // Ensure at least one boolean flag is true
    return Object.values(data).some(value => value === true);
  }, {
    message: "At least one type of aid must be selected.",
    path: ["left_below_knee"], // Assign error to a specific field within the object
  }),
  other_aid_specify: z.string().optional(),
})
