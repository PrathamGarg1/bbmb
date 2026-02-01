
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { format } from 'date-fns'
import { DashboardCharts } from './charts'
import { GlassCard } from '@/components/ui/glass-card'
import { MotionButton } from '@/components/ui/motion-button'
import { Plus } from 'lucide-react'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const role = cookieStore.get('user_role')?.value
  const email = cookieStore.get('user_email')?.value

  if (!role) return <div className="p-10 text-center text-gray-500">Please login to access the dashboard.</div>

  // --- Fetch Data ---
  let where = {}
  if (role === 'CLERK') {
    const user = await prisma.user.findUnique({ where: { email } })
    if (user) where = { initiatorId: user.id }
  }

  const requests = await prisma.arrearRequest.findMany({
    where,
    include: { initiator: true },
    orderBy: { updatedAt: 'desc' }
  })

  // --- Helper to parse totals ---
  const getArrearTotal = (jsonStr: string | null): number => {
    if (!jsonStr) return 0
    try {
      const segments = JSON.parse(jsonStr)
      if (!Array.isArray(segments)) return 0
      return segments.reduce((acc: number, seg: any) => {
        const due = typeof seg.totalDue === 'number' ? seg.totalDue : 0
        const drawn = typeof seg.totalDrawn === 'number' ? seg.totalDrawn : 0
        return acc + (due - drawn)
      }, 0)
    } catch {
      return 0
    }
  }

  // --- Calculate Analytics ---
  // 1. Status Distribution
  const statusCounts = requests.reduce((acc, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  // 2. Trend Data
  const trendMap = requests.reduce((acc, req) => {
      const total = getArrearTotal(req.calculationResult)
      if (req.status === 'APPROVED' || (total > 0)) {
          const month = format(req.updatedAt, 'MMM')
          acc[month] = (acc[month] || 0) + total
      }
      return acc
  }, {} as Record<string, number>)

  const trendData = Object.entries(trendMap).map(([month, amount]) => ({ month, amount }))

  // 3. Top Requests
  const topRequests = [...requests]
     .map(r => ({ name: r.employeeName || 'Unknown', amount: getArrearTotal(r.calculationResult) }))
     .filter(r => r.amount > 0)
     .sort((a, b) => b.amount - a.amount)
     .slice(0, 5)

  return (
    <div className="space-y-8">
      
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
           <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
             Welcome back, {role === 'CLERK' ? 'Clerk' : 'Officer'}
           </h2>
           <p className="text-gray-500 mt-1">Here is the overview of recent arrear calculations.</p>
        </div>
        {role === 'CLERK' && (
          <Link href="/requests/new">
            <MotionButton size="lg" className="shadow-blue-500/20">
              <Plus className="mr-2 h-5 w-5" />
              New Arrear Request
            </MotionButton>
          </Link>
        )}
      </div>

      {/* Analytics Section - Only show charts if we have data */}
      {requests.length > 0 && (
         <DashboardCharts 
            statusData={statusData.length > 0 ? statusData : [{name: 'No Data', value: 1}]} 
            trendData={trendData}
            topRequests={topRequests}
         />
      )}

      {/* Recent Requests Table */}
      <GlassCard delay={0.3} className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-semibold text-gray-800">
            {role === 'CLERK' ? 'My Recent Requests' : 'Pending Approvals'}
          </h3>
          <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full text-gray-600">
            {requests.length} Total
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="p-10 text-center text-gray-400 font-medium">
            No requests found. Start by creating one!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50/50 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID / Employee</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Update</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-gray-100">
                {requests.map((req) => {
                  const total = getArrearTotal(req.calculationResult)
                  return (
                  <tr key={req.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">{req.employeeName}</span>
                          <span className="text-xs text-gray-500 font-mono">{req.employeeId}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(req.startDate, 'MMM yy')} - {format(req.endDate, 'MMM yy')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                       {total > 0 ? `₹${total.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border 
                        ${req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          req.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' : 
                          'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(req.updatedAt, 'dd MMM, HH:mm')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/requests/${req.id}`}>
                        <span className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline">View Details</span>
                      </Link>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
