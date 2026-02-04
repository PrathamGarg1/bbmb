
'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import { FileText, CheckCircle, XCircle, Clock, Loader2, Book } from 'lucide-react'

// Mock session hook (replace with real auth hook later)
const useSession = () => {
    // In real app, this reads from context/cookie
    // For demo, we just simulate a loaded user or redirect
    return { user: { role: 'CLERK', name: 'Demo User', id: 'demo-id' } } 
}

export default function DashboardPage() {
    const { user } = useSession()
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchRequests()
    }, [])

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/requests')
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setRequests(data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
            case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200'
            case 'DRAFT': return 'bg-slate-100 text-slate-800 border-slate-200'
            default: return 'bg-amber-50 text-amber-700 border-amber-200'
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500">Welcome, {user.name} ({user.role})</p>
                </div>
                <div>
                    <Link href="/docs" className="text-slate-500 hover:text-slate-800 font-medium px-4 py-2 transition-colors flex items-center gap-2">
                        <Book className="w-4 h-4" /> Docs
                    </Link>
                    <Link href="/requests/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        New Arrear Request
                    </Link>
                </div>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h2 className="font-semibold text-slate-800">Recent Requests</h2>
                    <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">{requests.length} items</span>
                </div>
                
                {loading ? (
                    <div className="p-12 flex justify-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3 font-medium">Request ID</th>
                                <th className="px-6 py-3 font-medium">Employee</th>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium text-right">Amount</th>
                                <th className="px-6 py-3 font-medium text-center">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {requests.map((req) => (
                                <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-6 py-4 font-mono text-slate-600">{req.id.substring(0, 8)}...</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{req.employeeName}</td>
                                    <td className="px-6 py-4 text-slate-500">{format(new Date(req.createdAt), 'dd MMM yyyy')}</td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-700">
                                        {req.totalArrear ? `₹${req.totalArrear.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(req.status)}`}>
                                            {req.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link href={`/requests/${req.id}`} className="text-blue-600 hover:text-blue-800 font-medium text-xs">
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
