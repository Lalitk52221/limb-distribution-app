'use client'
import { useState, useEffect } from 'react'
// import { createClient } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import type { CampSummary } from '@/types'

export default function SummaryPage() {
  const [summary, setSummary] = useState<CampSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSummary()
  }, [])

  const fetchSummary = async () => {
    try {
      // const supabase = createClient()
      const { data: beneficiaries, error } = await supabase
        .from('beneficiaries')
        .select('*')

      if (error) throw error

      // Calculate summary
      const aidTypes: Record<string, number> = {}
      const extraItems: Record<string, number> = {}
      const stepCounts: Record<string, number> = {}
      let completedCount = 0

      beneficiaries?.forEach(beneficiary => {
        // Count aid types
        if (beneficiary.type_of_aid) {
          aidTypes[beneficiary.type_of_aid] = (aidTypes[beneficiary.type_of_aid] || 0) + 1
        }

        // Count extra items
        if (beneficiary.extra_items) {
          beneficiary.extra_items.forEach((item: any) => {
            extraItems[item.item] = (extraItems[item.item] || 0) + item.quantity
          })
        }

        // Count steps
        beneficiary.completed_steps?.forEach(step => {
          stepCounts[step] = (stepCounts[step] || 0) + 1
        })

        // Count completed
        if (beneficiary.current_step === 'completed') {
          completedCount++
        }
      })

      setSummary({
        total_beneficiaries: beneficiaries?.length || 0,
        completed_beneficiaries: completedCount,
        aid_types: aidTypes,
        extra_items: extraItems,
        step_counts: stepCounts
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getItemDisplayName = (itemId: string) => {
    const items: Record<string, string> = {
      stick: 'Walking Stick 🦯',
      shoes: 'Shoes 👟',
      crutches: 'Crutches 🩼',
      walker: 'Walker 🚶',
      elbow_stick: 'Elbow Stick 🦾'
    }
    return items[itemId] || itemId
  }

  const getStepDisplayName = (stepId: string) => {
    const steps: Record<string, string> = {
      registration: 'Registration',
      before_photo: 'Before Photo',
      measurement: 'Measurement',
      fitment: 'Fitment',
      extra_items: 'Extra Items',
      after_photo: 'After Photo'
    }
    return steps[stepId] || stepId
  }

  if (loading) return <div className="text-center py-8">Loading summary...</div>
  if (!summary) return <div className="text-center py-8">No data available</div>

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Camp Summary</h1>
        <p className="text-gray-600 mb-8">Real-time statistics and distribution summary</p>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{summary.total_beneficiaries}</div>
            <div className="text-blue-800 font-medium">Total Beneficiaries</div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{summary.completed_beneficiaries}</div>
            <div className="text-green-800 font-medium">Completed Process</div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {summary.total_beneficiaries > 0 
                ? Math.round((summary.completed_beneficiaries / summary.total_beneficiaries) * 100)
                : 0}%
            </div>
            <div className="text-purple-800 font-medium">Completion Rate</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Aid Types Distribution */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Artificial Limb Types</h2>
            {Object.keys(summary.aid_types).length === 0 ? (
              <p className="text-gray-500">No data available</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(summary.aid_types).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-gray-700">{type}</span>
                    <span className="font-semibold text-blue-600">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Extra Items Distribution */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Extra Items Distributed</h2>
            {Object.keys(summary.extra_items).length === 0 ? (
              <p className="text-gray-500">No extra items distributed yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(summary.extra_items).map(([item, quantity]) => (
                  <div key={item} className="flex justify-between items-center">
                    <span className="text-gray-700">{getItemDisplayName(item)}</span>
                    <span className="font-semibold text-green-600">{quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Progress by Step */}
        <div className="mt-8 border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Progress by Workflow Step</h2>
          <div className="space-y-4">
            {[
              'registration',
              'before_photo', 
              'measurement',
              'fitment',
              'extra_items',
              'after_photo'
            ].map((step) => (
              <div key={step} className="flex items-center justify-between">
                <span className="text-gray-700 w-32">{getStepDisplayName(step)}</span>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${summary.total_beneficiaries > 0 
                          ? (summary.step_counts[step] || 0) / summary.total_beneficiaries * 100 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm text-gray-600 w-16 text-right">
                  {summary.step_counts[step] || 0} / {summary.total_beneficiaries}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Volunteer Statistics */}
        <div className="mt-8 border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Workflow Efficiency</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {summary.total_beneficiaries > 0 
                  ? Math.round((summary.step_counts.registration || 0) / summary.total_beneficiaries * 100)
                  : 0}%
              </div>
              <div className="text-sm text-gray-600">Registration Complete</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {summary.total_beneficiaries > 0 
                  ? Math.round((summary.step_counts.extra_items || 0) / summary.total_beneficiaries * 100)
                  : 0}%
              </div>
              <div className="text-sm text-gray-600">Extra Items Distributed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {summary.total_beneficiaries > 0 
                  ? Math.round((summary.step_counts.after_photo || 0) / summary.total_beneficiaries * 100)
                  : 0}%
              </div>
              <div className="text-sm text-gray-600">Final Photos Taken</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}