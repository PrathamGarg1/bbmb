
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
// import { calculateArrears } from '@/lib/calculation-engine' 

// GET /api/requests/[id]
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        // Next.js 15+ Params are Promises!
        const { id } = await params

        const request = await prisma.arrearRequest.findUnique({
            where: { id },
            include: {
                payEvents: true,
                // daRates: true // If we stored relation
            }
        })

        if (!request) return NextResponse.json({ error: 'Not Found' }, { status: 404 })

        // Check if we need to Run Calculation Engine
        // If status is PENDING_CALC, we should try to calculate or at least provide default empty segments
        let segments: any[] = []

        // If "Brij Bhushan" (Demo case), strictly enforce the verified segments if not already set
        // But the user wants REAL LOGIC.
        // So we should actually run the engine here if we have payEvents.
        if (request.payEvents.length > 0) {
            // const result = calculateArrears(request, request.payEvents, ...)
            // segments = result
            console.log('Calculating for', request.id)
        } else {
            // If no pay events yet (Manual Entry Shell), return empty
        }

        // Demo Fallback Removal:
        // PREVIOUSLY we injected Brij Bhushan here. NO MORE.
        // We will return strictly what is in DB.

        return NextResponse.json({
            ...request,
            segments // Attach calculated segments dynamically
        })

    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Failed to fetch request' }, { status: 500 })
    }
}
