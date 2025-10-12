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
  measurement_data?: any
}

export default function FitmentPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [volunteerName, setVolunteerName] = useState('')
  const [fitmentData, setFitmentData] = useState<Record<string, any>>({})

  useEffect(() => {
    fetchBeneficiaries()
  }, [])

  const fetchBeneficiaries = async () => {
    try {
      const { data, error } = await supabase
        .from('beneficiaries')
        .select('*')
        .eq('current_step', 'fitment')
        .order('created_at', { ascending: true })

      if (error) throw error
      setBeneficiaries(data || [])
      
      // Initialize fitment data
      const initialFitment: Record<string, any> = {}
      data?.forEach(b => {
        initialFitment[b.id] = {
          comfort_level: '',
          adjustments_made: '',
          fitment_notes: ''
        }
      })
      setFitmentData(initialFitment)
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error loading beneficiaries: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateFitmentData = (beneficiaryId: string, field: string, value: string) => {
    setFitmentData(prev => ({
      ...prev,
      [beneficiaryId]: {
        ...prev[beneficiaryId],
        [field]: value
      }
    }))
  }

  const completeFitment = async (beneficiaryId: string) => {
    if (!volunteerName.trim()) {
      alert('Please enter your volunteer name')
      return
    }

    const data = fitmentData[beneficiaryId]
    if (!data.comfort_level) {
      alert('Please select comfort level')
      return
    }

    setUpdating(beneficiaryId)
    try {
      const beneficiary = beneficiaries.find(b => b.id === beneficiaryId)
      const { error } = await supabase
        .from('beneficiaries')
        .update({
          fitment_data: data,
          current_step: 'extra_items',
          completed_steps: [...(beneficiary?.completed_steps || []), 'fitment'],
          step_volunteers: {
            ...(beneficiary?.step_volunteers || {}),
            fitment: volunteerName
          }
        })
        .eq('id', beneficiaryId)

      if (error) throw error

      // Remove from local list
      setBeneficiaries(prev => prev.filter(b => b.id !== beneficiaryId))
      alert('Fitment completed! Moved to Step 5: Extra Items')
      
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error completing fitment: ' + error.message)
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-lg mr-4">
            4
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fitment</h1>
            <p className="text-gray-600">Step 4: Fit the artificial limb and check comfort</p>
          </div>
        </div>

        {/* Volunteer Name */}
        <div className="mb-6 p-4 bg-purple-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Volunteer Name *
          </label>
          <input
            type="text"
            value={volunteerName}
            onChange={(e) => setVolunteerName(e.target.value)}
            placeholder="Enter your name as volunteer"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        {beneficiaries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No beneficiaries waiting for fitment.
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
                    {beneficiary.measurement_data && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                        <strong>Measurements:</strong> Length: {beneficiary.measurement_data.length}cm, 
                        Circumference: {beneficiary.measurement_data.circumference}cm
                      </div>
                    )}
                  </div>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                    Fit Limb
                  </span>
                </div>
                
                {/* Fitment Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comfort Level *
                    </label>
                    <select
                      value={fitmentData[beneficiary.id]?.comfort_level || ''}
                      onChange={(e) => updateFitmentData(beneficiary.id, 'comfort_level', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Select comfort level</option>
                      <option value="excellent">Excellent - Perfect fit</option>
                      <option value="good">Good - Minor adjustments needed</option>
                      <option value="fair">Fair - Some discomfort</option>
                      <option value="poor">Poor - Major adjustments needed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adjustments Made
                    </label>
                    <textarea
                      value={fitmentData[beneficiary.id]?.adjustments_made || ''}
                      onChange={(e) => updateFitmentData(beneficiary.id, 'adjustments_made', e.target.value)}
                      rows={2}
                      placeholder="Describe any adjustments made to the limb..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fitment Notes
                    </label>
                    <textarea
                      value={fitmentData[beneficiary.id]?.fitment_notes || ''}
                      onChange={(e) => updateFitmentData(beneficiary.id, 'fitment_notes', e.target.value)}
                      rows={3}
                      placeholder="Any additional notes about the fitment process..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>

                <button
                  onClick={() => completeFitment(beneficiary.id)}
                  disabled={updating === beneficiary.id}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium mt-4"
                >
                  {updating === beneficiary.id ? 'Completing...' : 'Complete Fitment & Move to Step 5'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}