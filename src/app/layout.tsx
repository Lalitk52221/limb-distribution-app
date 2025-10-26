import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Image from 'next/image'
import Link from 'next/link'
import { FaHome } from 'react-icons/fa'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Limb Distribution Camp Management',
  description: 'NGO platform for artificial limb distribution camps',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
           {/* Navbar  */}
      <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <Link href="/" className="flex items-center">
                  <Image src="/images/Saksham_logo.png" alt="Logo" width={150} height={150} className='object-contain  ' />
                </Link>
                <div className='flex items-end justify-center' >
                  <Link href="/" className='text-md font-semibold cursor-pointer text-black flex items-end justify-center gap-1'> <FaHome size={35} className='text-blue-600' /> Home </Link>
                </div>
                {/* <Link href="/">
                <Image src="/images/SMF_logo.png" alt="Logo" width={150} height={150} className='object-contain' />
                </Link> */}
              </div>
            </div>
          </nav>
          {children}
        </div>
      </body>
    </html>
  )
}