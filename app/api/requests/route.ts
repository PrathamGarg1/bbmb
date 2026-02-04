
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/requests
// Returns list of requests, optionally filtered by user role/id if needed
export async function GET(req: Request) {
    try {
        // In real app, filter by user.role
        // Clerks see their own, Officers see PENDING ones, etc.
        const requests = await prisma.arrearRequest.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                employeeName: true,
                status: true,
                createdAt: true,
                // We don't store totalArrear directly in root, it's in verificationResult or calculated
                // For list view, we might need to parse it or just show status.
                // Let's grab verificationResult to extract total if available
                verificationResult: true
            }
        })

        const safeRequests = requests.map(r => {
            let total = 0
            // Type assertion to bypass strict typing if schema update isn't reflected in IDE yet
            const vr = (r as any).verificationResult
            if (vr) {
                try {
                    const parsed = JSON.parse(vr)
                    // total = parsed.someTotalProperty 
                } catch (e) { }
            }
            return {
                ...r,
                totalArrear: total
            }
        })

        return NextResponse.json(safeRequests)
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }
}
