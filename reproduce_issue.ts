import { calculateArrears } from './lib/calculation-engine';

// TEST CASE: DEC 2020 SPLIT (2 Days + 29 Days)
// Goal: Match the Manual Sheet values EXACTLY.

const startDate = new Date('2020-12-01');
const endDate = new Date('2020-12-31');

const daRates = [
    { effectiveDate: new Date('2019-07-01'), percentage: 17, type: 'REVISED' },     // 7th CPC (17%)
    { effectiveDate: new Date('2019-07-01'), percentage: 164, type: 'PRE_REVISED' } // 6th CPC (164%)
];
// @ts-ignore
daRates[0].type = 'REVISED';
// @ts-ignore
daRates[1].type = 'PRE_REVISED';

const payEvents = [
    // 1. Dec 1-2 (2 Days) - USING MONTHLY RATES
    // Derived from Manual Sheet: 
    // BP Drawn 1308 for 2 days -> Rate = 1308 * 31/2 = ~20274 (matches Nov rate 20270)
    // Let's use the explicit rates from Nov 2020 row.
    {
        date: new Date('2020-12-01'),
        basicPay: 66200,      // 7th CPC Monthly Rate
        type: 'INITIAL_PAY',
        drawnBasicPay: 20270, // 6th CPC Monthly Rate
        drawnGradePay: 4700,  // 6th CPC Monthly Rate
        drawnIR: 1249         // 6th CPC Monthly Rate
    },
    // 2. Dec 3-31 (29 Days) - NEW RATES
    // Manual Sheet: BP 10544? -> 10544 * 31/29 = 11271? 
    // Wait, let's look at Jan 2021. BP 66300.
    // Let's deduce 7th CPC Rate for this period.
    // Sheet says "BP: 62023" for 29 days. 62023 / 29 * 31 = 66300.
    // So Rate is 66300.
    {
        date: new Date('2020-12-03'),
        basicPay: 66300,      // 7th CPC Monthly Rate (Increment?)
        type: 'INITIAL_PAY', // Likely Annual Increment or similar
        drawnBasicPay: 20270, // Stays same
        drawnGradePay: 5300,  // Changed? Sheet Jan-21 has 5300. So yes.
        drawnIR: 1281         // Changed? Sheet Jan-21 has 1281. So yes.
    }
];

const segments = calculateArrears({
    startDate,
    endDate,
    // @ts-ignore
    payEvents,
    // @ts-ignore
    daRates
});

console.log("----------------------------------------------------------------");
console.log("VERIFICATION TEST: Dec 2020");
console.log("----------------------------------------------------------------");

// Check Segment 1: Dec 1-2
const seg1 = segments.find(s => s.startDate.getDate() === 1);
if (seg1) {
    console.log(`\nSegment 1: Dec 1-2 (${seg1.days} Days)`);
    console.log(`EXPECTED (Manual Sheet):`);
    console.log(`  Drawn Total: ~4467 (1308+303+81 + DA 2775)`);
    console.log(`  Due Total:   ~4997 (4271 + DA 726)`);
    console.log(`  Net Arrear:  530`);

    console.log(`ACTUAL (System Calculation):`);
    console.log(`  Drawn Total: ${seg1.totalDrawn}`);
    console.log(`  Due Total:   ${seg1.totalDue}`);
    console.log(`  Net Arrear:  ${seg1.totalDue - seg1.totalDrawn}`);

    const diff = Math.abs((seg1.totalDue - seg1.totalDrawn) - 530);
    if (diff < 5) console.log("✅ MATCH CONFIRMED (within rounding tolerance)");
    else console.log("❌ MISMATCH");
}

// Check Segment 2: Dec 3-31
const seg2 = segments.find(s => s.startDate.getDate() === 3);
if (seg2) {
    console.log(`\nSegment 2: Dec 3-31 (${seg2.days} Days)`);
    // Manual Sheet (approx from image 2):
    // Drawn: 18962(BP)+5005(GP)+1198(IR) = 25165. DA(164%) = 41270. Total = 66435?
    // Due: 62023(BP) + 10544(DA 17%) = 72567.
    // Diff: 72567 - 66436 = 6131?
    // Image 2 row "03.12.2020" shows Diff 6131 (or similar? 5005... 1281? wait.)

    console.log(`ACTUAL (System Calculation):`);
    console.log(`  Drawn Total: ${seg2.totalDrawn}`);
    console.log(`  Due Total:   ${seg2.totalDue}`);
    console.log(`  Net Arrear:  ${seg2.totalDue - seg2.totalDrawn}`);
}
