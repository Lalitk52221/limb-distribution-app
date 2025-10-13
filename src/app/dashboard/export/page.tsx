/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { saveAs } from 'file-saver'

interface Beneficiary {
  id: string
  reg_number: string
  name: string
  father_name?: string
  date_of_birth?: string
  age?: number
  address?: string
  state?: string
  phone_number?: string
  aadhar_number?: string
  type_of_aid: string
  before_photo_url?: string
  after_photo_url?: string
  current_step: string
  extra_items?: any[]
  created_at: string
  camp_date: string
}

// Function to load ExcelJS dynamically
const loadExcelJS = async () => {
  const ExcelJS = (await import('exceljs')).default
  return ExcelJS
}

// Function to download image as Uint8Array
const downloadImage = async (url: string): Promise<Uint8Array | null> => {
  try {
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    return new Uint8Array(arrayBuffer)
  } catch (error) {
    console.error('Error downloading image:', error)
    return null
  }
}

// ========== EXCEL WITH EMBEDDED PHOTOS ==========
const createExcelWithEmbeddedImages = async (beneficiaries: Beneficiary[], currentEvent: any) => {
  const ExcelJS = await loadExcelJS()
  const workbook = new ExcelJS.Workbook()
  
  // Add main data worksheet
  const worksheet = workbook.addWorksheet('Beneficiaries')
  
  // Set column headers
  worksheet.columns = [
    { header: 'Registration Number', key: 'reg_number', width: 20 },
    { header: 'Camp Date', key: 'camp_date', width: 12 },
    { header: 'Name', key: 'name', width: 25 },
    { header: "Father's Name", key: 'father_name', width: 25 },
    { header: 'Age', key: 'age', width: 8 },
    { header: 'Address', key: 'address', width: 40 },
    { header: 'State', key: 'state', width: 15 },
    { header: 'Phone Number', key: 'phone_number', width: 15 },
    { header: 'Aadhar Number', key: 'aadhar_number', width: 15 },
    { header: 'Type of Aid', key: 'type_of_aid', width: 20 },
    { header: 'Current Status', key: 'current_step', width: 15 },
    { header: 'Extra Items', key: 'extra_items', width: 30 },
    { header: 'Before Photo', key: 'before_photo', width: 20 },
    { header: 'After Photo', key: 'after_photo', width: 20 },
    { header: 'Registration Date', key: 'created_at', width: 15 }
  ]

  // Style the header row
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } }
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '4472C4' }
  }

  // Add data rows with images
  for (let i = 0; i < beneficiaries.length; i++) {
    const beneficiary = beneficiaries[i]
    const rowNumber = i + 2
    
    // Add the main data
    const row = worksheet.addRow({
      reg_number: beneficiary.reg_number,
      camp_date: beneficiary.camp_date,
      name: beneficiary.name,
      father_name: beneficiary.father_name || '',
      age: beneficiary.age || '',
      address: beneficiary.address || '',
      state: beneficiary.state || '',
      phone_number: beneficiary.phone_number || '',
      aadhar_number: beneficiary.aadhar_number || '',
      type_of_aid: beneficiary.type_of_aid,
      current_step: beneficiary.current_step,
      extra_items: getExtraItemsText(beneficiary.extra_items || []),
      before_photo: beneficiary.before_photo_url ? '✅' : '❌',
      after_photo: beneficiary.after_photo_url ? '✅' : '❌',
      created_at: new Date(beneficiary.created_at).toLocaleDateString('en-IN')
    })

    // Set row height to accommodate images
    row.height = 120

    // Add before photo if available
    if (beneficiary.before_photo_url) {
      try {
        const imageBuffer = await downloadImage(beneficiary.before_photo_url)
        if (imageBuffer) {
          const imageId = workbook.addImage({
            buffer: imageBuffer as any,
            extension: 'jpeg'
          })
          worksheet.addImage(imageId, {
            tl: { col: 12, row: rowNumber - 1 },
            br: { col: 13, row: rowNumber },
            editAs: 'oneCell'
          } as any)
        }
      } catch (error) {
        console.error('Error adding before photo:', error)
      }
    }

    // Add after photo if available
    if (beneficiary.after_photo_url) {
      try {
        const imageBuffer = await downloadImage(beneficiary.after_photo_url)
        if (imageBuffer) {
          const imageId = workbook.addImage({
            buffer: imageBuffer as any,
            extension: 'jpeg'
          })
          worksheet.addImage(imageId, {
            tl: { col: 13, row: rowNumber - 1 },
            br: { col: 14, row: rowNumber },
            editAs: 'oneCell'
          } as any)
        }
      } catch (error) {
        console.error('Error adding after photo:', error)
      }
    }

    // Add alternating row colors for better readability
    if (rowNumber % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F0F0F0' }
      }
    }
  }

  // Add summary worksheet
  const summaryWorksheet = workbook.addWorksheet('Summary')
  
  const total = beneficiaries.length
  const completed = beneficiaries.filter(b => b.current_step === 'completed').length
  const withBeforePhotos = beneficiaries.filter(b => b.before_photo_url).length
  const withAfterPhotos = beneficiaries.filter(b => b.after_photo_url).length
  
  // Calculate statistics
  const aidTypes: Record<string, number> = {}
  const extraItems: Record<string, number> = {}
  
  beneficiaries.forEach(b => {
    aidTypes[b.type_of_aid] = (aidTypes[b.type_of_aid] || 0) + 1
    if (b.extra_items) {
      b.extra_items.forEach((item: any) => {
        const itemName = item.name || item.item
        extraItems[itemName] = (extraItems[itemName] || 0) + (item.quantity || 1)
      })
    }
  })

  // Add summary data
  summaryWorksheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 }
  ]

  const summaryRows = [
    { metric: 'Event Name', value: currentEvent?.event_name || 'N/A' },
    { metric: 'Event Date', value: currentEvent?.event_date ? new Date(currentEvent.event_date).toLocaleDateString() : 'N/A' },
    { metric: 'Location', value: currentEvent?.location || 'N/A' },
    { metric: '' },
    { metric: 'OVERVIEW STATISTICS' },
    { metric: 'Total Beneficiaries', value: total },
    { metric: 'Completed Processes', value: completed },
    { metric: 'Completion Rate', value: total > 0 ? `${Math.round((completed / total) * 100)}%` : '0%' },
    { metric: 'With Before Photos', value: withBeforePhotos },
    { metric: 'With After Photos', value: withAfterPhotos },
    { metric: 'Photo Completion Rate', value: total > 0 ? `${Math.round((withAfterPhotos / total) * 100)}%` : '0%' },
    { metric: '' },
    { metric: 'AID TYPE DISTRIBUTION' }
  ]

  // Add aid types
  Object.entries(aidTypes).forEach(([type, count]) => {
    summaryRows.push({ metric: type, value: count })
  })

  summaryRows.push(
    { metric: '' },
    { metric: 'EXTRA ITEMS DISTRIBUTION' }
  )

  // Add extra items
  Object.entries(extraItems).forEach(([item, quantity]) => {
    summaryRows.push({ metric: item, value: quantity })
  })

  summaryRows.push(
    { metric: '' },
    { metric: 'WORKFLOW STATUS' },
    { metric: 'Registered', value: beneficiaries.filter(b => b.current_step === 'registration').length },
    { metric: 'Before Photo', value: beneficiaries.filter(b => b.current_step === 'before_photo').length },
    { metric: 'Measurement', value: beneficiaries.filter(b => b.current_step === 'measurement').length },
    { metric: 'Fitment', value: beneficiaries.filter(b => b.current_step === 'fitment').length },
    { metric: 'Extra Items', value: beneficiaries.filter(b => b.current_step === 'extra_items').length },
    { metric: 'After Photo', value: beneficiaries.filter(b => b.current_step === 'after_photo').length },
    { metric: 'Completed', value: completed }
  )

  summaryWorksheet.addRows(summaryRows)

  // Style summary header
  summaryWorksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } }
  summaryWorksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '4472C4' }
  }

  // Style section headers
  summaryRows.forEach((row, index) => {
    if (row.metric && row.metric.toUpperCase() === row.metric && row.metric !== '') {
      const rowNum = index + 1
      summaryWorksheet.getRow(rowNum).font = { bold: true, color: { argb: 'FFFFFF' } }
      summaryWorksheet.getRow(rowNum).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '70AD47' }
      }
    }
  })

  return workbook
}

