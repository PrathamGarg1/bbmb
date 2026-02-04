
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/mailer'
import { NextResponse } from 'next/server'

// POST /api/workflow/approve
export async function POST(req: Request) {
    try {
        const { requestId, action, userId, comments } = await req.json()

        // Find Request
        const request = await prisma.arrearRequest.findUnique({
            where: { id: requestId },
            include: { initiator: true }
        })

        if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

        let nextStatus = request.status
        const currentStatus = request.status

        // State Machine Logic
        if (action === 'APPROVE') {
            if (currentStatus === 'PENDING_L1') nextStatus = 'PENDING_L2'
            else if (currentStatus === 'PENDING_L2') nextStatus = 'PENDING_BUDGET'
            else if (currentStatus === 'PENDING_BUDGET') nextStatus = 'APPROVED'
        } else if (action === 'REJECT') {
            nextStatus = 'REJECTED'
        } else if (action === 'SUBMIT') {
            nextStatus = 'PENDING_L1'
        }

        // Update DB
        const updated = await prisma.arrearRequest.update({
            where: { id: requestId },
            data: {
                status: nextStatus,
                auditLogs: {
                    create: {
                        action: `${action} (${currentStatus} -> ${nextStatus})`,
                        comments,
                        performedById: userId
                    }
                }
            }
        })

        // Send Email Notification
        // Notify Initiator
        await sendEmail(
            request.initiator.email,
            `Request Status Update: ${request.employeeName}`,
            `Your request for ${request.employeeName} has been ${action}ED. New Status: ${nextStatus}.\n\nComments: ${comments || 'None'}`
        )

        return NextResponse.json({ success: true, request: updated })

    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Workflow action failed' }, { status: 500 })
    }
}
