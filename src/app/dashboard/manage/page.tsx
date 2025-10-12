'use client'
import { useEffect, useState } from 'react'
// import { createClient } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import type { Beneficiary } from '@/types'

export default function ManagePage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchBeneficiaries()
  }, [])

  const fetchBeneficiaries = async () => {
    try {
      // const supabase = createClient()
      const { data, error } = await supabase
        .from('beneficiaries')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBeneficiaries(data || [])
    } catch (error) {
      console.error('Error fetching beneficiaries:', error)
      alert('Error loading data')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: Beneficiary['status']) => {
    setUpdating(id)
    try {
      // const supabase = createClient()
      const { error } = await supabase
        .from('beneficiaries')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      
      // Update local state
      setBeneficiaries(prev => 
        prev.map(b => b.id === id ? { ...b, status } : b)
      )
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error updating status')
    } finally {
      setUpdating(null)
    }
  }

  const handleAfterPhotoUpload = async (id: string, file: File) => {
    setUpdating(id)
    try {
      // const supabase = createClient()
      
      // Upload photo
      const fileExt = file.name.split('.').pop()
      const fileName = `after-${id}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName)

      // Update beneficiary record
      const { error: updateError } = await supabase
        .from('beneficiaries')
        .update({ 
          after_photo_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (updateError) throw updateError

      // Update local state
      setBeneficiaries(prev =>
        prev.map(b => b.id === id ? { ...b, after_photo_url: publicUrl } : b)
      )

      alert('After photo uploaded successfully!')
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Error uploading photo')
    } finally {
      setUpdating(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registered': return 'bg-blue-100 text-blue-800'
      case 'measuring': return 'bg-yellow-100 text-yellow-800'
      case 'preparing': return 'bg-orange-100 text-orange-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredBeneficiaries = beneficiaries.filter(b => 
    filter === 'all' || b.status === filter
  )

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Camp Management</h1>
        <p className="text-gray-600 mb-6">Track and update beneficiary progress</p>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'registered', 'measuring', 'preparing', 'completed'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg capitalize font-medium transition-colors ${
                filter === status 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status === 'all' ? 'All' : status} 
              {status !== 'all' && (
                <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded-full text-sm">
                  {beneficiaries.filter(b => b.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Beneficiaries Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reg No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Before Photo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  After Photo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBeneficiaries.map((beneficiary) => (
                <tr key={beneficiary.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {beneficiary.reg_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {beneficiary.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(beneficiary.status)}`}>
                      {beneficiary.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {beneficiary.before_photo_url ? (
                      <img 
                        src={beneficiary.before_photo_url} 
                        alt="Before" 
                        className="w-16 h-16 object-cover rounded-lg border"
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">No photo</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {beneficiary.after_photo_url ? (
                      <img 
                        src={beneficiary.after_photo_url} 
                        alt="After" 
                        className="w-16 h-16 object-cover rounded-lg border"
                      />
                    ) : (
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleAfterPhotoUpload(beneficiary.id, file)
                            }
                          }}
                          disabled={updating === beneficiary.id}
                          className="text-sm text-gray-600"
                        />
                        {updating === beneficiary.id && (
                          <span className="text-xs text-gray-500">Uploading...</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <select
                      value={beneficiary.status}
                      onChange={(e) => updateStatus(beneficiary.id, e.target.value as Beneficiary['status'])}
                      disabled={updating === beneficiary.id}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="registered">Registered</option>
                      <option value="measuring">Measuring</option>
                      <option value="preparing">Preparing Limb</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredBeneficiaries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No beneficiaries found for the selected filter.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
// 'use client'
// import { useState, useEffect } from 'react'
// import { supabase } from '@/lib/supabase'

// interface Beneficiary {
//   id: string
//   reg_number: string
//   name: string
//   status: string
//   before_photo_url?: string
//   after_photo_url?: string
//   current_step: string
// }

// export default function ManagePage() {
//   const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     fetchBeneficiaries()
    
//     // Set up real-time subscription
//     const subscription = supabase
//       .channel('beneficiaries')
//       .on('postgres_changes', 
//         { event: '*', schema: 'public', table: 'beneficiaries' }, 
//         () => {
//           fetchBeneficiaries()
//         }
//       )
//       .subscribe()

//     return () => {
//       subscription.unsubscribe()
//     }
//   }, [])

//   const fetchBeneficiaries = async () => {
//     try {
//       const { data, error } = await supabase
//         .from('beneficiaries')
//         .select('*')
//         .order('created_at', { ascending: false })

//       if (error) throw error
//       setBeneficiaries(data || [])
//     } catch (error: any) {
//       console.error('Error:', error)
//       alert('Error loading data: ' + error.message)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const updateStatus = async (id: string, current_step: string) => {
//     try {
//       const { error } = await supabase
//         .from('beneficiaries')
//         .update({ current_step })
//         .eq('id', id)

//       if (error) throw error
      
//       // Real-time update will refresh the list automatically
//     } catch (error: any) {
//       console.error('Error:', error)
//       alert('Error updating status: ' + error.message)
//     }
//   }

//   if (loading) {
//     return (
//       <div className="max-w-6xl mx-auto py-8 px-4">
//         <div className="text-center">Loading...</div>
//       </div>
//     )
//   }

//   return (
//     <div className="max-w-6xl mx-auto py-8 px-4">
//       <div className="bg-white rounded-lg shadow-md p-6">
//         <h1 className="text-3xl font-bold text-gray-900 mb-2">Camp Management</h1>
//         <p className="text-gray-600 mb-6">Real-time view of all beneficiaries</p>

//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reg No.</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Step</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Before Photo</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">After Photo</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Update Step</th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {beneficiaries.map((beneficiary) => (
//                 <tr key={beneficiary.id} className="hover:bg-gray-50">
//                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                     {beneficiary.reg_number}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                     {beneficiary.name}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
//                       {beneficiary.current_step}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     {beneficiary.before_photo_url ? (
//                       <img 
//                         src={beneficiary.before_photo_url} 
//                         alt="Before" 
//                         className="w-16 h-16 object-cover rounded-lg border"
//                       />
//                     ) : (
//                       <span className="text-gray-400 text-sm">No photo</span>
//                     )}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     {beneficiary.after_photo_url ? (
//                       <img 
//                         src={beneficiary.after_photo_url} 
//                         alt="After" 
//                         className="w-16 h-16 object-cover rounded-lg border"
//                       />
//                     ) : (
//                       <span className="text-gray-400 text-sm">No photo</span>
//                     )}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm">
//                     <select
//                       value={beneficiary.current_step}
//                       onChange={(e) => updateStatus(beneficiary.id, e.target.value)}
//                       className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     >
//                       <option value="registration">Registration</option>
//                       <option value="before_photo">Before Photo</option>
//                       <option value="measurement">Measurement</option>
//                       <option value="fitment">Fitment</option>
//                       <option value="extra_items">Extra Items</option>
//                       <option value="after_photo">After Photo</option>
//                       <option value="completed">Completed</option>
//                     </select>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   )
// }