// ========== HTML REPORT WITH EMBEDDED PHOTOS ==========
const createHTMLReportWithImages = async (beneficiaries: Beneficiary[], currentEvent: any) => {
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Camp Report - ${currentEvent?.event_name || 'Limb Distribution Camp'}</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
            }
            .container { 
                max-width: 1200px; 
                margin: 0 auto; 
                background: white; 
                border-radius: 15px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.2); 
                overflow: hidden;
            }
            .header { 
                background: linear-gradient(135deg, #2c3e50, #34495e);
                color: white; 
                padding: 30px; 
                text-align: center; 
            }
            .header h1 { 
                margin: 0; 
                font-size: 2.5em; 
                font-weight: 300;
            }
            .header h2 { 
                margin: 10px 0 0 0; 
                font-size: 1.3em; 
                font-weight: 300;
                opacity: 0.9;
            }
            .content { 
                padding: 30px; 
            }
            .beneficiary { 
                margin-bottom: 40px; 
                border: 1px solid #e1e8ed; 
                border-radius: 10px; 
                padding: 25px; 
                page-break-inside: avoid; 
                background: #fafbfc;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            .beneficiary:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            .beneficiary h3 { 
                color: #2c3e50; 
                margin-top: 0; 
                border-bottom: 2px solid #3498db; 
                padding-bottom: 10px;
                font-size: 1.4em;
            }
            .photos { 
                display: flex; 
                gap: 30px; 
                margin-top: 20px; 
                flex-wrap: wrap;
            }
            .photo-container { 
                text-align: center; 
                flex: 1;
                min-width: 300px;
            }
            .photo { 
                max-width: 100%; 
                max-height: 400px; 
                border: 3px solid #bdc3c7; 
                border-radius: 10px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                transition: transform 0.3s;
            }
            .photo:hover {
                transform: scale(1.02);
            }
            .photo-label { 
                font-weight: bold; 
                margin-bottom: 10px; 
                color: #34495e;
                font-size: 1.1em;
            }
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 20px; 
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            th, td { 
                border: 1px solid #ddd; 
                padding: 12px 15px; 
                text-align: left; 
            }
            th { 
                background: linear-gradient(135deg, #3498db, #2980b9); 
                color: white; 
                font-weight: 600;
            }
            tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            tr:hover {
                background-color: #e8f4fc;
            }
            .summary { 
                margin-bottom: 40px; 
                background: linear-gradient(135deg, #ecf0f1, #bdc3c7);
                padding: 25px;
                border-radius: 10px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            .summary h3 {
                color: #2c3e50;
                margin-top: 0;
                font-size: 1.5em;
            }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 20px;
            }
            .stat-card {
                background: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .stat-number {
                font-size: 2em;
                font-weight: bold;
                color: #2c3e50;
                display: block;
            }
            .stat-label {
                color: #7f8c8d;
                font-size: 0.9em;
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding: 20px;
                background: #34495e;
                color: white;
                border-radius: 0 0 15px 15px;
            }
            @media print {
                body { background: white; }
                .container { box-shadow: none; border: 1px solid #ddd; }
                .beneficiary { break-inside: avoid; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏥 Artificial Limb Distribution Camp</h1>
                <h2>Comprehensive Beneficiary Report</h2>
                <p style="margin-top: 10px; opacity: 0.8;">
                    ${currentEvent?.event_name || 'Camp Report'} | 
                    ${currentEvent?.event_date ? new Date(currentEvent.event_date).toLocaleDateString() : 'N/A'} | 
                    ${currentEvent?.location || 'N/A'}
                </p>
            </div>
            <div class="content">
  `

  // Add summary section
  const total = beneficiaries.length
  const completed = beneficiaries.filter(b => b.current_step === 'completed').length
  const withBeforePhotos = beneficiaries.filter(b => b.before_photo_url).length
  const withAfterPhotos = beneficiaries.filter(b => b.after_photo_url).length

  htmlContent += `
        <div class="summary">
            <h3>📊 Camp Summary & Statistics</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-number">${total}</span>
                    <span class="stat-label">Total Beneficiaries</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${completed}</span>
                    <span class="stat-label">Completed Processes</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${withBeforePhotos}</span>
                    <span class="stat-label">Before Photos</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${withAfterPhotos}</span>
                    <span class="stat-label">After Photos</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${total > 0 ? Math.round((completed / total) * 100) : 0}%</span>
                    <span class="stat-label">Completion Rate</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${total > 0 ? Math.round((withAfterPhotos / total) * 100) : 0}%</span>
                    <span class="stat-label">Photo Completion</span>
                </div>
            </div>
        </div>
  `

  // Add beneficiary details with photos
  beneficiaries.forEach((beneficiary) => {
    const statusColor = beneficiary.current_step === 'completed' ? '#27ae60' : 
                       beneficiary.current_step === 'after_photo' ? '#e67e22' : '#3498db'
    
    htmlContent += `
        <div class="beneficiary">
            <h3>👤 ${beneficiary.name} <small style="color: #7f8c8d; font-size: 0.7em;">(${beneficiary.reg_number})</small></h3>
            <table>
                <tr>
                    <th>Information</th>
                    <th>Details</th>
                    <th>Additional Info</th>
                </tr>
                <tr>
                    <td><strong>Camp Date</strong></td>
                    <td>${beneficiary.camp_date}</td>
                    <td><strong>Father's Name</strong></td>
                    <td>${beneficiary.father_name || 'Not provided'}</td>
                </tr>
                <tr>
                    <td><strong>Age</strong></td>
                    <td>${beneficiary.age || 'Not provided'}</td>
                    <td><strong>State</strong></td>
                    <td>${beneficiary.state || 'Not provided'}</td>
                </tr>
                <tr>
                    <td><strong>Phone</strong></td>
                    <td>${beneficiary.phone_number || 'Not provided'}</td>
                    <td><strong>Aadhar</strong></td>
                    <td>${beneficiary.aadhar_number || 'Not provided'}</td>
                </tr>
                <tr>
                    <td><strong>Type of Aid</strong></td>
                    <td>${beneficiary.type_of_aid}</td>
                    <td><strong>Current Status</strong></td>
                    <td style="color: ${statusColor}; font-weight: bold;">${beneficiary.current_step.replace('_', ' ').toUpperCase()}</td>
                </tr>
                <tr>
                    <td><strong>Extra Items</strong></td>
                    <td colspan="3">${getExtraItemsText(beneficiary.extra_items || [])}</td>
                </tr>
                <tr>
                    <td><strong>Address</strong></td>
                    <td colspan="3">${beneficiary.address || 'Not provided'}</td>
                </tr>
            </table>
            <div class="photos">
                <div class="photo-container">
                    <div class="photo-label">📷 Before Photo</div>
                    ${beneficiary.before_photo_url 
                      ? `<img class="photo" src="${beneficiary.before_photo_url}" alt="Before Photo - ${beneficiary.name}" onerror="this.style.display='none'" />`
                      : '<div style="padding: 40px; background: #ecf0f1; border-radius: 8px; color: #7f8c8d;">No before photo available</div>'
                    }
                </div>
                <div class="photo-container">
                    <div class="photo-label">✅ After Photo</div>
                    ${beneficiary.after_photo_url 
                      ? `<img class="photo" src="${beneficiary.after_photo_url}" alt="After Photo - ${beneficiary.name}" onerror="this.style.display='none'" />`
                      : '<div style="padding: 40px; background: #ecf0f1; border-radius: 8px; color: #7f8c8d;">No after photo available</div>'
                    }
                </div>
            </div>
        </div>
    `
  })

  htmlContent += `
            </div>
            <div class="footer">
                <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()} | Limb Distribution Camp Management System</p>
                <p style="opacity: 0.8; margin-top: 5px;">Transforming lives through artificial limb distribution 🙏</p>
            </div>
        </div>
    </body>
    </html>
  `

  return htmlContent
}

const getExtraItemsText = (extraItems: any[]) => {
  if (!extraItems || extraItems.length === 0) return 'No extra items provided'
  
  return extraItems
    .map((item: any) => {
      const itemName = item.name || item.item
      const quantity = item.quantity || 1
      const emoji = itemName === 'Walking Stick' ? '🦯' :
                   itemName === 'Shoes' ? '👟' :
                   itemName === 'Crutches' ? '🩼' :
                   itemName === 'Walker' ? '🚶' :
                   itemName === 'Elbow Crutches' ? '🦾' : '📦'
      return `${emoji} ${quantity} ${itemName}${quantity > 1 ? 's' : ''}`
    })
    .join(', ')
}

export default function ExportPage() {
  const [exporting, setExporting] = useState(false)
  const [currentEvent, setCurrentEvent] = useState<any>(null)
  const [exportType, setExportType] = useState<'excel' | 'html'>('excel')
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' })

  useEffect(() => {
    const eventId = localStorage.getItem('current_event')
    if (eventId) {
      fetchEvent(eventId)
    }
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

  const exportData = async () => {
    setExporting(true)
    setProgress({ current: 0, total: 0, message: 'Starting export...' })
    
    try {
      const eventId = localStorage.getItem('current_event')
      if (!eventId) {
        alert('Please select an event first')
        window.location.href = '/event-setup'
        return
      }

      setProgress({ current: 0, total: 0, message: 'Fetching beneficiary data...' })

      const { data: beneficiaries, error } = await supabase
        .from('beneficiaries')
        .select('*')
        .eq('event_id', eventId)

      if (error) throw error

      if (!beneficiaries || beneficiaries.length === 0) {
        alert('No data found to export')
        return
      }

      if (exportType === 'html') {
        // Generate HTML report with embedded images
        setProgress({ current: 0, total: 0, message: 'Generating HTML report...' })
        const htmlContent = await createHTMLReportWithImages(beneficiaries, currentEvent)
        const blob = new Blob([htmlContent], { type: 'text/html' })
        const eventName = currentEvent?.event_name ? currentEvent.event_name.replace(/[^a-zA-Z0-9]/g, '_') : 'camp'
        const filename = `${eventName}_report_${new Date().toISOString().split('T')[0]}.html`
        saveAs(blob, filename)
        setProgress({ current: 0, total: 0, message: 'HTML report generated!' })
      } else {
        // Generate Excel with embedded photos
        setProgress({ 
          current: 0, 
          total: beneficiaries.length * 2,
          message: `Processing ${beneficiaries.length} beneficiaries with photos...` 
        })
        
        const workbook = await createExcelWithEmbeddedImages(beneficiaries, currentEvent)

        setProgress({ current: 0, total: 0, message: 'Finalizing Excel file...' })

        // Save the workbook
        const buffer = await workbook.xlsx.writeBuffer()
        const blob = new Blob([buffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        })
        
        const eventName = currentEvent?.event_name ? currentEvent.event_name.replace(/[^a-zA-Z0-9]/g, '_') : 'camp'
        const filename = `${eventName}_with_photos_${new Date().toISOString().split('T')[0]}.xlsx`
        
        saveAs(blob, filename)
        setProgress({ current: 0, total: 0, message: 'Excel file generated!' })
      }

      setTimeout(() => {
        alert(`✅ ${exportType === 'html' ? 'HTML Report' : 'Excel File'} generated successfully!`)
      }, 500)

    } catch (error: any) {
      console.error('Export error:', error)
      alert('Error exporting data: ' + error.message)
    } finally {
      setExporting(false)
      setProgress({ current: 0, total: 0, message: '' })
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Export Reports with Photos</h1>
        <p className="text-gray-600 mb-8">Choose your preferred format for comprehensive camp reports</p>

        {currentEvent && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Current Event</h3>
            <p className="text-blue-800">
              <strong>{currentEvent.event_name}</strong> - {new Date(currentEvent.event_date).toLocaleDateString()} - {currentEvent.location}
            </p>
          </div>
        )}

        {/* Export Type Selection */}
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Export Format</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center p-4 border-2 border-blue-200 rounded-lg cursor-pointer hover:border-blue-500 bg-white transition-all duration-200">
              <input
                type="radio"
                name="exportType"
                value="excel"
                checked={exportType === 'excel'}
                onChange={(e) => setExportType(e.target.value as any)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <div className="font-medium text-gray-900 flex items-center">
                  📊 Excel with Embedded Photos
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Photos embedded directly in Excel cells. Perfect for data analysis.
                </div>
              </div>
            </label>

            <label className="flex items-center p-4 border-2 border-green-200 rounded-lg cursor-pointer hover:border-green-500 bg-white transition-all duration-200">
              <input
                type="radio"
                name="exportType"
                value="html"
                checked={exportType === 'html'}
                onChange={(e) => setExportType(e.target.value as any)}
                className="text-green-600 focus:ring-green-500"
              />
              <div className="ml-3">
                <div className="font-medium text-gray-900 flex items-center">
                  🎨 HTML Report with Photos
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Beautiful web report with embedded photos. Great for presentations.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Progress Indicator */}
        {exporting && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-yellow-800 font-medium">{progress.message}</span>
              {progress.total > 0 && (
                <span className="text-yellow-600 text-sm">
                  {progress.current}/{progress.total} photos
                </span>
              )}
            </div>
            {progress.total > 0 && (
              <div className="w-full bg-yellow-200 rounded-full h-3">
                <div 
                  className="bg-yellow-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                ></div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={exportData}
          disabled={exporting}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg mb-6 transition-all duration-200 transform hover:scale-[1.02]"
        >
          {exporting ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              {exportType === 'html' ? 'Generating HTML Report...' : 'Embedding Photos in Excel...'}
            </span>
          ) : (
            `📥 Export ${exportType === 'html' ? 'HTML Report' : 'Excel File'}`
          )}
        </button>

        {/* Features Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              📊 Excel Features
            </h3>
            <ul className="text-blue-800 text-sm space-y-2">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span><strong>Photos embedded in cells</strong> - Direct visual data</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Professional Excel formatting</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Data analysis ready</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Comprehensive summary sheet</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Works offline</span>
              </li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
              🎨 HTML Features
            </h3>
            <ul className="text-green-800 text-sm space-y-2">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span><strong>Beautiful visual design</strong> - Professional layout</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Before/after photos side by side</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Perfect for presentations</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Printable format</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Fast generation</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
          <h4 className="font-semibold text-purple-900 mb-2">💡 Recommendation:</h4>
          <p className="text-purple-700 text-sm">
            <strong>Choose Excel</strong> for data analysis and official records. <strong>Choose HTML</strong> for presentations, 
            sharing with donors, and visual reports. Both formats include all beneficiary data and photos.
          </p>
        </div>
      </div>
    </div>
  )
}