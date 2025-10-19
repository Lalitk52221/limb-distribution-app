/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface RegistrationForm {
  name: string
  father_name?: string
  date_of_birth?: string
  age?: number
  address?: string
  state?: string
  phone_number?: string
  aadhar_number?: string
  type_of_aid: string
}

export default function RegistrationPage() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [currentEvent, setCurrentEvent] = useState<any>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<RegistrationForm>()

  useEffect(() => {
    const eventId = localStorage.getItem('current_event')
    if (!eventId) {
      alert('Please select an event first')
      router.push('/event-setup')
      return
    }
    fetchEvent(eventId)
  }, [router])

  const fetchEvent = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (error) throw error
      setCurrentEvent(data)
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error loading event: ' + error.message)
    }
  }

  const onSubmit = async (data: RegistrationForm) => {
    const eventId = localStorage.getItem('current_event')
    if (!eventId) {
      alert('Please select an event first')
      router.push('/event-setup')
      return
    }

    setUploading(true)
    try {
      // Generate sequential registration number
      const { count, error: countError } = await supabase
        .from('beneficiaries')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId);

      if (countError) throw countError;
      const nextNumber = ((count ?? 0) + 1).toString().padStart(4, '0');
      const regNumber = `REG-${nextNumber}`;

      const { error } = await supabase
        .from('beneficiaries')
        .insert([{
          ...data,
          reg_number: regNumber,
          event_id: eventId,
          camp_date: currentEvent.event_date,
          current_step: 'before_photo',
          completed_steps: ['registration']
        }])
        .select();

      if (error) throw error;

      alert(`Beneficiary registered successfully! Registration Number: ${regNumber}`);
      reset();
    } catch (error: any) {
      console.error('Error:', error);
      alert('Error registering beneficiary: ' + error.message);
    } finally {
      setUploading(false);
    }
  }

  if (!currentEvent) {
    return <div className="text-center py-8 text-black">Loading event details...</div>
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg mr-4">
            1
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Registration Desk</h1>
            <p className="text-gray-600">Step 1: Register new beneficiary details</p>
            <div className="mt-2 p-2 bg-blue-50 rounded">
              <p className="text-sm text-blue-800">
                <strong>Event:</strong> {currentEvent.event_name} | 
                <strong> Date:</strong> {new Date(currentEvent.event_date).toLocaleDateString()} | 
                <strong> Location:</strong> {currentEvent.location}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                {...register('name', { required: 'Name is required' })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                placeholder="Enter full name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Father&apos;s Name
              </label>
              <input
                type="text"
                {...register('father_name')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                placeholder="Enter father's name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                {...register('date_of_birth')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              <input
                type="number"
                {...register('age')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                placeholder="Enter age"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                {...register('phone_number')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aadhar Number
              </label>
              <input
                type="text"
                {...register('aadhar_number')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                placeholder="Enter Aadhar number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                {...register('state')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                placeholder="Enter state"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              {...register('address')}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              placeholder="Enter complete address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type of Aid *
            </label>
            <select
              {...register('type_of_aid', { required: 'Type of aid is required' })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="">Select type of aid</option>
              <option value="Below Knee">Below Knee Artificial Limb</option>
              <option value="Above Knee">Above Knee Artificial Limb</option>
              <option value="Hand">Artificial Hand</option>
              <option value="Arm">Artificial Arm</option>
              <option value="Other">Other Aid</option>
            </select>
            {errors.type_of_aid && <p className="text-red-500 text-sm mt-1">{errors.type_of_aid.message}</p>}
          </div>

          <div className="flex justify-end gap-3 w-full">
            <button
              type="submit"
              disabled={uploading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium w-full"
            >
              {uploading ? 'Registering...' : 'Register'}
            </button>
            <button className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium w-1/3 ">
              <Link href="/dashboard/before-photo">Next Step</Link>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}