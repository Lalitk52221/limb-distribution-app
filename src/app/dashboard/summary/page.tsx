/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface CampSummary {
  total_beneficiaries: number;
  completed_beneficiaries: number;
  registered_count: number;
  before_photo_count: number;
  measurement_count: number;
  fitment_count: number;
  extra_items_count: number;
  after_photo_count: number;
  aid_types: Record<string, number>;
  extra_items_stats: Record<string, number>;
  fitment_required: number;
  fitment_done: number;
  cancelled_count: number;
}

interface Beneficiary {
  id: string;
  name: string;
  reg_number: string;
  type_of_aid: any;
  status?: string;
  before_photo_url?: string;
  after_photo_url?: string;
  current_step?: string;
  extra_items?: any[];
}

export default function SummaryPage() {
  const [summary, setSummary] = useState<CampSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentEvent, setCurrentEvent] = useState<any>(null)
  const [allBeneficiaries, setAllBeneficiaries] = useState<Beneficiary[]>([])
  const [detailedAidStats, setDetailedAidStats] = useState<Record<string, number>>({})
  const fetchEvent = useCallback(async (eventId: string) => {
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
  }, [])

  const fetchSummary = useCallback(async (eventId: string) => {
    try {
      const { data: beneficiaries, error } = await supabase
        .from('beneficiaries')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (!beneficiaries) {
        setLoading(false)
        return
      }

      setAllBeneficiaries(beneficiaries)

      // Calculate summary statistics
      const aidTypes: Record<string, number> = {}
      const extraItemsStats: Record<string, number> = {}
      let fitmentRequired = 0
      let fitmentDone = 0
      let cancelledCount = 0
      
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

  if (beneficiary.status === 'cancelled' || beneficiary.current_step === 'cancelled') cancelledCount++

        // Count aid types and calculate per-beneficiary aid counts
        let aidCountForBeneficiary = 0
        if (beneficiary.type_of_aid && typeof beneficiary.type_of_aid === 'object') {
          for (const key in beneficiary.type_of_aid) {
            if (key.endsWith('_qty')) continue
            const val = beneficiary.type_of_aid[key]
            if (val === true) {
              // quantity if provided
              const qty = Number(beneficiary.type_of_aid[`${key}_qty`]) || 1
              aidCountForBeneficiary += qty

              const readableKey = key.replace(/_/g, ' ')
              aidTypes[readableKey] = (aidTypes[readableKey] || 0) + qty
            }
          }
        } else if (beneficiary.type_of_aid) {
          // if stored as string
          aidTypes[beneficiary.type_of_aid] = (aidTypes[beneficiary.type_of_aid] || 0) + 1
          aidCountForBeneficiary += 1
        }

        fitmentRequired += aidCountForBeneficiary
        // consider fitment done when beneficiary has after photo or is completed
        if (beneficiary.after_photo_url || beneficiary.current_step === 'completed') {
          fitmentDone += aidCountForBeneficiary
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
        extra_items_stats: extraItemsStats,
        fitment_required: fitmentRequired,
        fitment_done: fitmentDone,
        cancelled_count: cancelledCount,
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchBeneficiaries = useCallback(async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('beneficiaries')
        // 'status' column may not exist in the DB; select current_step instead and other known columns
        .select('id, name, reg_number, type_of_aid, before_photo_url, after_photo_url, current_step')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })

      if (error) throw error
      
      const beneficiaries = data || []
      setAllBeneficiaries(beneficiaries)
      calculateAidStats(beneficiaries)

    } catch (error: any) {
      console.error('Error fetching beneficiaries:', error)
      alert('Error loading beneficiaries: ' + error.message)
    }
  }, [])

  useEffect(() => {
    const eventId = localStorage.getItem('current_event')
    if (!eventId) {
      alert('Please select an event first')
      window.location.href = '/event-setup'
      return
    }
    fetchEvent(eventId)
    fetchSummary(eventId)
    fetchBeneficiaries(eventId)
  }, [fetchEvent, fetchSummary, fetchBeneficiaries])

  const calculateAidStats = (beneficiaries: Beneficiary[]) => {
    const stats: Record<string, number> = {};
    const aidKeyMap: Record<string, string> = {
      left_below_knee: 'Left Below Knee',
      left_above_knee: 'Left Above Knee',
      right_below_knee: 'Right Below Knee',
      right_above_knee: 'Right Above Knee',
      left_caliper: 'Left Caliper',
      right_caliper: 'Right Caliper',
      stick: 'Stick',
      crutches: 'Crutches',
      shoes: 'Shoes',
      above_hand: 'Above Hand',
      below_hand: 'Below Hand',
      gloves: 'Gloves',
      walker: 'Walker',
      elbow_crutches: 'Elbow Crutches',
      others: 'Others',
    };

    beneficiaries.forEach(b => {
      if (b.type_of_aid && typeof b.type_of_aid === 'object') {
        for (const key in b.type_of_aid) {
          const readableKey = aidKeyMap[key];
          if (readableKey && b.type_of_aid[key] === true) {
            if (key.endsWith('_qty')) continue; // Skip quantity fields

            let quantity = 1;
            if (b.type_of_aid[`${key}_qty`]) {
              quantity = Number(b.type_of_aid[`${key}_qty`]) || 1;
            }
            
            stats[readableKey] = (stats[readableKey] || 0) + quantity;
          }
        }
      }
    });
    setDetailedAidStats(stats);
  };

  const handleStatusChange = async (beneficiaryId: string, newStatus: string) => {
    try {
      // Update current_step instead of status (some schemas use current_step, status may not exist)
      const { error } = await supabase
        .from('beneficiaries')
        .update({ current_step: newStatus })
        .eq('id', beneficiaryId)

      if (error) throw error

      // Update local state (set both status and current_step locally so UI works regardless of schema)
      setAllBeneficiaries(prev => 
        prev.map(b => 
          b.id === beneficiaryId ? { ...b, status: newStatus, current_step: newStatus } : b
        )
      )

      // Re-fetch summary to update counts
      const eventId = localStorage.getItem('current_event')
      if (eventId) {
        fetchSummary(eventId)
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  // helper removed (not needed after refactor)

  if (loading) return <div className="text-center py-8 text-black">Loading summary...</div>
  if (!summary) return <div className="text-center py-8 text-black">No data available</div>

  const successRate = summary.total_beneficiaries > 0 ? Math.round((summary.completed_beneficiaries / summary.total_beneficiaries) * 100) : 0
  // const totalAidItems = Object.values(summary.aid_types).reduce((a, b) => a + b, 0)
  // const totalExtraItems = Object.values(summary.extra_items_stats).reduce((a, b) => a + b, 0)

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
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

        {/* Aid Distribution Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Aid Distribution Summary</h2>
          <div className="bg-gray-50 border rounded-lg p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Object.entries(detailedAidStats).map(([aid, count]) => (
                <div key={aid} className="text-center p-2 bg-white rounded shadow-sm">
                  <div className="text-2xl font-bold text-gray-800">{count}</div>
                  <div className="text-sm text-gray-600 capitalize">{aid}</div>
                </div>
              ))}
            </div>
            <div className="text-right mt-4 font-semibold text-gray-700">
              Total Items Distributed: {Object.values(detailedAidStats).reduce((acc, count) => acc + count, 0)}
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Beneficiary Journey Progress</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-gray-800 mb-1">{summary.total_beneficiaries}</div>
              <div className="text-sm text-gray-600">Total Registered</div>
            </div>

            <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-gray-800 mb-1">{summary.fitment_required}</div>
              <div className="text-sm text-gray-600">Total Fitments Required</div>
              <div className="text-xs text-gray-500 mt-1">Done (after photo): {summary.fitment_done}</div>
            </div>

            <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-blue-600 mb-1">{summary.before_photo_count}</div>
              <div className="text-sm text-gray-600">Before Photos Taken</div>
            </div>

            <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-purple-600 mb-1">{summary.measurement_count}</div>
              <div className="text-sm text-gray-600">Total Measurement</div>
            </div>

            <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-orange-600 mb-1">{summary.fitment_count}</div>
              <div className="text-sm text-gray-600">Total Fitment (in progress)</div>
            </div>

            <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-red-600 mb-1">{summary.after_photo_count}</div>
              <div className="text-sm text-gray-600">After Photos Taken</div>
            </div>

            <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-red-700 mb-1">{summary.cancelled_count}</div>
              <div className="text-sm text-gray-600">Cancelled Beneficiaries</div>
            </div>
          </div>
        </div>

        {/* Beneficiaries Table */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Beneficiaries List</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reg #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aid Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allBeneficiaries.map((beneficiary) => (
                  <tr key={beneficiary.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{beneficiary.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{beneficiary.reg_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {beneficiary.type_of_aid && typeof beneficiary.type_of_aid === 'object' ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(beneficiary.type_of_aid).filter(([key]) => !key.endsWith('_qty')).map(([key, value]) => {
                            if (value === true) {
                              return <span key={key} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{key.replace(/_/g, ' ')}</span>;
                            }
                            return null;
                          })}
                        </div>
                      ) : (
                        beneficiary.type_of_aid
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const displayStatus = beneficiary.status ?? beneficiary.current_step ?? 'registered'
                        const isCancelled = displayStatus === 'cancelled'
                        return (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isCancelled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {displayStatus}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                                    {beneficiary.before_photo_url ? (
                                      <a href={beneficiary.before_photo_url} target="_blank" rel="noopener noreferrer">
                                        <Image src={beneficiary.before_photo_url} alt="before" width={64} height={64} className="rounded border object-cover" />
                                      </a>
                                    ) : (
                                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">No</div>
                                    )}

                          {beneficiary.after_photo_url ? (
                            <a href={beneficiary.after_photo_url} target="_blank" rel="noopener noreferrer">
                              <Image src={beneficiary.after_photo_url} alt="after" width={64} height={64} className="rounded border object-cover" />
                            </a>
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">No</div>
                          )}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/edit-beneficiary/${beneficiary.id}`} className="text-indigo-600 hover:text-indigo-900 mr-3">
                        Edit
                      </Link>
                      <button
                        onClick={() => {
                          const current = beneficiary.status ?? beneficiary.current_step ?? 'registered'
                          handleStatusChange(beneficiary.id, current === 'cancelled' ? 'registered' : 'cancelled')
                        }}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        {(beneficiary.status ?? beneficiary.current_step) === 'cancelled' ? 'Re-register' : 'Cancel'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
              {successRate}%
            </div>
            <div className="text-sm text-orange-800">Success Rate</div>
          </div>
        </div>
      </div>
    </div>
  )
}