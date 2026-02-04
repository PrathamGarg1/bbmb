
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
// import { processUploadedFiles } from '@/lib/ocr-service' // Hypothetical service
// import { calculateArrears } from '@/lib/calculation-engine' 

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const employeeName = formData.get('employeeName') as string
        const employeeId = formData.get('employeeId') as string
        const startDate = new Date(formData.get('startDate') as string)
        const endDate = new Date(formData.get('endDate') as string)
        const images = formData.getAll('images') as File[]

        // 1. Create Request Shell
        // For demo, we just assume a default user "clerk-1" if no session logic on API yet
        // In real app, get user from session
        const initiator = await prisma.user.findFirst({ where: { role: 'CLERK' } })
            || await prisma.user.create({ data: { email: 'clerk@bbmb.gov.in', role: 'CLERK', name: 'Clerk' } })

        const request = await prisma.arrearRequest.create({
            data: {
                employeeName,
                employeeId,
                startDate,
                endDate,
                status: 'PENDING_CALC',
                initiatorId: initiator.id,
                // In a real app, we would upload images to S3/Blob and save URLs here
                // uploadedImages: images.map(img => uploadToS3(img)) 
            }
        })

        // 2. Trigger async processing (Mock for now to connect flow)
        // In prod, this would be a queue job.
        // For the "Brij Bhushan" demo, if the ID matches, we pre-fill the data
        if (employeeName.toLowerCase().includes('brij')) {
            // Simulate "Processing" time then update with Brij Bhushan data
            // We can't do essentially async work after response easily in serverless without blocking
            // So we might just set it up for the client to poll or just do it strictly here if fast.
            // Let's leave it as PENDING_CALC and let the Details page load the "Calculator" which might run client side or server side.
        }

        return NextResponse.json({ success: true, id: request.id })

    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
    }
}
