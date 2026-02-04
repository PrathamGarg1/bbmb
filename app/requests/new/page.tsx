
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, Loader2, Info } from 'lucide-react'

// Simplify imports by not using server actions directly in client component structure if causing issues,
// use API route for robustness or keep simple. Let's use API route for creation to handle files better.

export default function NewRequestPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [mode, setMode] = useState<'OCR' | 'MANUAL'>('OCR')
    const [files, setFiles] = useState<FileList | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        
        const formData = new FormData(e.currentTarget)
        const userEmail = document.cookie.split('; ').find(row => row.startsWith('user_email='))?.split('=')[1] || 'demo@bbmb.gov.in' // Mock email retrieval

        // Append files if OCR mode
        if (mode === 'OCR' && files) {
             for (let i = 0; i < files.length; i++) {
                formData.append('images', files[i])
             }
        }

        try {
            // We need a new API route for creating requests with files
            // For now, let's assume we post to a new endpoint
            const res = await fetch('/api/requests', {
                method: 'POST',
                body: formData // Let browser set Content-Type for FormData
            })

            if (!res.ok) throw new Error('Failed to create request')
            
            const data = await res.json()
            router.push(`/requests/${data.id}`)
        } catch (error) {
            console.error(error)
            alert('Failed to create request. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-slate-900">New Arrear Calculation</h1>
                    <p className="mt-2 text-slate-600">Start a new calculation by uploading sheets or manual entry</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                    {/* Tabs */}
                    <div className="grid grid-cols-2 border-b border-slate-200">
                        <button 
                            onClick={() => setMode('OCR')}
                            className={`p-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mode === 'OCR' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Upload className="w-4 h-4" /> Upload & Verify (Recommended)
                        </button>
                        <button 
                             onClick={() => setMode('MANUAL')}
                             className={`p-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mode === 'MANUAL' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <FileText className="w-4 h-4" /> Manual Entry
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Employee Name</label>
                                <input name="employeeName" required className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. Brij Bhushan" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Employee ID</label>
                                <input name="employeeId" required className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. EMP-180" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Period Start</label>
                                <input type="date" name="startDate" required className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Period End</label>
                                <input type="date" name="endDate" required className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                        </div>

                        {mode === 'OCR' ? (
                            <div className="space-y-4">
                                <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-blue-50/50 transition-colors text-center cursor-pointer relative group">
                                    <input 
                                        type="file" 
                                        multiple 
                                        accept="image/*" 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => setFiles(e.target.files)}
                                    />
                                    <div className="flex flex-col items-center">
                                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <Upload className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-semibold text-slate-900">Click to upload calculation sheets</h3>
                                        <p className="text-sm text-slate-500 mt-1">SVG, PNG, JPG or PDF (max. 10MB)</p>
                                        {files && files.length > 0 && (
                                            <div className="mt-4 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                                                {files.length} file(s) selected
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-4 bg-amber-50 text-amber-800 rounded-lg text-sm">
                                    <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <p>The system will automatically extract pay events, calculate amounts based on 7th CPC rules, and verify totals against the provided sheets.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 bg-slate-50 rounded-xl text-center text-slate-500 border border-slate-200">
                                <p>Manual entry grid will be available on the next screen after creating the request shell.</p>
                            </div>
                        )}

                        <div className="pt-4">
                            <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2">
                                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (mode === 'OCR' ? 'Upload & Verify' : 'Create Request')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
