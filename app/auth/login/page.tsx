
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Loader2, Mail, Lock } from 'lucide-react'

export default function LoginPage() {
    const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL')
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    
    const { register, handleSubmit } = useForm()

    const onSendOtp = async (data: any) => {
        setLoading(true)
        try {
            await fetch('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email: data.email })
            })
            setEmail(data.email)
            setStep('OTP')
        } catch (e) {
            alert('Failed to send OTP')
        } finally {
            setLoading(false)
        }
    }

    const onVerifyOtp = async (data: any) => {
        setLoading(true)
        try {
            const res = await fetch('/api/auth/verify', {
                method: 'POST',
                body: JSON.stringify({ email, code: data.code })
            })
            
            if (res.ok) {
                // Redirect to Dashboard (needs to be created)
                window.location.href = '/dashboard' 
            } else {
                alert('Invalid OTP')
            }
        } catch (e) {
             alert('Error verifying OTP')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-slate-100">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">BBMB Arrear Portal</h1>
                    <p className="text-slate-500 text-sm mt-1">Secure Login</p>
                </div>

                {step === 'EMAIL' ? (
                    <form onSubmit={handleSubmit(onSendOtp)} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3  text-slate-400 w-5 h-5" />
                                <input 
                                    {...register('email')}
                                    type="email" 
                                    placeholder="officer@bbmb.gov.in"
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    required
                                />
                            </div>
                        </div>
                        <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center">
                            {loading ? <Loader2 className="animate-spin w-5 h-5"/> : 'Send Access Code'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit(onVerifyOtp)} className="space-y-4">
                        <div className="text-sm bg-blue-50 text-blue-700 p-3 rounded mb-4">
                            OTP sent to <strong>{email}</strong>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">One-Time Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                <input 
                                    {...register('code')}
                                    type="text" 
                                    placeholder="123456"
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm tracking-widest"
                                    required
                                />
                            </div>
                        </div>
                        <button disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center">
                             {loading ? <Loader2 className="animate-spin w-5 h-5"/> : 'Verify & Login'}
                        </button>
                        <button type="button" onClick={() => setStep('EMAIL')} className="w-full text-slate-400 text-xs hover:text-slate-600 transition-colors">
                            Change Email
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
