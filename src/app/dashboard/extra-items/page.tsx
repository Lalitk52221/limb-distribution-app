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
  extra_items?: any[]
}

interface ExtraItem {
  item: string
  quantity: number
}

const EXTRA_ITEMS = [
  { id: 'stick', name: 'Walking Stick', emoji: '🦯' },
  { id: 'shoes', name: 'Shoes', emoji: '👟' },
  { id: 'crutches', name: 'Crutches', emoji: '🩼' },
  { id: 'walker', name: 'Walker', emoji: '🚶' },
  { id: 'elbow_stick', name: 'Elbow Stick', emoji: '🦾' },
]

export default function ExtraItemsPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [volunteerName, setVolunteerName] = useState('')
  const [selectedItems, setSelectedItems] = useState<Record<string, ExtraItem[]>>({})

  useEffect(() => {
    fetchBeneficiaries()
  }, [])

  const fetchBeneficiaries = async () => {
    try {
      const { data, error } = await supabase
        .from('beneficiaries')
        .select('*')
        .eq('current_step', 'extra_items')
        .order('created_at', { ascending: true })

      if (error) throw error
      setBeneficiaries(data || [])
      
      // Initialize selected items from existing data
      const initialSelected: Record<string, ExtraItem[]> = {}
      data?.forEach(b => {
        initialSelected[b.id] = b.extra_items || []
      })
      setSelectedItems(initialSelected)
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error loading beneficiaries: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleItem = (beneficiaryId: string, itemId: string) => {
    setSelectedItems(prev => {
      const currentItems = prev[beneficiaryId] || []
      const existingIndex = currentItems.findIndex(i => i.item === itemId)
      
      if (existingIndex >= 0) {
        // Remove item
        return {
          ...prev,
          [beneficiaryId]: currentItems.filter(i => i.item !== itemId)
        }
      } else {
        // Add item with quantity 1
        return {
          ...prev,
          [beneficiaryId]: [...currentItems, { item: itemId, quantity: 1 }]
        }
      }
    })
  }

  const updateQuantity = (beneficiaryId: string, itemId: string, quantity: number) => {
    if (quantity < 1) return
    
    setSelectedItems(prev => {
      const currentItems = prev[beneficiaryId] || []
      const existingIndex = currentItems.findIndex(i => i.item === itemId)
      
      if (existingIndex >= 0) {
        const updatedItems = [...currentItems]
        updatedItems[existingIndex] = { ...updatedItems[existingIndex], quantity }
        return { ...prev, [beneficiaryId]: updatedItems }
      }
      return prev
    })
  }

  const submitItems = async (beneficiaryId: string) => {
    if (!volunteerName.trim()) {
      alert('Please enter your volunteer name')
      return
    }

    setUpdating(beneficiaryId)
    try {
      const beneficiary = beneficiaries.find(b => b.id === beneficiaryId)
      const items = selectedItems[beneficiaryId] || []

      const { error } = await supabase
        .from('beneficiaries')
        .update({
          extra_items: items,
          current_step: 'after_photo',
          completed_steps: [...(beneficiary?.completed_steps || []), 'extra_items'],
          step_volunteers: {
            ...(beneficiary?.step_volunteers || {}),
            extra_items: volunteerName
          }
        })
        .eq('id', beneficiaryId)

      if (error) throw error

      // Remove from local list
      setBeneficiaries(prev => prev.filter(b => b.id !== beneficiaryId))
      alert('Extra items recorded! Moved to Step 6: After Photography')
      
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error updating items: ' + error.message)
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg mr-4">
            5
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Extra Items Distribution</h1>
            <p className="text-gray-600">Step 5: Provide additional support items</p>
          </div>
        </div>

        {/* Volunteer Name */}
        <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Volunteer Name *
          </label>
          <input
            type="text"
            value={volunteerName}
            onChange={(e) => setVolunteerName(e.target.value)}
            placeholder="Enter your name as volunteer"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {beneficiaries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No beneficiaries waiting for extra items distribution.
          </div>
        ) : (
          <div className="space-y-6">
            {beneficiaries.map((beneficiary) => (
              <div key={beneficiary.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{beneficiary.name}</h3>
                    <p className="text-gray-600">Reg: {beneficiary.reg_number}</p>
                    <p className="text-sm text-gray-500">Main Aid: {beneficiary.type_of_aid}</p>
                  </div>
                  <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm">
                    Select Items
                  </span>
                </div>
                
                {/* Available Items */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-3">Select Items to Provide:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {EXTRA_ITEMS.map((item) => {
                      const isSelected = selectedItems[beneficiary.id]?.some(i => i.item === item.id)
                      const selectedItem = selectedItems[beneficiary.id]?.find(i => i.item === item.id)
                      
                      return (
                        <div key={item.id} className="border rounded-lg p-3">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleItem(beneficiary.id, item.id)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-2xl">{item.emoji}</span>
                            <span className="flex-1 text-sm font-medium">{item.name}</span>
                          </label>
                          
                          {isSelected && (
                            <div className="mt-2 flex items-center space-x-2">
                              <span className="text-xs text-gray-600">Qty:</span>
                              <button
                                onClick={() => updateQuantity(beneficiary.id, item.id, (selectedItem?.quantity || 1) - 1)}
                                className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm"
                              >
                                -
                              </button>
                              <span className="text-sm font-medium">{selectedItem?.quantity || 1}</span>
                              <button
                                onClick={() => updateQuantity(beneficiary.id, item.id, (selectedItem?.quantity || 1) + 1)}
                                className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Selected Items Summary */}
                {(selectedItems[beneficiary.id]?.length || 0) > 0 && (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Items to be provided:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedItems[beneficiary.id]?.map((item) => (
                        <span key={item.item} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                          {EXTRA_ITEMS.find(i => i.id === item.item)?.emoji} {EXTRA_ITEMS.find(i => i.id === item.item)?.name} 
                          {item.quantity > 1 && ` (${item.quantity})`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => submitItems(beneficiary.id)}
                  disabled={updating === beneficiary.id}
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating === beneficiary.id ? 'Updating...' : 'Confirm Items & Move to Step 6'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}