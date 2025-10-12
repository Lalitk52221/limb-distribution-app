// 'use client'
// import { useState } from 'react'
// import { useForm } from 'react-hook-form'
// // import { createClient } from '@/lib/supabase'
// import { supabase } from '@/lib/supabase'

// interface RegistrationForm {
//   camp_date: string
//   name: string
//   father_name?: string
//   date_of_birth?: string
//   age?: number
//   address?: string
//   state?: string
//   phone_number?: string
//   aadhar_number?: string
//   type_of_aid: string
//   volunteer_name: string
// }

// export default function RegistrationPage() {
//   const [uploading, setUploading] = useState(false)
//   const [volunteerName, setVolunteerName] = useState('')

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//     reset
//   } = useForm<RegistrationForm>()

//   const onSubmit = async (data: RegistrationForm) => {
//     if (!volunteerName.trim()) {
//       alert('Please enter your volunteer name')
//       return
//     }

//     setUploading(true)
//     try {
//       // const supabase = createClient()
      
//       // Generate registration number
//       const regNumber = `REG-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`

//       const {data: result, error } = await supabase
//         .from('beneficiaries')
//         .insert([{
//           ...data,
//           reg_number: regNumber,
//           current_step: 'before_photo',
//           completed_steps: ['registration'],
//           step_volunteers: { registration: volunteerName },
//           volunteer_name: volunteerName
//         }])

//       if (error) throw error

//       alert(`Beneficiary registered successfully! Registration Number: ${regNumber}`)
//       reset()
      
//     } catch (error) {
//       console.error('Error:', error)
//       alert('Error registering beneficiary. Please try again.')
//     } finally {
//       setUploading(false)
//     }
//   }

'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase'

interface RegistrationForm {
  camp_date: string
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
  const [uploading, setUploading] = useState(false)
  const [volunteerName, setVolunteerName] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<RegistrationForm>()

  const onSubmit = async (data: RegistrationForm) => {
    if (!volunteerName.trim()) {
      alert('Please enter your volunteer name')
      return
    }

    setUploading(true)
    try {
      // Generate registration number
      const regNumber = `REG-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`

      const { data: result, error } = await supabase
        .from('beneficiaries')
        .insert([{
          ...data,
          reg_number: regNumber,
          current_step: 'before_photo',
          completed_steps: ['registration'],
          step_volunteers: { registration: volunteerName }
        }])
        .select()

      if (error) throw error

      alert(`Beneficiary registered successfully! Registration Number: ${regNumber}`)
      reset()
      
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error registering beneficiary: ' + error.message)
    } finally {
      setUploading(false)
    }
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
          </div>
        </div>

        {/* Volunteer Name */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Volunteer Name *
          </label>
          <input
            type="text"
            value={volunteerName}
            onChange={(e) => setVolunteerName(e.target.value)}
            placeholder="Enter your name as volunteer"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Camp Date *
              </label>
              <input
                type="date"
                {...register('camp_date', { required: 'Camp date is required' })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.camp_date && <p className="text-red-500 text-sm mt-1">{errors.camp_date.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                {...register('name', { required: 'Name is required' })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              <input
                type="number"
                {...register('age')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter complete address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type of Aid *
            </label>
            <select
              {...register('type_of_aid', { required: 'Type of aid is required' })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {uploading ? 'Registering...' : 'Register & Move to Step 2'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}