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

export default function MeasurementPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [volunteerName, setVolunteerName] = useState('')
  const [measurements, setMeasurements] = useState<Record<string, any>>({})

  useEffect(() => {
    fetchBeneficiaries()
  }, [])

  const fetchBeneficiaries = async () => {
    try {
      const { data, error } = await supabase
        .from('beneficiaries')
        .select('*')
        .eq('current_step', 'measurement')
        .order('created_at', { ascending: true })

      if (error) throw error
      setBeneficiaries(data || [])
      
      // Initialize measurements state
      const initialMeasurements: Record<string, any> = {}
      data?.forEach(b => {
        initialMeasurements[b.id] = b.measurement_data || {
          length: '',
          circumference: '',
          notes: ''
        }
      })
      setMeasurements(initialMeasurements)
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error loading beneficiaries: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateMeasurement = (beneficiaryId: string, field: string, value: string) => {
    setMeasurements(prev => ({
      ...prev,
      [beneficiaryId]: {
        ...prev[beneficiaryId],
        [field]: value
      }
    }))
  }

  const submitMeasurement = async (beneficiaryId: string) => {
    if (!volunteerName.trim()) {
      alert('Please enter your volunteer name')
      return
    }

    const measurementData = measurements[beneficiaryId]
    if (!measurementData.length || !measurementData.circumference) {
      alert('Please fill all required measurement fields')
      return
    }

    setUpdating(beneficiaryId)
    try {
      const beneficiary = beneficiaries.find(b => b.id === beneficiaryId)
      const { error } = await supabase
        .from('beneficiaries')
        .update({
          measurement_data: measurementData,
          current_step: 'fitment',
          completed_steps: [...(beneficiary?.completed_steps || []), 'measurement'],
          step_volunteers: {
            ...(beneficiary?.step_volunteers || {}),
            measurement: volunteerName
          }
        })
        .eq('id', beneficiaryId)

      if (error) throw error

      // Remove from local list
      setBeneficiaries(prev => prev.filter(b => b.id !== beneficiaryId))
      alert('Measurements recorded! Moved to Step 4: Fitment')
      
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error saving measurements: ' + error.message)
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center font-bold text-lg mr-4">
            3
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Measurement</h1>
            <p className="text-gray-600">Step 3: Take measurements for artificial limb</p>
          </div>
        </div>

        {/* Volunteer Name */}
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Volunteer Name *
          </label>
          <input
            type="text"
            value={volunteerName}
            onChange={(e) => setVolunteerName(e.target.value)}
            placeholder="Enter your name as volunteer"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          />
        </div>

        {beneficiaries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No beneficiaries waiting for measurements.
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
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                    Take Measurements
                  </span>
                </div>
                
                {/* Measurement Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Length (cm) *
                    </label>
                    <input
                      type="number"
                      value={measurements[beneficiary.id]?.length || ''}
                      onChange={(e) => updateMeasurement(beneficiary.id, 'length', e.target.value)}
                      placeholder="Enter length in cm"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Circumference (cm) *
                    </label>
                    <input
                      type="number"
                      value={measurements[beneficiary.id]?.circumference || ''}
                      onChange={(e) => updateMeasurement(beneficiary.id, 'circumference', e.target.value)}
                      placeholder="Enter circumference in cm"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={measurements[beneficiary.id]?.notes || ''}
                    onChange={(e) => updateMeasurement(beneficiary.id, 'notes', e.target.value)}
                    rows={3}
                    placeholder="Any special requirements or notes..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>

                <button
                  onClick={() => submitMeasurement(beneficiary.id)}
                  disabled={updating === beneficiary.id}
                  className="w-full bg-yellow-600 text-white py-3 rounded-lg hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {updating === beneficiary.id ? 'Saving...' : 'Save Measurements & Move to Step 4'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}