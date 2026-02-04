
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/mailer'
import { addMinutes } from 'date-fns'

export async function generateOtp(email: string) {
    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = addMinutes(new Date(), 10) // 10 minutes expiry

    // Save to DB (invalidate old ones ideally, but for now just create new)
    await prisma.otp.create({
        data: {
            email,
            code,
            expiresAt
        }
    })

    // Send via Email
    await sendEmail(
        email,
        'BBMB Portal - Login OTP',
        `Your login OTP is: ${code}. Valid for 10 minutes.`
    )

    console.log(`[AUTH] OTP sent to ${email}: ${code}`)
    return true
}

export async function verifyOtp(email: string, code: string) {
    const validOtp = await prisma.otp.findFirst({
        where: {
            email,
            code,
            used: false,
            expiresAt: {
                gt: new Date()
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    if (!validOtp) {
        return false
    }

    // Mark as used
    await prisma.otp.update({
        where: { id: validOtp.id },
        data: { used: true }
    })

    // Find or Create User (Auto-signup for demo, or restrict in prod)
    // For this rigorous app, let's assume users should exist.
    // BUT for ease of testing, we will upsert user with CLERK role if not found.
    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            role: 'CLERK', // Default Role
            name: email.split('@')[0]
        }
    })

    return user
}
