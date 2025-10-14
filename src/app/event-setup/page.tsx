
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function EventSetupPage() {
  const router = useRouter()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    event_name: '',
    event_date: new Date().toISOString().split('T')[0],
    location: ''
  })

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false })

      if (error) throw error
      setEvents(data || [])
    } catch (error: any) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingEventId) {
      await updateEvent()
    } else {
      await createEvent()
    }
  }

  const createEvent = async () => {
    setCreating(true)
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([formData])
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        localStorage.setItem('current_event', data[0].id)
        alert('Event created successfully! Redirecting to registration...')
        router.push('/dashboard/registration')
      } else {
        alert('Event created, but could not find event ID for redirect.')
      }

      resetForm()
      fetchEvents()
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error creating event: ' + error.message)
    } finally {
      setCreating(false)
    }
  }

  const updateEvent = async () => {
    if (!editingEventId) return
    setCreating(true)
    try {
      const { error } = await supabase
        .from('events')
        .update(formData)
        .eq('id', editingEventId)

      if (error) throw error

      alert('Event updated successfully!')
      resetForm()
      fetchEvents()
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error updating event: ' + error.message)
    } finally {
      setCreating(false)
      setEditingEventId(null)
    }
  }

  const deleteEvent = async (eventId: string) => {
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', eventId)

        if (error) throw error

        alert('Event deleted successfully.')
        fetchEvents()
      } catch (error: any) {
        console.error('Error:', error)
        alert('Error deleting event: ' + error.message)
      }
    }
  }

  const handleEditClick = (event: any) => {
    setEditingEventId(event.id)
    setFormData({
      event_name: event.event_name,
      event_date: new Date(event.event_date).toISOString().split('T')[0],
      location: event.location
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => {
    setFormData({
      event_name: '',
      event_date: new Date().toISOString().split('T')[0],
      location: ''
    })
    setEditingEventId(null)
  }

  const startRegistration = (eventId: string) => {
    localStorage.setItem('current_event', eventId)
    router.push('/dashboard/registration')
  }

  if (loading) return <div className="text-center py-8 text-black">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Camp Event Setup</h1>
        <p className="text-gray-600 mb-8">Create and manage your limb distribution events</p>

        {/* Create/Update Event Form */}
        <div className="mb-8 p-6 border border-gray-200 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingEventId ? 'Edit Event' : 'Create New Event'}
          </h2>
          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Name *
              </label>
              <input
                type="text"
                required
                value={formData.event_name}
                onChange={(e) => setFormData({...formData, event_name: e.target.value})}
                placeholder="e.g., Annual Limb Distribution Camp 2024"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Date *
              </label>
              <input
                type="date"
                required
                value={formData.event_date}
                onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="e.g., Community Health Center, Main Hall"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-4">
              <button
                type="submit"
                disabled={creating}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {creating 
                  ? (editingEventId ? 'Updating...' : 'Creating...') 
                  : (editingEventId ? 'Update Event' : 'Create Event')}
              </button>
              {editingEventId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Existing Events */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Existing Events</h2>
          {events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No events created yet. Create your first event above.
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{event.event_name}</h3>
                      <p className="text-gray-600">
                        Date: {new Date(event.event_date).toLocaleDateString()} | 
                        Location: {event.location}
                      </p>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(event.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleEditClick(event)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium text-sm"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => startRegistration(event.id)}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium"
                      >
                        Start Registration
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}