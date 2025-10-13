/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// interface Beneficiary {
//   id: string
//   reg_number: string
//   name: string
//   type_of_aid: string
//   current_step: string
//   extra_items?: any[]
// }

interface CampSummary {
  total_beneficiaries: number
  completed_beneficiaries: number
  registered_count: number
  before_photo_count: number
  measurement_count: number
  fitment_count: number
  extra_items_count: number
  after_photo_count: number
  aid_types: Record<string, number>
  extra_items_stats: Record<string, number>
}

export default function SummaryPage() {
  const [summary, setSummary] = useState<CampSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentEvent, setCurrentEvent] = useState<any>(null)

  useEffect(() => {
    const eventId = localStorage.getItem('current_event')
    if (!eventId) {
      alert('Please select an event first')
      window.location.href = '/event-setup'
      return
    }
    fetchEvent(eventId)
    fetchSummary(eventId)
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

  const fetchSummary = async (eventId: string) => {
    try {
      const { data: beneficiaries, error } = await supabase
        .from('beneficiaries')
        .select('*')
        .eq('event_id', eventId)

      if (error) throw error

      // Calculate summary statistics
      const aidTypes: Record<string, number> = {}
      const extraItemsStats: Record<string, number> = {}
      
      let completedCount = 0
      let registeredCount = 0
      let beforePhotoCount = 0
      let measurementCount = 0
      let fitmentCount = 0
      let extraItemsCount = 0
      let afterPhotoCount = 0

      beneficiaries?.forEach(beneficiary => {
        // Count by current step
        switch (beneficiary.current_step) {
          case 'registration':
            registeredCount++
            break
          case 'before_photo':
            beforePhotoCount++
            break
          case 'measurement':
            measurementCount++
            break
          case 'fitment':
            fitmentCount++
            break
          case 'extra_items':
            extraItemsCount++
            break
          case 'after_photo':
            afterPhotoCount++
            break
          case 'completed':
            completedCount++
            break
        }

        // Count aid types
        if (beneficiary.type_of_aid) {
          aidTypes[beneficiary.type_of_aid] = (aidTypes[beneficiary.type_of_aid] || 0) + 1
        }

        // Count extra items
        if (beneficiary.extra_items) {
          beneficiary.extra_items.forEach((item: any) => {
            const itemName = item.name || item.item
            if (itemName) {
              extraItemsStats[itemName] = (extraItemsStats[itemName] || 0) + (item.quantity || 1)
            }
          })
        }
      })

      setSummary({
        total_beneficiaries: beneficiaries?.length || 0,
        completed_beneficiaries: completedCount,
        registered_count: registeredCount,
        before_photo_count: beforePhotoCount,
        measurement_count: measurementCount,
        fitment_count: fitmentCount,
        extra_items_count: extraItemsCount,
        after_photo_count: afterPhotoCount,
        aid_types: aidTypes,
        extra_items_stats: extraItemsStats
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProgressPercentage = (count: number, total: number) => {
    return total > 0 ? Math.round((count / total) * 100) : 0
  }

  if (loading) return <div className="text-center py-8 text-black">Loading summary...</div>
  if (!summary) return <div className="text-center py-8 text-black">No data available</div>

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Camp Summary Dashboard</h1>
            {currentEvent && (
              <p className="text-gray-600">
                Event: <strong>{currentEvent.event_name}</strong> | 
                Date: <strong>{new Date(currentEvent.event_date).toLocaleDateString()}</strong> | 
                Location: <strong>{currentEvent.location}</strong>
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{summary.total_beneficiaries}</div>
            <div className="text-sm text-gray-600">Total Beneficiaries</div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">{summary.completed_beneficiaries}</div>
            <div className="text-blue-800 font-medium text-sm">Completed</div>
            <div className="text-xs text-blue-600 mt-1">
              {getProgressPercentage(summary.completed_beneficiaries, summary.total_beneficiaries)}% of total
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">{summary.registered_count}</div>
            <div className="text-green-800 font-medium text-sm">Registered</div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600 mb-1">{summary.measurement_count + summary.fitment_count}</div>
            <div className="text-yellow-800 font-medium text-sm">In Progress</div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {getProgressPercentage(summary.completed_beneficiaries, summary.total_beneficiaries)}%
            </div>
            <div className="text-purple-800 font-medium text-sm">Completion Rate</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Workflow Progress */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Workflow Progress</h2>
            <div className="space-y-4">
              {[
                { step: 'Registration', count: summary.registered_count, color: 'blue' },
                { step: 'Before Photo', count: summary.before_photo_count, color: 'green' },
                { step: 'Measurement', count: summary.measurement_count, color: 'yellow' },
                { step: 'Fitment', count: summary.fitment_count, color: 'purple' },
                { step: 'Extra Items', count: summary.extra_items_count, color: 'indigo' },
                { step: 'After Photo', count: summary.after_photo_count, color: 'pink' },
                { step: 'Completed', count: summary.completed_beneficiaries, color: 'green' },
              ].map(({ step, count, color }) => (
                <div key={step} className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">{step}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 rounded-full h-3">
                      <div 
                        className={`bg-${color}-600 h-3 rounded-full transition-all duration-500`}
                        style={{ 
                          width: `${getProgressPercentage(count, summary.total_beneficiaries)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Aid Types Distribution */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Artificial Limb Types</h2>
            {Object.keys(summary.aid_types).length === 0 ? (
              <p className="text-gray-500 text-center py-4">No aid types recorded yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(summary.aid_types).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-gray-700">{type}</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-blue-600">{count}</span>
                      <span className="text-xs text-gray-500">
                        ({getProgressPercentage(count, summary.total_beneficiaries)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Extra Items Distribution */}
        <div className="mt-8 border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Extra Items Distributed</h2>
          {Object.keys(summary.extra_items_stats).length === 0 ? (
            <p className="text-gray-500 text-center py-4">No extra items distributed yet</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(summary.extra_items_stats).map(([item, quantity]) => (
                <div key={item} className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">
                    {item === 'Walking Stick' && '🦯'}
                    {item === 'Shoes' && '👟'}
                    {item === 'Crutches' && '🩼'}
                    {item === 'Walker' && '🚶'}
                    {item === 'Elbow Crutches' && '🦾'}
                    {!['Walking Stick', 'Shoes', 'Crutches', 'Walker', 'Elbow Crutches'].includes(item) && '📦'}
                  </div>
                  <div className="font-semibold text-gray-900">{quantity}</div>
                  <div className="text-sm text-gray-600">{item}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{summary.before_photo_count}</div>
            <div className="text-sm text-blue-800">Before Photos</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{summary.after_photo_count}</div>
            <div className="text-sm text-green-800">After Photos</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600">
              {summary.total_beneficiaries - summary.completed_beneficiaries}
            </div>
            <div className="text-sm text-purple-800">Still in Progress</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
            <div className="text-lg font-bold text-orange-600">
              {Math.round((summary.completed_beneficiaries / summary.total_beneficiaries) * 100)}%
            </div>
            <div className="text-sm text-orange-800">Success Rate</div>
          </div>
        </div>
      </div>
    </div>
  )
}