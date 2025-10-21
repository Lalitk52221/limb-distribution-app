/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Beneficiary {
  id: string
  reg_number: string
  name: string
  type_of_aid: string
  completed_steps: string[]
}

export default function BeforePhotoPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUpdating] = useState<string | null>(null)
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
        .eq('current_step', 'before_photo')
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
    setUpdating(beneficiaryId)
    try {
      // Compress the image first to reduce storage usage (target ~300KB)
      const compressImage = async (inputFile: File, targetKB = 300, maxWidth = 1280): Promise<Blob | null> => {
        try {
          // createImageBitmap is efficient; fallback to HTMLImageElement if not available
          let bitmap: ImageBitmap | null = null
          if ('createImageBitmap' in window) {
            bitmap = await (window as any).createImageBitmap(inputFile)
          }

          const img = document.createElement('img')
          if (!bitmap) {
            const dataUrl = await new Promise<string>((res, rej) => {
              const fr = new FileReader()
              fr.onload = () => res(fr.result as string)
              fr.onerror = rej
              fr.readAsDataURL(inputFile)
            })
            img.src = dataUrl
            await new Promise((r) => (img.onload = r))
          }

          const naturalWidth = bitmap ? bitmap.width : img.naturalWidth
          const naturalHeight = bitmap ? bitmap.height : img.naturalHeight
          const scale = Math.min(1, maxWidth / naturalWidth)
          const width = Math.max(1, Math.round(naturalWidth * scale))
          const height = Math.max(1, Math.round(naturalHeight * scale))

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')!
          if (bitmap) {
            ctx.drawImage(bitmap, 0, 0, width, height)
            bitmap.close()
          } else {
            ctx.drawImage(img, 0, 0, width, height)
          }

          // Try reducing quality until under targetKB
          let quality = 0.92
          let blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality))
          const targetBytes = targetKB * 1024
          while (blob && blob.size > targetBytes && quality > 0.45) {
            quality -= 0.08
            blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality))
          }

          // If still too large, reduce dimensions and retry
          let curWidth = width
          while (blob && blob.size > targetBytes && curWidth > 400) {
            curWidth = Math.round(curWidth * 0.9)
            const curHeight = Math.round((naturalHeight * curWidth) / naturalWidth)
            canvas.width = curWidth
            canvas.height = curHeight
            ctx.clearRect(0, 0, curWidth, curHeight)
            if (bitmap) {
              // cannot redraw bitmap after closed; recreate from file
              const dataUrl = await new Promise<string>((res, rej) => {
                const fr = new FileReader()
                fr.onload = () => res(fr.result as string)
                fr.onerror = rej
                fr.readAsDataURL(inputFile)
              })
              const tempImg = document.createElement('img')
              tempImg.src = dataUrl
              await new Promise((r) => (tempImg.onload = r))
              ctx.drawImage(tempImg, 0, 0, curWidth, curHeight)
            } else {
              ctx.drawImage(img, 0, 0, curWidth, curHeight)
            }
            quality = Math.max(0.5, quality - 0.05)
            blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality))
          }

          return blob
        } catch (err) {
          console.error('Compression error:', err)
          return null
        }
      }

      const fileExt = 'jpg'
      const fileName = `before-${beneficiaryId}-${Date.now()}.${fileExt}`

      // compress
      const compressedBlob = await compressImage(file, 300, 1280)
      const uploadSource = compressedBlob ?? file

      // Upload compressed photo to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, uploadSource as Blob, { contentType: 'image/jpeg' })

      if (uploadError) throw uploadError

      // Get public URL
      const publicData = supabase.storage.from('photos').getPublicUrl(fileName)
      const publicUrl = (publicData as any)?.data?.publicUrl ?? (publicData as any)?.publicUrl ?? null

      // Update beneficiary
      const beneficiary = beneficiaries.find(b => b.id === beneficiaryId)
      const { error: updateError } = await supabase
        .from('beneficiaries')
        .update({
          before_photo_url: publicUrl,
          current_step: 'measurement',
          completed_steps: [...(beneficiary?.completed_steps || []), 'before_photo']
        })
        .eq('id', beneficiaryId)

      if (updateError) throw updateError

      // Remove from local list
      setBeneficiaries(prev => prev.filter(b => b.id !== beneficiaryId))
      alert('Before photo uploaded successfully! Moved to Step 3: Measurement')
      
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error uploading photo: ' + error.message)
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return <div className="text-center py-8 text-black">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-lg mr-4">
            2
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Before Photography</h1>
            <p className="text-gray-600">Step 2: Capture before photo of beneficiary</p>
            {currentEvent && (
              <p className="text-sm text-gray-500 mt-1">
                Event: {currentEvent.event_name} | {new Date(currentEvent.event_date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {beneficiaries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No beneficiaries waiting for before photography.
          </div>
        ) : (
          <div className="space-y-4">
            {beneficiaries.map((beneficiary) => (
              <div key={beneficiary.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{beneficiary.name}</h3>
                    <p className="text-gray-600">Reg: {beneficiary.reg_number}</p>
                    <p className="text-sm text-gray-500">Aid: {beneficiary.type_of_aid}</p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    Ready for Photo
                  </span>
                </div>
                
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
                      disabled={uploading === beneficiary.id}
                      className="text-sm text-gray-600 cursor-pointer hover:text-gray-800 bg-gray-100 p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                    />
                    {uploading === beneficiary.id && (
                      <span className="text-sm text-gray-500 ml-2">Uploading...</span>
                    )}
                  </div>
                  
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end mt-6">
        <button disabled={uploading !== null} className="bg-green-600 text-white text-sm px-8 py-3 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium w-full ">
              <Link href="/dashboard/measurement">Move to Measurement</Link>
            </button>
            </div>
      </div>
    </div>
  )
}