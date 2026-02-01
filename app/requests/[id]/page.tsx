


import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { ChevronLeft, Download } from 'lucide-react'
import PayEventsEditor from './events-editor'
import CalculationGrid from './calculation-grid'
import ApprovalWorkflow from './approval-workflow'
import ImageVerifier from './image-verifier'
import { MotionButton } from '@/components/ui/motion-button'
import { generatePDF } from '@/lib/pdf-generator'
import { calculateArrears } from '@/lib/calculation-engine'

// Need to make this a Client Component to use onClick for PDF
// OR: keep this server component and wrap the header actions in a client component.
// Let's refactor the Header into a Client Component for simplicity.

import { RequestHeaderActions } from './header-actions'

export default async function RequestDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const request = await prisma.arrearRequest.findUnique({
    where: { id },
    include: { 
      payEvents: { orderBy: { date: 'asc' } },
      initiator: true
    }
  })

  if (!request) notFound()

  // Fetch Logic Data
  const daRates = await prisma.dARate.findMany({ orderBy: { effectiveDate: 'asc' } })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
            <ChevronLeft />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{request.employeeName} ({request.employeeId})</h1>
            <p className="text-sm text-gray-500">
              {format(request.startDate, 'dd MMM yyyy')} - {format(request.endDate, 'dd MMM yyyy')} • Status: {request.status}
            </p>
          </div>
        </div>
        
        {/* Client Actions: Export PDF */}
        <RequestHeaderActions request={request} daRates={daRates} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Inputs (Pay Events) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-4">Pay Events</h2>
            <PayEventsEditor 
              requestId={request.id} 
              initialEvents={request.payEvents.map(e => ({
                ...e,
                drawnBasicPay: e.drawnBasicPay ?? undefined,
                drawnGradePay: e.drawnGradePay ?? undefined,
                drawnIR: e.drawnIR ?? undefined
              }))} 
            />
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-4">Workflow Actions</h2>
            <ApprovalWorkflow request={request} />
          </div>
        </div>

        {/* Right Col: Calculation Grid */}
        <div className="lg:col-span-2">
           <div className="bg-white p-6 rounded-lg shadow overflow-auto">
             <h2 className="text-lg font-medium mb-4">Calculation Grid (Due vs Drawn)</h2>
             <CalculationGrid 
               request={request} 
               payEvents={request.payEvents} 
               daRates={daRates}
             />
           </div>
        </div>
      </div>

      {/* Image Verification Section */}
      <div className="mt-6">
        <ImageVerifier 
          segments={(() => {
            const safeEvents = request.payEvents.map(p => ({
              ...p,
              date: new Date(p.date),
              drawnBasicPay: p.drawnBasicPay ?? undefined,
              drawnGradePay: p.drawnGradePay ?? undefined,
              drawnIR: p.drawnIR ?? undefined
            }))
            const safeDARates = daRates.map(d => ({
              ...d,
              effectiveDate: new Date(d.effectiveDate),
              type: d.type as 'REVISED' | 'PRE_REVISED'
            }))
            return calculateArrears({
              startDate: new Date(request.startDate),
              endDate: new Date(request.endDate),
              payEvents: safeEvents,
              daRates: safeDARates
            })
          })()}
          totalArrear={(() => {
            const safeEvents = request.payEvents.map(p => ({
              ...p,
              date: new Date(p.date),
              drawnBasicPay: p.drawnBasicPay ?? undefined,
              drawnGradePay: p.drawnGradePay ?? undefined,
              drawnIR: p.drawnIR ?? undefined
            }))
            const safeDARates = daRates.map(d => ({
              ...d,
              effectiveDate: new Date(d.effectiveDate),
              type: d.type as 'REVISED' | 'PRE_REVISED'
            }))
            const segments = calculateArrears({
              startDate: new Date(request.startDate),
              endDate: new Date(request.endDate),
              payEvents: safeEvents,
              daRates: safeDARates
            })
            return segments.reduce((sum, seg) => sum + (seg.totalDue - seg.totalDrawn), 0)
          })()}
        />
      </div>
    </div>
  )
}
