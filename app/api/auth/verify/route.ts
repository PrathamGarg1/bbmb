
import { verifyOtp } from '@/lib/auth-service'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { email, code } = await req.json()
        if (!email || !code) return NextResponse.json({ error: 'Email and Code required' }, { status: 400 })

        const user = await verifyOtp(email, code)
        if (!user) {
            return NextResponse.json({ error: 'Invalid or Expired OTP' }, { status: 401 })
        }

        // In a real app, set an HTTP-Only Cookie or Session here.
        // For this demo, we can return the user object and handle session on client (simple)
        // or simple cookie. Let's return user and rely on client state/cookie for now or use next-auth later.
        // To be robust:
        const response = NextResponse.json({ success: true, user })

        // Simple mock session cookie for now
        response.cookies.set('bbmb_session', JSON.stringify({ userId: user.id, role: user.role }), {
            httpOnly: false, // Allow client access for simple demo, usually true
            path: '/',
            maxAge: 60 * 60 * 24 // 1 day
        })

        return response
    } catch (e) {
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
    }
}
