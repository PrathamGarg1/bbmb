
'use client'

import { format } from 'date-fns'

interface CalculationGridProps {
    segments: any[] // In real app, enforce Segment[] type
}

export default function CalculationGrid({ segments }: CalculationGridProps) {
    if (!segments || segments.length === 0) {
        return <div className="p-8 text-center text-slate-400">No calculation data available.</div>
    }

    const totalDue = segments.reduce((sum, s) => sum + s.totalDue, 0)
    const totalDrawn = segments.reduce((sum, s) => sum + s.totalDrawn, 0)
    const totalArrear = totalDue - totalDrawn

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
                <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b">
                     <tr>
                        <th className="px-3 py-2 border-r bg-slate-100">Period</th>
                        <th className="px-3 py-2 border-r bg-slate-100">Dur</th>
                        <th className="px-3 py-2 text-right border-r bg-blue-50/50">Basic</th>
                        <th className="px-3 py-2 text-right border-r bg-blue-50/50">DA%</th>
                        <th className="px-3 py-2 text-right border-r font-bold bg-blue-50 text-blue-800">Due Total</th>
                        <th className="px-3 py-2 text-right border-r bg-amber-50/50">Drawn Basic</th>
                        <th className="px-3 py-2 text-right border-r bg-amber-50/50">Drawn DA</th>
                        <th className="px-3 py-2 text-right border-r font-bold bg-amber-50 text-amber-800">Drawn Total</th>
                        <th className="px-3 py-2 text-right font-black bg-slate-100">Net Arrear</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {segments.map((seg, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-3 py-2 font-mono whitespace-nowrap border-r text-slate-600">
                                {format(new Date(seg.startDate), 'dd-MMM-yy')} <span className="text-slate-300">to</span> {format(new Date(seg.endDate), 'dd-MMM-yy')}
                            </td>
                            <td className="px-3 py-2 border-r text-center text-slate-500 text-[10px]">{seg.durationLabel}</td>
                            
                            <td className="px-3 py-2 text-right border-r font-mono">{Math.round(seg.basicPay)}</td>
                            <td className="px-3 py-2 text-right border-r text-slate-500">{seg.daPercentage}%</td>
                            <td className="px-3 py-2 text-right border-r font-mono font-bold text-blue-700 bg-blue-50/30">{Math.round(seg.totalDue)}</td>
                            
                            <td className="px-3 py-2 text-right border-r font-mono text-slate-600">{Math.round(seg.drawnBasicPay + (seg.drawnGradePay||0) + (seg.drawnIR||0))}</td>
                            <td className="px-3 py-2 text-right border-r font-mono text-slate-600">{Math.round(seg.drawnDA)}</td>
                            <td className="px-3 py-2 text-right border-r font-mono font-bold text-amber-700 bg-amber-50/30">{Math.round(seg.totalDrawn)}</td>
                            
                            <td className={`px-3 py-2 text-right font-mono font-black ${seg.totalDue - seg.totalDrawn < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                                {Math.round(seg.totalDue - seg.totalDrawn)}
                            </td>
                        </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                        <td colSpan={4} className="px-3 py-3 text-right uppercase text-xs text-slate-500">Totals</td>
                        <td className="px-3 py-3 text-right text-blue-700">{Math.round(totalDue)}</td>
                        <td colSpan={2}></td>
                        <td className="px-3 py-3 text-right text-amber-700">{Math.round(totalDrawn)}</td>
                        <td className="px-3 py-3 text-right text-lg text-slate-900">{Math.round(totalArrear)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}
