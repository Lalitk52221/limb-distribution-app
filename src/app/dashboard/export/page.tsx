'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Beneficiary } from '@/types'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export default function ExportPage() {
  const [exporting, setExporting] = useState(false)
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  const exportToExcel = async () => {
    setExporting(true)
    try {
      const supabase = createClient()
      
      let query = supabase
        .from('beneficiaries')
        .select('*')
        .order('camp_date', { ascending: false })

      // Apply date filter if specified
      if (dateRange.start && dateRange.end) {
        query = query
          .gte('camp_date', dateRange.start)
          .lte('camp_date', dateRange.end)
      }

      const { data: beneficiaries, error } = await query

      if (error) throw error

      // Transform data for Excel
      const excelData = beneficiaries?.map(beneficiary => ({
        'Camp Date': beneficiary.camp_date,
        'Registration Number': beneficiary.reg_number,
        'Name': beneficiary.name,
        "Father's Name": beneficiary.father_name,
        'Date of Birth': beneficiary.date_of_birth,
        'Age': beneficiary.age,
        'Address': beneficiary.address,
        'State': beneficiary.state,
        'Phone Number': beneficiary.phone_number,
        'Aadhar Number': beneficiary.aadhar_number,
        'Type of Aid': beneficiary.type_of_aid,
        'Status': beneficiary.status,
        'Before Photo URL': beneficiary.before_photo_url,
        'After Photo URL': beneficiary.after_photo_url,
        'Registration Date': new Date(beneficiary.created_at).toLocaleDateString('en-IN')
      })) || []

      // Create workbook
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(excelData)
      
      // Set column widths
      const colWidths = [
        { wch: 12 }, // Camp Date
        { wch: 20 }, // Reg No
        { wch: 25 }, // Name
        { wch: 25 }, // Father Name
        { wch: 12 }, // DOB
        { wch: 5 },  // Age
        { wch: 40 }, // Address
        { wch: 15 }, // State
        { wch: 15 }, // Phone
        { wch: 15 }, // Aadhar
        { wch: 20 }, // Type of Aid
        { wch: 15 }, // Status
        { wch: 50 }, // Before Photo
        { wch: 50 }, // After Photo
        { wch: 15 }, // Reg Date
      ]
      worksheet['!cols'] = colWidths

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Beneficiaries')
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      // Download file
      const filename = `limb-distribution-${dateRange.start}-to-${dateRange.end}.xlsx`
      saveAs(blob, filename)

    } catch (error) {
      console.error('Export error:', error)
      alert('Error exporting data. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Export Data</h1>
        <p className="text-gray-600 mb-6">Generate Excel reports with beneficiary data</p>

        {/* Date Range Filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={exportToExcel}
              disabled={exporting}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {exporting ? 'Generating Excel...' : 'Export to Excel'}
            </button>
          </div>
        </div>

        {/* Export Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Exported Data Includes:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                Camp Date & Registration Number
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                Personal Details (Name, Father Name)
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                Date of Birth & Age
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                Complete Address & State
              </li>
            </ul>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                Contact Information
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                Aadhar Number
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                Type of Aid Provided
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                Photo URLs & Status
              </li>
            </ul>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">Instructions:</h4>
          <ul className="text-yellow-700 space-y-1 text-sm">
            <li>• Select date range to filter data (optional)</li>
            <li>• Click "Export to Excel" to generate report</li>
            <li>• Excel file will download automatically</li>
            <li>• Photos are included as clickable URLs in the Excel file</li>
            <li>• Data is sorted by camp date (newest first)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
)