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
  current_step: string
  extra_items?: any[]
}

interface ExtraItem {
  item: string
  quantity: number
  name: string
  emoji: string
}

const AVAILABLE_ITEMS: ExtraItem[] = [
  { item: 'stick', name: 'Walking Stick', emoji: '🦯', quantity: 0 },
  { item: 'shoes', name: 'Shoes', emoji: '👟', quantity: 0 },
  { item: 'crutches', name: 'Crutches', emoji: '🩼', quantity: 0 },
  { item: 'walker', name: 'Walker', emoji: '🚶', quantity: 0 },
  { item: 'elbow_stick', name: 'Elbow Crutches', emoji: '🦾', quantity: 0 },
]

export default function ExtraItemsPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [currentEvent, setCurrentEvent] = useState<any>(null)
  const [selectedItems, setSelectedItems] = useState<Record<string, ExtraItem[]>>({})

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
        .eq('current_step', 'extra_items')
        .order('created_at', { ascending: true })

      if (error) throw error
      setBeneficiaries(data || [])
      
      // Initialize selected items from existing data
      const initialSelected: Record<string, ExtraItem[]> = {}
      data?.forEach(b => {
        if (b.extra_items && b.extra_items.length > 0) {
          // Convert stored items to our format
          initialSelected[b.id] = b.extra_items.map((item: any) => ({
            ...AVAILABLE_ITEMS.find(ai => ai.item === item.item) || { name: item.item, emoji: '📦' },
            quantity: item.quantity || 1
          }))
        } else {
          initialSelected[b.id] = []
        }
      })
      setSelectedItems(initialSelected)
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error loading beneficiaries: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateItemQuantity = (beneficiaryId: string, itemId: string, quantity: number) => {
    if (quantity < 0) return
    
    setSelectedItems(prev => {
      const currentItems = prev[beneficiaryId] || []
      const existingIndex = currentItems.findIndex(i => i.item === itemId)
      
      if (existingIndex >= 0) {
        if (quantity === 0) {
          // Remove item if quantity is 0
          return {
            ...prev,
            [beneficiaryId]: currentItems.filter(i => i.item !== itemId)
          }
        } else {
          // Update quantity
          const updatedItems = [...currentItems]
          updatedItems[existingIndex] = { ...updatedItems[existingIndex], quantity }
          return { ...prev, [beneficiaryId]: updatedItems }
        }
      } else if (quantity > 0) {
        // Add new item
        const newItem = AVAILABLE_ITEMS.find(item => item.item === itemId)
        if (newItem) {
          return {
            ...prev,
            [beneficiaryId]: [...currentItems, { ...newItem, quantity }]
          }
        }
      }
      return prev
    })
  }

  const getItemQuantity = (beneficiaryId: string, itemId: string): number => {
    return selectedItems[beneficiaryId]?.find(item => item.item === itemId)?.quantity || 0
  }

  const getTotalItemsCount = (beneficiaryId: string): number => {
    return selectedItems[beneficiaryId]?.reduce((total, item) => total + item.quantity, 0) || 0
  }

  const submitExtraItems = async (beneficiaryId: string) => {
    const items = selectedItems[beneficiaryId] || []
    
    if (items.length === 0) {
      if (!confirm('No items selected. Are you sure you want to mark this as completed without distributing any items?')) {
        return
      }
    }

    setUpdating(beneficiaryId)
    try {
      const { error } = await supabase
        .from('beneficiaries')
        .update({
          current_step: 'after_photo',
          extra_items: items
        })
        .eq('id', beneficiaryId)

      if (error) throw error

      // Remove from local list
      setBeneficiaries(prev => prev.filter(b => b.id !== beneficiaryId))
      
      if (items.length > 0) {
        const itemList = items.map(item => `${item.quantity} ${item.name}`).join(', ')
        alert(`Extra items recorded: ${itemList}. Moved to Step 6: After Photography`)
      } else {
        alert('No items distributed. Moved to Step 6: After Photography')
      }
      
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error updating items: ' + error.message)
    } finally {
      setUpdating(null)
    }
  }

  const revertToPreviousStep = async (beneficiaryId: string) => {
    if (!confirm('Are you sure you want to send this beneficiary back to Fitment step? All item selections will be lost.')) {
      return
    }

    setUpdating(beneficiaryId)
    try {
      const { error } = await supabase
        .from('beneficiaries')
        .update({
          current_step: 'fitment',
          extra_items: null
        })
        .eq('id', beneficiaryId)

      if (error) throw error

      // Remove from local list
      setBeneficiaries(prev => prev.filter(b => b.id !== beneficiaryId))
      alert('Beneficiary sent back to Fitment step')
      
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
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg mr-4">
            5
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Extra Items Distribution</h1>
            <p className="text-gray-600">Step 5: Track items distributed to each beneficiary</p>
            {currentEvent && (
              <p className="text-sm text-gray-500 mt-1">
                Event: {currentEvent.event_name} | {new Date(currentEvent.event_date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {beneficiaries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No beneficiaries waiting for extra items.
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
                    
                    <div className="mt-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                        🎁 Select Items to Distribute
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Items Selection */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-3">Select Items and Quantities:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {AVAILABLE_ITEMS.map((item) => {
                      const quantity = getItemQuantity(beneficiary.id, item.item)
                      
                      return (
                        <div key={item.item} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{item.emoji}</span>
                              <div>
                                <div className="font-medium text-gray-900">{item.name}</div>
                                <div className="text-sm text-gray-500">Available in stock</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateItemQuantity(beneficiary.id, item.item, quantity - 1)}
                                disabled={quantity === 0}
                                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-medium text-gray-900">
                                {quantity}
                              </span>
                              <button
                                onClick={() => updateItemQuantity(beneficiary.id, item.item, quantity + 1)}
                                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          
                          {quantity > 0 && (
                            <div className="mt-2 text-sm text-green-600 font-medium">
                              ✅ Will receive {quantity} {item.name}{quantity > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Selected Items Summary */}
                {(selectedItems[beneficiary.id]?.length || 0) > 0 && (
                  <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2 flex items-center">
                      📦 Items to be Distributed:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedItems[beneficiary.id]?.map((item) => (
                        <span key={item.item} className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2">
                          <span>{item.emoji}</span>
                          <span>{item.quantity} × {item.name}</span>
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 text-sm text-green-700">
                      <strong>Total items:</strong> {getTotalItemsCount(beneficiary.id)} items
                    </div>
                  </div>
                )}

                {/* No Items Selected Warning */}
                {(selectedItems[beneficiary.id]?.length || 0) === 0 && (
                  <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                      ⚠️ No Items Selected
                    </h4>
                    <p className="text-yellow-700 text-sm">
                      If this beneficiary doesn&apos;t need any extra items, you can proceed without selecting any.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => submitExtraItems(beneficiary.id)}
                    disabled={updating === beneficiary.id}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
                  >
                    {updating === beneficiary.id ? (
                      <>⏳ Saving Items...</>
                    ) : (
                      <>✅ Confirm Items & Move to Next Step</>
                    )}
                  </button>

                  <button
                    onClick={() => revertToPreviousStep(beneficiary.id)}
                    disabled={updating === beneficiary.id}
                    className="px-4 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
                    title="Send back to Fitment step"
                  >
                    ↩️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Extra Items Distribution</h3>
              <p className="text-blue-700 text-sm">
                {beneficiaries.length} {beneficiaries.length === 1 ? 'person' : 'people'} waiting for items
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{beneficiaries.length}</div>
              <div className="text-sm text-blue-800">Pending Distribution</div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-purple-50 rounded-lg">
          <h4 className="font-semibold text-purple-900 mb-2">📋 Instructions:</h4>
          <ul className="text-purple-700 text-sm space-y-1">
            <li>• Use <strong>+</strong> and <strong>-</strong> buttons to set quantities for each item</li>
            <li>• Set quantity to <strong>0</strong> to remove an item</li>
            <li>• You can distribute multiple items to each person</li>
            <li>• If no items are needed, you can proceed without selecting any</li>
            <li>• Click &quot;Confirm Items&quot; to save and move to final photo step</li>
          </ul>
        </div>
        <div className="flex justify-end mt-6">
                        <button className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium w-1/3 ">
                              <Link href="/dashboard/after-photo">Move to After Photo</Link>
                            </button>
                            </div>
      </div>
    </div>
  )
}