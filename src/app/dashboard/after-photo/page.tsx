/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import type { ExtraItem } from '@/types'

interface Beneficiary {
  id: string
  reg_number: string
  name: string
  type_of_aid: string
  current_step: string
  status?: string
  before_photo_url?: string
  after_photo_url?: string
  extra_items?: ExtraItem[]
}

export default function AfterPhotoPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [revertingId, setRevertingId] = useState<string | null>(null)
  const [currentEvent, setCurrentEvent] = useState<any>(null)

  useEffect(() => {
    const eventId = localStorage.getItem('current_event')
    if (!eventId) {
      alert('Please select an event first')
      window.location.href = '/event-setup'
      return
    }
    fetchEvent(eventId)
    fetchBeneficiaries(eventId)
  }, [])

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
    }
  }

  const fetchBeneficiaries = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('beneficiaries')
        .select('*')
        .eq('event_id', eventId)
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
    setUploadingId(beneficiaryId)
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
      const { error: updateError } = await supabase
        .from('beneficiaries')
        .update({
          after_photo_url: publicUrl,
          current_step: 'completed'
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
      setUploadingId(null)
    }
  }

  const revertToPreviousStep = async (beneficiaryId: string) => {
    if (!confirm('Are you sure you want to send this beneficiary back to Extra Items step?')) {
      return
    }

    setRevertingId(beneficiaryId)
    try {
      const { error } = await supabase
        .from('beneficiaries')
        .update({
          current_step: 'extra_items',
          after_photo_url: null
        })
        .eq('id', beneficiaryId)

      if (error) throw error

      // Remove from local list
      setBeneficiaries(prev => prev.filter(b => b.id !== beneficiaryId))
      alert('Beneficiary sent back to Extra Items step')
      
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error reverting step: ' + error.message)
    } finally {
      setRevertingId(null)
    }
  }

  const markAsCompletedWithoutPhoto = async (beneficiaryId: string) => {
    if (!confirm('Mark as completed without after photo? This will complete the process but no after photo will be recorded.')) {
      return
    }

    setCompletingId(beneficiaryId)
    try {
      const { error } = await supabase
        .from('beneficiaries')
        .update({
          current_step: 'completed',
          after_photo_url: null
        })
        .eq('id', beneficiaryId)

      if (error) throw error

      // Remove from local list
      setBeneficiaries(prev => prev.filter(b => b.id !== beneficiaryId))
      alert('Process marked as completed without photo.')
      
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error updating status: ' + error.message)
    } finally {
      setCompletingId(null)
    }
  }

  const getExtraItemsText = (beneficiary: Beneficiary) => {
    if (!beneficiary.extra_items || beneficiary.extra_items.length === 0) {
      return 'No extra items'
    }
    
    return beneficiary.extra_items
      .map((item: any) => {
        if (item.quantity && item.quantity > 1) {
          return `${item.quantity} ${item.name || item.item}`
        }
        return item.name || item.item
      })
      .join(', ')
  }

  // Helper function to check if any action is in progress for a beneficiary
  const isActionInProgress = (beneficiaryId: string) => {
    return uploadingId === beneficiaryId || completingId === beneficiaryId || revertingId === beneficiaryId
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
            {currentEvent && (
              <p className="text-sm text-gray-500 mt-1">
                Event: {currentEvent.event_name} | {new Date(currentEvent.event_date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {beneficiaries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">All Caught Up!</h3>
            <p className="text-gray-600">No beneficiaries waiting for after photography.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {beneficiaries.map((beneficiary) => (
              <div key={beneficiary.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{beneficiary.name}</h3>
                    <p className="text-gray-600">Reg: {beneficiary.reg_number}</p>
                    <p className="text-sm text-gray-500">Aid: {beneficiary.type_of_aid}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Extra Items: {getExtraItemsText(beneficiary)}
                    </p>
                    
                    <div className="mt-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-pink-100 text-pink-800">
                        📸 Ready for Final Photo
                      </span>
                    </div>
                  </div>
                </div>

                {/* Before Photo Preview */}
                {beneficiary.before_photo_url && (
                  <div className="mb-4">
                    <Image
                      src={beneficiary.before_photo_url || ''}
                      alt="Before"
                      width={128}
                      height={128}
                      className="w-32 h-32 object-cover rounded-lg border shadow-sm"
                      style={{ objectFit: 'cover' }}
                      unoptimized={true}
                    />
                    
                  </div>
                )}
                
                {/* Photo Upload Section */}
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    📷 Capture After Photo *
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
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
                        disabled={isActionInProgress(beneficiary.id)}
                        className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                      />
                      <p className="text-xs text-blue-600 mt-1">
                        Take a clear photo of the beneficiary with their fitted artificial limb
                      </p>
                    </div>
                  </div>
                  {uploadingId === beneficiary.id && (
                    <div className="mt-2 flex items-center text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Uploading and completing process...
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => markAsCompletedWithoutPhoto(beneficiary.id)}
                    disabled={isActionInProgress(beneficiary.id)}
                    className="flex-1 bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
                  >
                    {completingId === beneficiary.id ? (
                      <>⏳ Processing...</>
                    ) : (
                      <>⚠️ Complete Without Photo</>
                    )}
                  </button>

                  <button
                    onClick={() => revertToPreviousStep(beneficiary.id)}
                    disabled={isActionInProgress(beneficiary.id)}
                    className="px-4 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
                    title="Send back to Extra Items step"
                  >
                    {revertingId === beneficiary.id ? '...' : '↩️'}
                  </button>
                </div>

                {/* Completion Message */}
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-lg">✅</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-green-800">Final Step!</h4>
                      <p className="text-sm text-green-700">
                        After uploading the photo, the beneficiary&apos;s process will be marked as <strong>COMPLETED</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Completion Stats */}
        <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Final Step Progress</h3>
              <p className="text-gray-700 text-sm">
                {beneficiaries.length} {beneficiaries.length === 1 ? 'person' : 'people'} waiting for final photos
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Each completion represents one successful artificial limb distribution
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">{beneficiaries.length}</div>
              <div className="text-sm text-green-800">Almost Done!</div>
            </div>
          </div>
        </div>

        {/* Celebration Section when empty */}
        {beneficiaries.length === 0 && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <span className="text-2xl">🎊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Amazing Work!</h3>
            <p className="text-gray-600">
              You&apos;ve helped transform lives through artificial limb distribution. Thank you for your service! 🙏
            </p>
          </div>
        )}
      </div>
    </div>
  )
}