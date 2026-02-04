
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, FileText, AlertTriangle, ArrowLeft, Download, ShieldCheck } from 'lucide-react'
import CalculationGrid from './calculation-grid'
// import { generateVerificationReport } from '@/lib/report-generator' // Client-side import might be tricky if it uses fs, ensure it's client-safe or move to API

// Mock Session
const useSession = () => ({ user: { role: 'OFFICER_L1', id: 'officer-1', name: 'Officer One' } })

export default function RequestDetailsPage() {
    const params = useParams()
    const { user } = useSession()
    const router = useRouter()
    const [request, setRequest] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        // Mock Fetch
        // In real app: fetch(`/api/requests/${params.id}`)
        setTimeout(() => {
            setRequest({
                id: params.id,
                employeeName: 'Brij Bhushan',
                startDate: '2016-01-01',
                endDate: '2021-06-30',
                status: 'PENDING_L1',
                verificationResult: JSON.stringify({
                    comparison: {
                        overallAccuracy: 99.5,
                        anomalies: [
                            // { type: 'WARNING', message: 'Negative arrear detected...' } 
                        ]
                    }
                }),
                payEvents: [], // Would call from DB
                daRates: []   // Would call from DB
            })
            setLoading(false)
        }, 1000)
    }, [params.id])

    const handleWorkflowAction = async (action: string) => {
        setActionLoading(true)
        try {
            const res = await fetch('/api/workflow/approve', {
                method: 'POST',
                body: JSON.stringify({
                    requestId: params.id,
                    action,
                    userId: user.id,
                    comments: prompt('Enter comments (optional):')
                })
            })
            if (res.ok) {
                alert(`Request ${action}ED successfully`)
                router.push('/dashboard')
            } else {
                alert('Action failed')
            }
        } catch (e) {
            console.error(e)
            alert('Error')
        } finally {
            setActionLoading(false)
        }
    }

    if (loading) return <div className="p-12 text-center">Loading request details...</div>
    if (!request) return <div className="p-12 text-center">Request not found</div>

    const verification = request.verificationResult ? JSON.parse(request.verificationResult) : null
    const accuracy = verification?.comparison?.overallAccuracy || 0
    const isVerified = accuracy >= 99

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-700 flex items-center gap-2 mb-6 text-sm font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>

            <header className="flex justify-between items-start mb-8 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{request.employeeName}</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-mono">{request.id}</span>
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-bold border border-blue-100">
                             {request.status.replace('_', ' ')}
                        </span>
                    </div>
                </div>
                
                <div className="flex gap-3">
                    {/* Verification Status Badge */}
                    {verification && (
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${isVerified ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                            {isVerified ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                            <div className="text-sm">
                                <p className="font-bold">{isVerified ? 'VERIFIED ACCURATE' : 'REVIEW REQUIRED'}</p>
                                <p className="text-xs opacity-90">Confidence: {accuracy}%</p>
                            </div>
                        </div>
                    )}
                    
                    <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 text-sm">
                        <Download className="w-4 h-4" />
                        Download Report
                    </button>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: Calc Grid */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50 font-semibold text-slate-800 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-500" /> Calculation Details
                        </div>
                        <div className="p-4">
                             {/* Reusing existing component (simplified props for demo) */}
                             {/* <CalculationGrid request={request} payEvents={[]} daRates={[]} /> */}
                             <div className="text-center py-12 text-slate-400 bg-slate-50 rounded border border-dashed border-slate-200">
                                [Calculation Grid Component Here]
                             </div>
                        </div>
                    </section>
                </div>

                {/* Sidebar: Actions & Anomalies */}
                <div className="space-y-6">
                    {/* Anomaly Card */}
                    {verification?.comparison?.anomalies?.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
                            <div className="p-3 bg-red-50 border-b border-red-100 text-red-800 font-bold text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> Anomalies Detected
                            </div>
                            <div className="p-4 space-y-3">
                                {verification.comparison.anomalies.map((a: any, i: number) => (
                                    <div key={i} className="text-xs bg-red-50 p-2 rounded border border-red-100 text-red-700">
                                        <div className="font-bold uppercase tracking-wider mb-1">{a.field}</div>
                                        {a.message}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50 font-semibold text-slate-800">
                            Workflow Actions
                        </div>
                        <div className="p-4 space-y-3">
                            <p className="text-sm text-slate-600 mb-4">
                                Current Status: <strong className="text-slate-900">{request.status}</strong>
                            </p>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => handleWorkflowAction('APPROVE')}
                                    disabled={actionLoading}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    <CheckCircle className="w-4 h-4" /> Approve
                                </button>
                                <button 
                                    onClick={() => handleWorkflowAction('REJECT')}
                                    disabled={actionLoading}
                                    className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    <XCircle className="w-4 h-4" /> Reject
                                </button>
                            </div>
                            
                            <p className="text-xs text-center text-slate-400 mt-2">
                                Action performed by: {user.name}
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
