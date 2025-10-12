'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestConnection() {
  const [status, setStatus] = useState('Testing...')

  useEffect(() => {
    async function testConnection() {
      try {
        // Test database connection
        const { data, error } = await supabase
          .from('beneficiaries')
          .select('count')
          .limit(1)

        if (error) throw error
        
        // Test storage connection
        const { data: storageData, error: storageError } = await supabase
          .storage
          .from('photos')
          .list()

        if (storageError) throw storageError

        setStatus('✅ All connections successful!')
      } catch (error) {
        console.error('Connection test failed:', error)
        setStatus('❌ Connection failed: ' + error)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      <p>{status}</p>
    </div>
  )
}