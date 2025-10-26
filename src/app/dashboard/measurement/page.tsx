/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Beneficiary {
  id: string
  reg_number: string
  name: string
  type_of_aid: any
  current_step: string
  measurement_data?: any
}
const formatTypeOfAid = (data: any) => {
  if (!data || typeof data !== 'object') return 'Not specified'
  const aidParts = []
  if (data.left_below_knee) aidParts.push('Left Below Knee')
  if (data.left_above_knee) aidParts.push('Left Above Knee')
  if (data.right_below_knee) aidParts.push('Right Below Knee')
  if (data.right_above_knee) aidParts.push('Right Above Knee')
  if (data.left_caliper) aidParts.push('Left Caliper')
  if (data.right_caliper) aidParts.push('Right Caliper')
  if (data.above_hand) aidParts.push('Above Hand')
  if (data.below_hand) aidParts.push('Below Hand')
  if (data.shoes) aidParts.push('Shoes')
  if (data.gloves) aidParts.push('Gloves')
  if (data.walker) aidParts.push('Walker')
  if (data.stick) aidParts.push(`Stick (Qty: ${data.stick_qty || 1})`)
  if (data.crutches)
    aidParts.push(`Crutches (Qty: ${data.crutches_qty || 1})`)
  if (data.elbow_crutches)
    aidParts.push(`Elbow Crutches (Qty: ${data.elbow_crutches_qty || 1})`)
  if (data.others && data.others_specify)
    aidParts.push(`Other: ${data.others_specify}`)

  return aidParts.join(', ') || 'Not specified'
}


export default function MeasurementPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
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
        .eq('current_step', 'measurement')
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

  const markMeasurementDone = async (beneficiaryId: string) => {
    setUpdating(beneficiaryId)
    try {
      const { error } = await supabase
        .from('beneficiaries')
        .update({
          current_step: 'fitment',
          measurement_data: { status: 'completed', completed_at: new Date().toISOString() }
        })
        .eq('id', beneficiaryId)

      if (error) throw error

      // Remove from local list
      setBeneficiaries(prev => prev.filter(b => b.id !== beneficiaryId))
      alert('Measurement marked as completed! Moved to Step 4: Fitment')
      
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error updating measurement: ' + error.message)
    } finally {
      setUpdating(null)
    }
  }

  const revertToPreviousStep = async (beneficiaryId: string) => {
    if (!confirm('Are you sure you want to send this beneficiary back to Before Photo step?')) {
      return
    }

    setUpdating(beneficiaryId)
    try {
      const { error } = await supabase
        .from('beneficiaries')
        .update({
          current_step: 'before_photo',
          measurement_data: null
        })
        .eq('id', beneficiaryId)

      if (error) throw error

      // Remove from local list
      setBeneficiaries(prev => prev.filter(b => b.id !== beneficiaryId))
      alert('Beneficiary sent back to Before Photo step')
      
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error reverting step: ' + error.message)
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return <div className="text-center py-8 text-black">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center font-bold text-lg mr-4">
            3
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Measurement</h1>
            <p className="text-gray-600">Step 3: Mark measurement as completed</p>
            {currentEvent && (
              <p className="text-sm text-gray-500 mt-1">
                Event: {currentEvent.event_name} | {new Date(currentEvent.event_date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {beneficiaries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No beneficiaries waiting for measurements.
          </div>
        ) : (
          <div className="space-y-4">
            {beneficiaries.map((beneficiary) => (
              <div key={beneficiary.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{beneficiary.name}</h3>
                    <p className="text-gray-600">Reg: {beneficiary.reg_number}</p>
                    <p className="text-sm text-gray-500">Aid: {formatTypeOfAid(beneficiary.type_of_aid)}</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        📏 Waiting for Measurement
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Measurement Status */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Measurement Status:</h4>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span className="text-gray-700">Pending - Measurements need to be taken</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => markMeasurementDone(beneficiary.id)}
                    disabled={updating === beneficiary.id}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
                  >
                    {updating === beneficiary.id ? (
                      <>⏳ Processing...</>
                    ) : (
                      <>✅ Mark Measurement Completed</>
                    )}
                  </button>

                  <button
                    onClick={() => revertToPreviousStep(beneficiary.id)}
                    disabled={updating === beneficiary.id}
                    className="px-4 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
                    title="Send back to Before Photo step"
                  >
                    ↩️
                  </button>
                </div>

                {/* Instructions */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Instructions:</strong> Take measurements for the artificial limb, then click &quot;Mark Measurement Completed&quot; to move to next step.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-8 p-4 bg-green-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-900">Measurement Progress</h3>
              <p className="text-green-700 text-sm">
                {beneficiaries.length} {beneficiaries.length === 1 ? 'person' : 'people'} waiting for measurements
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">{beneficiaries.length}</div>
              <div className="text-sm text-green-800">Pending</div>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-6 ">
          <button className="bg-green-600 text-sm text-white px-8 py-3 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium w-full ">
            <Link href="/dashboard/fitment">Move to Fitment</Link>
          </button>
        </div>
      </div>
    </div>
  )
}