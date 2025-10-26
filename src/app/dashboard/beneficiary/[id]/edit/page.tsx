/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase'
import { beneficiarySchema } from '@/lib/validations'
import { z } from 'zod'

type BeneficiaryFormData = z.infer<typeof beneficiarySchema>

// A helper to get the keys of the 'type_of_aid' object from the Zod schema
const aidTypeKeys = Object.keys(beneficiarySchema.shape.type_of_aid.unwrap().shape) as (keyof BeneficiaryFormData['type_of_aid'])[];

export default function EditBeneficiaryPage() {
  const router = useRouter()
  const params = useParams()
  const beneficiaryId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BeneficiaryFormData>({
    // zodResolver types are slightly incompatible with the useForm generic here;
    // cast to any to satisfy the resolver signature while keeping form typings.
    resolver: zodResolver(beneficiarySchema) as any,
    defaultValues: {
      // Initialize type_of_aid to prevent uncontrolled component warnings
      type_of_aid: aidTypeKeys.reduce((acc, key) => ({ ...acc, [key]: false }), {}),
    }
  })

  useEffect(() => {
    if (!beneficiaryId) return

    const fetchBeneficiary = async () => {
      try {
        const { data, error } = await supabase
          .from('beneficiaries')
          .select('*')
          .eq('id', beneficiaryId)
          .single()

        if (error) throw error
        if (data) {
          const formData = {
            ...data,
            // Ensure type_of_aid is an object, parsing from JSON if needed
            type_of_aid: typeof data.type_of_aid === 'string' ? JSON.parse(data.type_of_aid) : (data.type_of_aid || {}),
          }
          reset(formData)
        }
      } catch (err: any) {
        setError('Failed to load beneficiary data. ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchBeneficiary()
  }, [beneficiaryId, reset])

  const onSubmit = async (formData: BeneficiaryFormData) => {
    try {
      const { error: updateError } = await supabase
        .from('beneficiaries')
        .update({
          ...formData,
          type_of_aid: formData.type_of_aid, // Store as JSONB
        })
        .eq('id', beneficiaryId)

      if (updateError) throw updateError

      alert('Beneficiary updated successfully!')
      router.push('/dashboard/summary')
    } catch (err: any) {
      setError('Failed to update beneficiary. ' + err.message)
    }
  }

  if (loading) return <div className="text-center py-10">Loading beneficiary details...</div>
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Edit Beneficiary</h1>
  <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input id="name" {...register('name')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="father_name" className="block text-sm font-medium text-gray-700">Father&apos;s Name</label>
            <input id="father_name" {...register('father_name')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age</label>
            <input id="age" type="number" {...register('age', { valueAsNumber: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age.message}</p>}
          </div>
           <div>
            <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input id="phone_number" {...register('phone_number')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            {errors.phone_number && <p className="text-red-500 text-xs mt-1">{errors.phone_number.message}</p>}
          </div>
        </div>

        {/* Aid Type Selection */}
        <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900">Type of Aid</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {aidTypeKeys.map(key => (
          <div key={String(key)} className="flex items-center">
            <Controller
              // Controller expects a Path type for `name`. Build the name string and cast to any to
              // satisfy TypeScript while preserving runtime behavior.
              name={("type_of_aid." + String(key)) as any}
              control={control}
              render={({ field }) => (
                <input 
                  type="checkbox" 
                  onChange={e => field.onChange(e.target.checked)}
                  checked={!!field.value}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                />
              )}
            />
            <label className="ml-2 block text-sm text-gray-900 capitalize">{String(key).replace(/_/g, ' ')}</label>
          </div>
        ))}
            </div>
            {errors.type_of_aid && <p className="text-red-500 text-xs mt-1">{typeof errors.type_of_aid?.message === 'string' ? errors.type_of_aid.message : 'Invalid type of aid selection'}</p>}
        </div>


        <div className="flex justify-end">
          <button type="button" onClick={() => router.back()} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md mr-2">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}