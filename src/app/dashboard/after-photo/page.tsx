'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Beneficiary {
  id: string
  reg_number: string
  name: string
  type_of_aid: string
  completed_steps: string[]
  step_volunteers: any
  before_photo_url?: string
  extra_items?: any[]
}

export default function AfterPhotoPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUpdating] = useState<string | null>(null)
  const [volunteerName, setVolunteerName] = useState('')

  useEffect(() => {
    fetchBeneficiaries()
  }, [])

  const fetchBeneficiaries = async () => {
    try {
      const { data, error } = await supabase
        .from('beneficiaries')
        .select('*')
        .eq('current_step', 'after_photo')
        .order('created_at', { ascending: true })

      if (error) throw error
      setBeneficiaries(data || [])
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error loading beneficiaries: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (beneficiaryId: string, file: File) => {
    if (!volunteerName.trim()) {
      alert('Please enter your volunteer name')
      return
    }

    setUpdating(beneficiaryId)
    try {
      // Upload photo to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `after-${beneficiaryId}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName)

      // Update beneficiary record - Mark as COMPLETED
      const beneficiary = beneficiaries.find(b => b.id === beneficiaryId)
      const { error: updateError } = await supabase
        .from('beneficiaries')
        .update({
          after_photo_url: publicUrl,
          current_step: 'completed',
          completed_steps: [...(beneficiary?.completed_steps || []), 'after_photo'],
          step_volunteers: {
            ...(beneficiary?.step_volunteers || {}),
            after_photo: volunteerName
          }
        })
        .eq('id', beneficiaryId)

      if (updateError) throw updateError

      // Remove from local list
      setBeneficiaries(prev => prev.filter(b => b.id !== beneficiaryId))
      alert('After photo uploaded! Process COMPLETED for this beneficiary. 🎉')
      
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error uploading photo: ' + error.message)
    } finally {
      setUpdating(null)
    }
  }

  const getExtraItemsText = (beneficiary: Beneficiary) => {
    if (!beneficiary.extra_items || beneficiary.extra_items.length === 0) {
      return 'No extra items'
    }
    return beneficiary.extra_items
      .map((item: any) => `${item.item} (${item.quantity})`)
      .join(', ')
  }

  if (loading) return <div className="text-center py-8">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center font-bold text-lg mr-4">
            6
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">After Photography</h1>
            <p className="text-gray-600">Step 6: Final photo with fitted artificial limb</p>
          </div>
        </div>

        {/* Volunteer Name */}
        <div className="mb-6 p-4 bg-pink-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Volunteer Name *
          </label>
          <input
            type="text"
            value={volunteerName}
            onChange={(e) => setVolunteerName(e.target.value)}
            placeholder="Enter your name as volunteer"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
          />
        </div>

        {beneficiaries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No beneficiaries waiting for after photography.
          </div>
        ) : (
          <div className="space-y-6">
            {beneficiaries.map((beneficiary) => (
              <div key={beneficiary.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{beneficiary.name}</h3>
                    <p className="text-gray-600">Reg: {beneficiary.reg_number}</p>
                    <p className="text-sm text-gray-500">Aid: {beneficiary.type_of_aid}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Extra Items: {getExtraItemsText(beneficiary)}
                    </p>
                  </div>
                  <span className="bg-pink-100 text-pink-800 px-2 py-1 rounded text-sm">
                    Final Photo
                  </span>
                </div>

                {/* Before Photo Preview */}
                {beneficiary.before_photo_url && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Before Photo:</p>
                    <img 
                      src={beneficiary.before_photo_url} 
                      alt="Before" 
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
                
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Capture After Photo *
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handlePhotoUpload(beneficiary.id, file)
                        }
                      }}
                      disabled={uploading === beneficiary.id}
                      className="w-full text-sm text-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Take a photo of the beneficiary with their fitted artificial limb
                    </p>
                    {uploading === beneficiary.id && (
                      <span className="text-sm text-gray-500">Uploading final photo...</span>
                    )}
                  </div>
                </div>

                {/* Completion Message */}
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm font-medium">
                    ✅ This is the final step! After uploading the photo, the beneficiary's process will be marked as COMPLETED.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Completion Stats */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Camp Progress</h3>
          <p className="text-blue-800 text-sm">
            Each completed after photo represents one successful artificial limb distribution! 
            Thank you for your service to the community. 🙏
          </p>
        </div>
      </div>
    </div>
  )
}