
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const role = cookieStore.get('user_role')?.value
  const email = cookieStore.get('user_email')?.value

  if (!role) return <div>Please login</div>

  // Fetch requests relevant to role
  // CLERK: created by me
  // OTHERS: pending status? or all? For MVP show all or pending.
  
  let where = {}
  if (role === 'CLERK') {
     // We need to find the user ID first... 
     // Optimization: Store user ID in cookie or fetch user by email.
    const user = await prisma.user.findUnique({ where: { email } })
    if (user) {
      where = { initiatorId: user.id }
    }
  } else {
    // Show all for now, maybe filter by status later
  }

  const requests = await prisma.arrearRequest.findMany({
    where,
    include: { initiator: true },
    orderBy: { updatedAt: 'desc' }
  })

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          {role === 'CLERK' ? 'My Requests' : 'Pending Requests'}
        </h3>
        {role === 'CLERK' && (
          <Link href="/requests/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
            New Arrear Request
          </Link>
        )}
      </div>
      
      {requests.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No requests found.
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map(req => (
              <tr key={req.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {req.id.slice(0, 8)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {req.employeeId} <br/> <span className="text-xs">{req.employeeName}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(req.startDate, 'MMM yyyy')} - {format(req.endDate, 'MMM yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${req.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                      req.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'}`}>
                    {req.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(req.updatedAt, 'dd MMM yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href={`/requests/${req.id}`} className="text-blue-600 hover:text-blue-900">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
