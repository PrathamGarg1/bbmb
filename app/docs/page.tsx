
'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Book, ShieldCheck, Upload, Activity } from 'lucide-react'

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-700 flex items-center gap-2 mb-8 font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>

            <div className="max-w-4xl mx-auto bg-white p-12 rounded-2xl shadow-sm border border-slate-200">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">BBMB Arrear System Documentation</h1>
                    <p className="text-lg text-slate-600">Complete guide to the automated calculation and verification workflow.</p>
                </div>

                <div className="space-y-16">
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                <Upload className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">1. Initiating Requests</h2>
                        </div>
                        <div className="prose text-slate-600 ml-14">
                            <p>
                                Start by navigating to the "New Request" page from the dashboard. You have two options:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-4">
                                <li><strong>Upload & Verify (Recommended):</strong> Upload scanned images/PDFs of manual calculation sheets. The AI will extract the data, run the calculation engine, and verify the manual totals against the system's 7th CPC logic.</li>
                                <li><strong>Manual Entry:</strong> Create a blank request shell and manually input pay events if no sheet is available.</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                                <Activity className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">2. The Calculation Engine</h2>
                        </div>
                        <div className="prose text-slate-600 ml-14">
                            <p>
                                The system converts all inputs into a standardized "Pay Event" stream. It then processes these events month-by-month:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-4">
                                <li><strong>Segments:</strong> Any change in Pay, DA, or Month boundaries creates a new calculation segment.</li>
                                <li><strong>Due Calculation:</strong> Based on 7th CPC Revised Basic Pay + Current DA Rate.</li>
                                <li><strong>Drawn Calculation:</strong> Based on 6th CPC Basic + Grade Pay + IR + Old DA Rate.</li>
                                <li><strong>Accuracy:</strong> Detailed split-month logic handles mid-month increments precisely.</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">3. Verification & Approval</h2>
                        </div>
                        <div className="prose text-slate-600 ml-14">
                            <p>
                                Once a request is processed, it enters the verification stage:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-4">
                                <li><strong>Verification Certificate:</strong> Use the "Download Report" button to get a PDF certificate. It will be marked <span className="text-emerald-600 font-bold">VERIFIED</span> if accuracy is &gt;99%, or <span className="text-amber-600 font-bold">REVIEW REQUIRED</span> otherwise.</li>
                                <li><strong>Anomaly Detection:</strong> The system automatically flags suspicious patterns like negative arrears (overpayment) or drops in Basic Pay.</li>
                                <li><strong>Approval Workflow:</strong> Clerks submit to L1 Officer &rarr; L1 approves to L2 &rarr; L2 approves to Final. Each step triggers an email notification.</li>
                            </ul>
                        </div>
                    </section>
                </div>

                <div className="mt-16 pt-8 border-t border-slate-100 text-center text-slate-400 text-sm">
                    BBMB Arrear Automation System v1.0 • Internal Use Only
                </div>
            </div>
        </div>
    )
}
