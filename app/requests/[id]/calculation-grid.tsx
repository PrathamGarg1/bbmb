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
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white">
      <div className="overflow-x-auto max-h-[600px] relative">
        <table className="min-w-full divide-y divide-gray-200 text-xs text-center border-collapse">
          <thead className="bg-gray-50/95 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
            {/* Header Row 1: Groupings */}
            <tr>
              <th className="border-b border-r border-gray-200 px-2 py-2 sticky left-0 z-20 bg-gray-50/95 text-left text-gray-500 font-semibold">Period</th>
              <th className="border-b border-gray-200 px-2 py-1 font-semibold text-gray-500 bg-gray-50/95 sticky left-[100px] z-20">Duration</th>
              <th colSpan={5} className="border-b border-r border-gray-200 px-2 py-2 font-bold bg-blue-50/80 text-blue-900">DUE (Revised)</th>
              <th colSpan={6} className="border-b border-r border-gray-200 px-2 py-2 font-bold bg-yellow-50/80 text-yellow-900">DRAWN (Old)</th>
              <th colSpan={3} className="border-b border-gray-200 px-2 py-2 font-bold bg-emerald-50/80 text-emerald-900">NET ARREAR</th>
            </tr>
            {/* Header Row 2: Columns */}
            <tr>
              <th className="border-b border-r border-gray-200 px-2 py-2 text-left bg-gray-50 text-[10px] uppercase tracking-wider text-gray-500 font-medium sticky left-0 z-20 top-[37px]">Dates</th>
              <th className="border-b border-gray-200 px-2 py-2 text-center bg-gray-50 text-[10px] uppercase tracking-wider text-gray-500 font-medium sticky left-[100px] z-20 top-[37px]">Months/Days</th>
              
              {/* DUE Columns */}
              <th className="border-b border-gray-200 px-1 py-1 text-right text-[10px] text-gray-400 font-medium">DA%</th>
              <th className="border-b border-gray-200 px-1 py-1 text-right text-[10px] text-gray-400 font-medium">Basic</th>
              <th className="border-b border-gray-200 px-1 py-1 text-right text-[10px] text-gray-400 font-medium">DA Amt</th>
              <th className="border-b border-gray-200 px-1 py-1 text-right text-[10px] text-gray-400 font-medium">HRA</th>
              <th className="border-b border-r border-gray-200 px-1 py-1 text-right text-[10px] text-blue-700 font-bold bg-blue-50/30">Total Due</th>

              {/* DRAWN Columns */}
              <th className="border-b border-gray-200 px-1 py-1 text-right text-[10px] text-gray-400 font-medium">DA%</th>
              <th className="border-b border-gray-200 px-1 py-1 text-right text-[10px] text-gray-400 font-medium">Basic</th>
              <th className="border-b border-gray-200 px-1 py-1 text-right text-[10px] text-gray-400 font-medium">G.Pay</th>
              <th className="border-b border-gray-200 px-1 py-1 text-right text-[10px] text-gray-400 font-medium">IR</th>
              <th className="border-b border-gray-200 px-1 py-1 text-right text-[10px] text-gray-400 font-medium">DA Amt</th>
              <th className="border-b border-r border-gray-200 px-1 py-1 text-right text-[10px] text-yellow-700 font-bold bg-yellow-50/30">Total Drawn</th>
              
              {/* DIFF Columns */}
              <th className="border-b border-gray-200 px-1 py-1 text-right text-[10px] text-gray-400 font-medium">Monthly Diff</th>
              <th className="border-b border-r border-gray-200 px-1 py-1 text-right text-[10px] text-gray-400 font-medium">Factor</th>
              <th className="border-b border-gray-200 px-1 py-1 text-right text-[10px] text-emerald-700 font-bold bg-emerald-50/30">Net Payable</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {segments.map((seg, idx) => (
              <tr key={idx} className="hover:bg-blue-50/40 transition-colors group">
                <td className="border-r border-gray-100 px-2 py-1.5 whitespace-nowrap font-medium text-gray-700 text-[11px] sticky left-0 bg-white group-hover:bg-blue-50/40 z-10 text-left">
                  {format(seg.startDate, 'dd.MM.yy')} - {format(seg.endDate, 'dd.MM.yy')}
                </td>
                <td className="border-r border-gray-100 px-2 py-1.5 whitespace-nowrap text-gray-500 text-[10px] sticky left-[100px] bg-white group-hover:bg-blue-50/40 z-10">
                   {seg.durationLabel}
                </td>
                
                {/* DUE */}
                <td className="px-1 py-1.5 text-right text-gray-500 font-mono">{seg.daPercentage}%</td>
                <td className="px-1 py-1.5 text-right text-gray-900 font-medium font-mono">{seg.basicPay}</td>
                <td className="px-1 py-1.5 text-right text-gray-500 font-mono">{seg.daRate}</td>
                <td className="px-1 py-1.5 text-right text-gray-300 font-mono">-</td>
                <td className="border-r border-gray-100 px-1 py-1.5 text-right font-bold text-blue-600 bg-blue-50/10 font-mono">
                  {seg.monthlyDueTotal}
                </td>

                {/* DRAWN */}
                <td className="px-1 py-1.5 text-right text-gray-500 font-mono">{seg.drawnDAPercentage}%</td>
                <td className="px-1 py-1.5 text-right text-gray-500 font-mono">{seg.drawnBasicPay}</td>
                <td className="px-1 py-1.5 text-right text-gray-500 font-mono">{seg.drawnGradePay}</td>
                <td className="px-1 py-1.5 text-right text-gray-500 font-mono">{seg.drawnIR}</td>
                <td className="px-1 py-1.5 text-right text-gray-500 font-mono">{seg.drawnDA}</td>
                <td className="border-r border-gray-100 px-1 py-1.5 text-right font-bold text-amber-600 bg-amber-50/10 font-mono">
                  {seg.drawnTotal}
                </td>

                {/* DIFF & TOTAL */}
                <td className="px-1 py-1.5 text-right text-gray-500 font-mono">
                   {seg.monthlyDueTotal - seg.drawnTotal}
                </td>
                <td className="border-r border-gray-100 px-1 py-1.5 text-right text-gray-400 text-[10px] font-mono">
                   {/* Factor Logic Visualization if needed, currently empty/hidden */}
                </td>
                <td className="px-1 py-1.5 text-right font-bold text-emerald-600 bg-emerald-50/10 font-mono">
                    {Math.round(seg.totalDue - seg.totalDrawn)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-bold border-t border-gray-200 text-sm sticky bottom-0 z-10 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">
            <tr>
              <td colSpan={13} className="px-3 py-3 text-right uppercase text-xs text-gray-500 font-bold tracking-wider">Net Arrear Payable:</td>
              <td className="px-3 py-3 text-right text-emerald-700 border-l border-gray-200 bg-emerald-50">
                ₹ {totalArrear.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      </div>
    </div>
  )
}
