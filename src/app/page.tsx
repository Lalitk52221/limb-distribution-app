import Link from 'next/link'

const steps = [
  { number: 1, name: 'Registration', description: 'Register beneficiary details', path: '/dashboard/registration', color: 'blue' },
  { number: 2, name: 'Before Photography', description: 'Capture before photo', path: '/dashboard/before-photo', color: 'green' },
  { number: 3, name: 'Measurement', description: 'Take measurements for limb', path: '/dashboard/measurement', color: 'yellow' },
  { number: 4, name: 'Fitment', description: 'Fit the artificial limb', path: '/dashboard/fitment', color: 'purple' },
  { number: 5, name: 'Extra Items', description: 'Provide sticks, shoes, etc.', path: '/dashboard/extra-items', color: 'indigo' },
  { number: 6, name: 'After Photography', description: 'Capture after photo with limb', path: '/dashboard/after-photo', color: 'pink' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Artificial Limb Distribution Camp
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Streamlined 6-step workflow for efficient camp management. Each step handled by different volunteers on separate devices.
          </p>
        </div>
{/* Main Action */}
      <div className="text-center mb-16">
          <Link 
            href="/event-setup"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 text-lg font-semibold transition-colors"
          >
            Start New Camp Event
          </Link>
          <p className="text-gray-600 mt-4">
            Create an event to begin the registration and distribution process
          </p>
        </div>

        {/* Workflow Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {steps.map((step) => (
            <Link
              key={step.number}
              href={step.path}
              className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-${step.color}-500 p-6`}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 bg-${step.color}-100 text-${step.color}-600 rounded-full flex items-center justify-center font-bold text-lg`}>
                  {step.number}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {step.name}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {step.description}
                  </p>
                  <div className="mt-3 text-xs text-gray-500">
                    Volunteer {step.number}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link 
            href="/dashboard/summary"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChartBar className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Camp Summary
              </h3>
              <p className="text-gray-600">
                View real-time statistics and distribution summary
              </p>
            </div>
          </Link>

          <Link 
            href="/dashboard/export"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Export Data
              </h3>
              <p className="text-gray-600">
                Generate Excel reports with photos and complete data
              </p>
            </div>
          </Link>
        </div>

        {/* Workflow Diagram */}
        <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Camp Workflow Process
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="text-center">
                  <div className={`w-16 h-16 bg-${step.color}-100 text-${step.color}-600 rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-2 border-2 border-${step.color}-300`}>
                    {step.number}
                  </div>
                  <span className="text-sm font-medium text-gray-700 block max-w-[100px]">
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="mx-4 text-gray-300">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Icon components
const ChartBar = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const Download = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
)

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
)

// import Link from 'next/link'

// export default function Home() {
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
//       <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
//         {/* Header */}
//         <div className="text-center mb-16">
//           <h1 className="text-4xl font-bold text-gray-900 mb-4">
//             Artificial Limb Distribution Camp
//           </h1>
//           <p className="text-xl text-gray-600 max-w-3xl mx-auto">
//             Complete camp management system for artificial limb distribution
//           </p>
//         </div>

//         {/* Main Action */}
//         <div className="text-center mb-16">
//           <Link 
//             href="/event-setup"
//             className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 text-lg font-semibold transition-colors"
//           >
//             Start New Camp Event
//           </Link>
//           <p className="text-gray-600 mt-4">
//             Create an event to begin the registration and distribution process
//           </p>
//         </div>

//         {/* Workflow Steps */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
//           {[
//             { number: 1, name: 'Event Setup', description: 'Create camp event with date and location', color: 'blue' },
//             { number: 2, name: 'Registration', description: 'Register beneficiary details', color: 'green' },
//             { number: 3, name: 'Before Photo', description: 'Capture before photo', color: 'yellow' },
//             { number: 4, name: 'Measurement', description: 'Take measurements for limb', color: 'purple' },
//             { number: 5, name: 'Fitment', description: 'Fit the artificial limb', color: 'indigo' },
//             { number: 6, name: 'Extra Items', description: 'Provide sticks, shoes, etc.', color: 'pink' },
//             { number: 7, name: 'After Photo', description: 'Capture after photo with limb', color: 'red' },
//             { number: 8, name: 'Management', description: 'Monitor camp progress and stats', color: 'green' },
//             { number: 9, name: 'Export Data', description: 'Generate Excel reports with photos', color: 'blue' },
//           ].map((step) => (
//             <div
//               key={step.number}
//               className={`bg-white rounded-xl shadow-lg p-6 border-l-4 border-${step.color}-500`}
//             >
//               <div className="flex items-start space-x-4">
//                 <div className={`w-12 h-12 bg-${step.color}-100 text-${step.color}-600 rounded-full flex items-center justify-center font-bold text-lg`}>
//                   {step.number}
//                 </div>
//                 <div className="flex-1">
//                   <h3 className="text-lg font-semibold text-gray-900 mb-2">
//                     {step.name}
//                   </h3>
//                   <p className="text-gray-600 text-sm">
//                     {step.description}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   )
// }