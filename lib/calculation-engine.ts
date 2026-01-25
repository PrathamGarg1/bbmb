
import { addDays, differenceInDays, endOfMonth, format, isAfter, isBefore, isSameDay, startOfMonth, subDays } from 'date-fns'

interface PayEvent {
    date: Date
    basicPay: number
    type: string
    drawnBasicPay?: number
    drawnGradePay?: number
    drawnIR?: number
}

interface DARate {
    effectiveDate: Date
    percentage: number
    type?: 'REVISED' | 'PRE_REVISED'
}

interface Segment {
    startDate: Date
    endDate: Date
    days: number

    // Due
    basicPay: number
    daRate: number
    daPercentage: number
    monthlyDueTotal: number // Added for Display

    // Drawn
    drawnBasicPay: number
    drawnGradePay: number
    drawnIR: number
    drawnDA: number
    drawnDAPercentage: number
    drawnTotal: number // This is the Monthly Total usually

    totalDue: number
    totalDrawn: number

    durationLabel: string // "5 M" or "22 D"
}

interface CalculationRequest {
    startDate: Date
    endDate: Date
    payEvents: PayEvent[]
    daRates: DARate[]
}

export function calculateArrears(req: CalculationRequest): Segment[] {
    const { startDate, endDate, payEvents, daRates } = req

    const revisedDARates = daRates.filter(d => d.type !== 'PRE_REVISED')
    const preRevisedDARates = daRates.filter(d => d.type === 'PRE_REVISED')

    // 1. Identify Critical Dates
    const boundaries = new Set<string>()
    boundaries.add(format(startDate, 'yyyy-MM-dd'))
    boundaries.add(format(addDays(endDate, 1), 'yyyy-MM-dd'))

    // 1st of every month
    let iter = startOfMonth(startDate)
    if (isBefore(iter, startDate)) iter = startOfMonth(addDays(iter, 35))
    while (isBefore(iter, addDays(endDate, 1))) {
        boundaries.add(format(iter, 'yyyy-MM-dd'))
        iter = addDays(endOfMonth(iter), 1)
    }

    // Pay Events
    payEvents.forEach(e => {
        if (isAfter(e.date, startDate) && isBefore(e.date, addDays(endDate, 1))) {
            boundaries.add(format(e.date, 'yyyy-MM-dd'))
        }
    })

    // DA Changes
    daRates.forEach(d => {
        if (isAfter(d.effectiveDate, startDate) && isBefore(d.effectiveDate, addDays(endDate, 1))) {
            boundaries.add(format(d.effectiveDate, 'yyyy-MM-dd'))
        }
    })

    const sortedDates = Array.from(boundaries).sort().map(d => new Date(d))
    const segments: Segment[] = []

    for (let i = 0; i < sortedDates.length - 1; i++) {
        const segStart = sortedDates[i]
        const segEnd = subDays(sortedDates[i + 1], 1)

        // Find active Pay Event
        const activePayEvent = payEvents
            .filter(e => isBefore(e.date, addDays(segStart, 1)))
            .sort((a, b) => b.date.getTime() - a.date.getTime())[0]

        const basicPay = activePayEvent ? activePayEvent.basicPay : 0
        const drawnBP = activePayEvent?.drawnBasicPay || 0
        const drawnGP = activePayEvent?.drawnGradePay || 0
        const drawnIR = activePayEvent?.drawnIR || 0

        // Find DA Rates
        const activeRevDA = revisedDARates
            .filter(d => isBefore(d.effectiveDate, addDays(segStart, 1)))
            .sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime())[0]
        const revDAPct = activeRevDA ? activeRevDA.percentage : 0

        const activePreRevDA = preRevisedDARates
            .filter(d => isBefore(d.effectiveDate, addDays(segStart, 1)))
            .sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime())[0]
        const preRevDAPct = activePreRevDA ? activePreRevDA.percentage : 0

        const daysInSeg = differenceInDays(segEnd, segStart) + 1
        // Used for denominator
        const daysInMonth = differenceInDays(endOfMonth(segStart), startOfMonth(segStart)) + 1

        // CALCULATION LOGIC (30-day basis)
        const isFullMonth = isSameDay(startOfMonth(segStart), segStart) && isSameDay(endOfMonth(segEnd), segEnd)

        // 1. DUE
        const monthlyDueDA = Math.round(basicPay * (revDAPct / 100))
        const monthlyTotalDue = basicPay + monthlyDueDA

        // 2. DRAWN
        const drawnForDA = drawnBP + drawnGP + drawnIR
        const monthlyDrawnDA = Math.round(drawnForDA * (preRevDAPct / 100))
        const monthlyTotalDrawn = drawnBP + drawnGP + drawnIR + monthlyDrawnDA

        // Pro-Rata
        let segmentDue, segmentDrawn, durationLabel

        if (isFullMonth) {
            segmentDue = monthlyTotalDue
            segmentDrawn = monthlyTotalDrawn
            durationLabel = "1 M"
        } else {
            // Use Actual Days in Month for denominator (matches Reference Sheet logic for May 2018)
            segmentDue = Math.round(monthlyTotalDue * (daysInSeg / daysInMonth))
            segmentDrawn = Math.round(monthlyTotalDrawn * (daysInSeg / daysInMonth))
            durationLabel = `${daysInSeg} D`
        }

        segments.push({
            startDate: segStart,
            endDate: segEnd,
            days: daysInSeg,

            basicPay,
            daRate: monthlyDueDA,
            daPercentage: revDAPct,
            monthlyDueTotal: monthlyTotalDue,

            drawnBasicPay: drawnBP,
            drawnGradePay: drawnGP,
            drawnIR: drawnIR,
            drawnDA: monthlyDrawnDA,
            drawnDAPercentage: preRevDAPct,
            drawnTotal: monthlyTotalDrawn, // Monthly Rate

            totalDue: segmentDue, // Pro-rated
            totalDrawn: segmentDrawn, // Pro-rated

            durationLabel
        })
    }

    return segments
}
