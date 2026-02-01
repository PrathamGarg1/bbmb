
'use client'

import { MotionButton } from '@/components/ui/motion-button'
import { Download } from 'lucide-react'
import { generatePDF } from '@/lib/pdf-generator'
import { calculateArrears } from '@/lib/calculation-engine'

interface RequestHeaderActionsProps {
  request: any
  daRates: any[]
}

export function RequestHeaderActions({ request, daRates }: RequestHeaderActionsProps) {

  const handleExport = () => {
    // Re-calculate client side for the PDF generation
    // Alternatively, we could pass the pre-calculated segments if we had them.
    // Since CalculationGrid calculates on the fly, we do the same here.
    
    const safeEvents = request.payEvents.map((p: any) => ({
      ...p,
      date: new Date(p.date)
    }))
    
    const safeDARates = daRates.map(d => ({
      ...d,
      effectiveDate: new Date(d.effectiveDate)
    }))

    const segments = calculateArrears({
      startDate: new Date(request.startDate),
      endDate: new Date(request.endDate),
      payEvents: safeEvents,
      daRates: safeDARates
    })

    const totalArrear = segments.reduce((sum, seg) => sum + (seg.totalDue - seg.totalDrawn), 0)

    generatePDF({
      employeeName: request.employeeName || 'Employee',
      employeeId: request.employeeId,
      startDate: new Date(request.startDate),
      endDate: new Date(request.endDate),
      segments,
      totalArrear
    })
  }

  return (
    <div className="flex gap-2">
      <MotionButton variant="secondary" onClick={handleExport}>
        <Download className="mr-2 h-4 w-4" />
        Export PDF
      </MotionButton>
    </div>
  )
}
