/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

interface Beneficiary {
  id: string
  reg_number: string
  name: string
  type_of_aid: string
  current_step: string
  before_photo_url?: string
  after_photo_url?: string
  created_at: string
}

interface Stats {
  total: number
  registered: number
  before_photo: number
  measurement: number
  fitment: number
  extra_items: number
  after_photo: number
  completed: number
}

export default function ManagePage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [loading, setLoading] = useState(true)
  const [currentEvent, setCurrentEvent] = useState<any>(null)
  const [stats, setStats] = useState<Stats>({
    total: 0,
    registered: 0,
    before_photo: 0,
    measurement: 0,
    fitment: 0,
    extra_items: 0,
    after_photo: 0,
    completed: 0
  })

  useEffect(() => {
    const eventId = localStorage.getItem('current_event')
    if (!eventId) {
      alert('Please select an event first')
      window.location.href = '/event-setup'
      return
    }
    fetchEvent(eventId)
    fetchBeneficiaries(eventId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        .order('created_at', { ascending: false })

      if (error) throw error
      setBeneficiaries(data || [])
      calculateStats(data || [])
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error loading data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data: Beneficiary[]) => {
    const stats: Stats = {
      total: data.length,
      registered: data.filter(b => b.current_step === 'registration').length,
      before_photo: data.filter(b => b.current_step === 'before_photo').length,
      measurement: data.filter(b => b.current_step === 'measurement').length,
      fitment: data.filter(b => b.current_step === 'fitment').length,
      extra_items: data.filter(b => b.current_step === 'extra_items').length,
      after_photo: data.filter(b => b.current_step === 'after_photo').length,
      completed: data.filter(b => b.current_step === 'completed').length
    }
    setStats(stats)
  }

  const updateStatus = async (id: string, current_step: string) => {
    try {
      const { error } = await supabase
        .from('beneficiaries')
        .update({ current_step })
        .eq('id', id)

      if (error) throw error
      
      // Refresh data
      const eventId = localStorage.getItem('current_event')
      if (eventId) fetchBeneficiaries(eventId)
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error updating status: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="text-center text-black">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Camp Management Dashboard</h1>
            {currentEvent && (
              <p className="text-gray-600">
                Event: {currentEvent.event_name} | {new Date(currentEvent.event_date).toLocaleDateString()} | {currentEvent.location}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Beneficiaries</div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-blue-600">{stats.registered}</div>
            <div className="text-sm text-blue-800">Registered</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-green-600">{stats.before_photo}</div>
            <div className="text-sm text-green-800">Before Photo</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-yellow-600">{stats.measurement}</div>
            <div className="text-sm text-yellow-800">Measurement</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-purple-600">{stats.fitment}</div>
            <div className="text-sm text-purple-800">Fitment</div>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-indigo-600">{stats.extra_items}</div>
            <div className="text-sm text-indigo-800">Extra Items</div>
          </div>
          <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-pink-600">{stats.after_photo}</div>
            <div className="text-sm text-pink-800">After Photo</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-green-800">Completed</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-gray-600">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-800">Completion Rate</div>
          </div>
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
                  Aid Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Step
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Before Photo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  After Photo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Update Step
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {beneficiaries.map((beneficiary) => (
                <tr key={beneficiary.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {beneficiary.reg_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {beneficiary.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {beneficiary.type_of_aid}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      beneficiary.current_step === 'completed' ? 'bg-green-100 text-green-800' :
                      beneficiary.current_step === 'after_photo' ? 'bg-pink-100 text-pink-800' :
                      beneficiary.current_step === 'extra_items' ? 'bg-indigo-100 text-indigo-800' :
                      beneficiary.current_step === 'fitment' ? 'bg-purple-100 text-purple-800' :
                      beneficiary.current_step === 'measurement' ? 'bg-yellow-100 text-yellow-800' :
                      beneficiary.current_step === 'before_photo' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {beneficiary.current_step.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {beneficiary.before_photo_url ? (
                      <Image 
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
                      <Image 
                        src={beneficiary.after_photo_url} 
                        alt="After" 
                        className="w-16 h-16 object-cover rounded-lg border"
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">No photo</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <select
                      value={beneficiary.current_step}
                      onChange={(e) => updateStatus(beneficiary.id, e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                      <option value="registration">Registration</option>
                      <option value="before_photo">Before Photo</option>
                      <option value="measurement">Measurement</option>
                      <option value="fitment">Fitment</option>
                      <option value="extra_items">Extra Items</option>
                      <option value="after_photo">After Photo</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {beneficiaries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No beneficiaries registered for this event yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}