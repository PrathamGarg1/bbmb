
import { generateOtp } from '@/lib/auth-service'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { email } = await req.json()
        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

        await generateOtp(email)
        return NextResponse.json({ success: true, message: 'OTP Sent' })
    } catch (e) {
        return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
    }
}
