'use client'

import { calculateArrears } from '@/lib/calculation-engine'
import { format } from 'date-fns'

interface CalculationGridProps {
  request: any
  payEvents: any[]
  daRates: any[]
}

export default function CalculationGrid({ request, payEvents, daRates }: CalculationGridProps) {
  const safeEvents = payEvents.map(p => ({
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

  // Calculate Aggregates
  const totalArrear = segments.reduce((sum, seg) => sum + (seg.totalDue - seg.totalDrawn), 0)

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-xs border border-gray-300">
          <thead className="bg-gray-100">
            {/* Header Row 1: Groupings */}
            <tr>
              <th className="border border-gray-300 px-1 py-1 bg-white"></th>
              <th colSpan={5} className="border border-gray-300 px-1 py-1 text-center font-bold bg-blue-50 text-blue-900">DUE (Revised)</th>
              <th colSpan={6} className="border border-gray-300 px-1 py-1 text-center font-bold bg-yellow-50 text-yellow-900">DRAWN (Old)</th>
              <th colSpan={3} className="border border-gray-300 px-1 py-1 text-center font-bold bg-green-50 text-green-900">DIFFERENCE</th>
            </tr>
            {/* Header Row 2: Columns */}
            <tr>
              <th className="border border-gray-300 px-2 py-2 text-left bg-gray-50 uppercase text-[10px] text-gray-500">Period</th>
              
              {/* DUE Columns */}
              <th className="border border-gray-300 px-1 py-1 text-right text-[10px] text-gray-500">DA%</th>
              <th className="border border-gray-300 px-1 py-1 text-right text-[10px] text-gray-500">BP</th>
              <th className="border border-gray-300 px-1 py-1 text-right text-[10px] text-gray-500">DA</th>
              <th className="border border-gray-300 px-1 py-1 text-right text-[10px] text-gray-500">HRA</th>
              <th className="border border-gray-300 px-1 py-1 text-right text-[10px] text-gray-500 font-bold">TOTAL</th>

              {/* DRAWN Columns */}
              <th className="border border-gray-300 px-1 py-1 text-right text-[10px] text-gray-500">DA%</th>
              <th className="border border-gray-300 px-1 py-1 text-right text-[10px] text-gray-500">BP</th>
              <th className="border border-gray-300 px-1 py-1 text-right text-[10px] text-gray-500">GP</th>
              <th className="border border-gray-300 px-1 py-1 text-right text-[10px] text-gray-500">IR</th>
              <th className="border border-gray-300 px-1 py-1 text-right text-[10px] text-gray-500">DA</th>
              <th className="border border-gray-300 px-1 py-1 text-right text-[10px] text-gray-500 font-bold">TOTAL</th>
              
              {/* DIFF Columns */}
              <th className="border border-gray-300 px-1 py-1 text-right text-[10px] text-gray-500">Diff</th>
              <th className="border border-gray-300 px-1 py-1 text-right text-[10px] text-gray-500">M/D</th>
              <th className="border border-gray-300 px-1 py-1 text-right text-[10px] text-gray-500 font-bold">Total Diff</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {segments.map((seg, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-2 py-1 whitespace-nowrap font-medium text-gray-700 text-[11px]">
                  {format(seg.startDate, 'dd.MM.yy')} to {format(seg.endDate, 'dd.MM.yy')}
                </td>
                
                {/* DUE */}
                <td className="border border-gray-300 px-1 py-1 text-right text-gray-600">{seg.daPercentage}%</td>
                <td className="border border-gray-300 px-1 py-1 text-right text-black font-semibold">{seg.basicPay}</td>
                <td className="border border-gray-300 px-1 py-1 text-right text-gray-600">{seg.daRate}</td>
                <td className="border border-gray-300 px-1 py-1 text-right text-gray-400">-</td>
                <td className="border border-gray-300 px-1 py-1 text-right font-bold text-blue-700 bg-blue-50/30">
                  {seg.monthlyDueTotal}
                </td>

                {/* DRAWN */}
                <td className="border border-gray-300 px-1 py-1 text-right text-gray-600">{seg.drawnDAPercentage}%</td>
                <td className="border border-gray-300 px-1 py-1 text-right text-gray-600">{seg.drawnBasicPay}</td>
                <td className="border border-gray-300 px-1 py-1 text-right text-gray-600">{seg.drawnGradePay}</td>
                <td className="border border-gray-300 px-1 py-1 text-right text-gray-600">{seg.drawnIR}</td>
                <td className="border border-gray-300 px-1 py-1 text-right text-gray-600">{seg.drawnDA}</td>
                <td className="border border-gray-300 px-1 py-1 text-right font-bold text-yellow-700 bg-yellow-50/30">
                  {seg.drawnTotal}
                </td>

                {/* DIFF & TOTAL */}
                <td className="border border-gray-300 px-1 py-1 text-right font-medium">
                   {seg.monthlyDueTotal - seg.drawnTotal}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-right text-gray-500 text-[10px]">
                    {seg.durationLabel}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-right font-bold text-green-700 bg-green-50/20">
                    {seg.totalDue - seg.totalDrawn}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-400">
            <tr>
              <td colSpan={13} className="px-3 py-2 text-right uppercase text-xs">Total Arrear Payable:</td>
              <td className="px-3 py-2 text-right text-green-800 text-base border border-gray-300 bg-green-100">
                ₹ {totalArrear.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
