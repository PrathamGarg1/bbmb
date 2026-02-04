
import { calculateArrears } from '../lib/calculation-engine';

// Define the reference data from the user's manual sheet (Brij Bhushan)
const payEvents = [
    { date: new Date('2016-01-01'), basicPay: 52500, type: 'INITIAL PAY', drawnBasicPay: 15640, drawnGradePay: 4300, drawnIR: 997 },
    { date: new Date('2016-09-01'), basicPay: 54100, type: 'INITIAL PAY', drawnBasicPay: 16240, drawnGradePay: 4300, drawnIR: 1027 }, // Sep-16
    // Note: The manual sheet lists increments. We need to match the "Segments" logic.
    // In the manual sheet, inputs are likely Annual Increments.
    // Let's populate the clear transitions derived from the "Period" column where Basic Pay changes.
    { date: new Date('2017-09-01'), basicPay: 55700, type: 'INCREMENT', drawnBasicPay: 16860, drawnGradePay: 4300, drawnIR: 1058 },
    { date: new Date('2018-09-01'), basicPay: 13393, type: 'SPLIT START', drawnBasicPay: 4083, drawnGradePay: 1003, drawnIR: 254 }, // 7 Days
    { date: new Date('2018-09-08'), basicPay: 45310, type: 'SPLIT MID', drawnBasicPay: 13923, drawnGradePay: 3297, drawnIR: 861 },  // 23 Days
    { date: new Date('2018-10-01'), basicPay: 59100, type: 'INCREMENT', drawnBasicPay: 18160, drawnGradePay: 4300, drawnIR: 1123 },
    { date: new Date('2019-02-01'), basicPay: 42214, type: 'SPLIT START', drawnBasicPay: 12971, drawnGradePay: 3071, drawnIR: 802 }, // 20 Days
    { date: new Date('2019-02-21'), basicPay: 17314, type: 'SPLIT MID', drawnBasicPay: 5189, drawnGradePay: 1343, drawnIR: 327 }, // 8 Days
    { date: new Date('2019-03-01'), basicPay: 60600, type: 'INCREMENT', drawnBasicPay: 18160, drawnGradePay: 4700, drawnIR: 1143 },
    { date: new Date('2019-09-01'), basicPay: 64300, type: 'INCREMENT', drawnBasicPay: 19540, drawnGradePay: 4700, drawnIR: 1212 },
    { date: new Date('2020-09-01'), basicPay: 66200, type: 'INCREMENT', drawnBasicPay: 20270, drawnGradePay: 4700, drawnIR: 1249 },
    { date: new Date('2020-12-01'), basicPay: 4271, type: 'SPLIT START', drawnBasicPay: 1308, drawnGradePay: 303, drawnIR: 81 },   // 2 Days
    { date: new Date('2020-12-03'), basicPay: 62023, type: 'SPLIT MID', drawnBasicPay: 18962, drawnGradePay: 5005, drawnIR: 1198 }, // 29 Days
    { date: new Date('2021-01-01'), basicPay: 66300, type: 'INCREMENT', drawnBasicPay: 20270, drawnGradePay: 5300, drawnIR: 1281 },
];

const daRates = [
    { effectiveDate: new Date('2016-01-01'), percentage: 0, type: undefined },   // Rev 0%
    { effectiveDate: new Date('2016-01-01'), percentage: 125, type: 'PRE_REVISED' }, // Pre-Rev 125%

    { effectiveDate: new Date('2016-07-01'), percentage: 2, type: undefined },
    { effectiveDate: new Date('2016-07-01'), percentage: 132, type: 'PRE_REVISED' },

    { effectiveDate: new Date('2017-01-01'), percentage: 4, type: undefined },
    { effectiveDate: new Date('2017-01-01'), percentage: 136, type: 'PRE_REVISED' },

    { effectiveDate: new Date('2017-07-01'), percentage: 5, type: undefined },
    { effectiveDate: new Date('2017-07-01'), percentage: 139, type: 'PRE_REVISED' },

    { effectiveDate: new Date('2018-01-01'), percentage: 7, type: undefined },
    { effectiveDate: new Date('2018-01-01'), percentage: 142, type: 'PRE_REVISED' },

    { effectiveDate: new Date('2018-07-01'), percentage: 9, type: undefined },
    { effectiveDate: new Date('2018-07-01'), percentage: 148, type: 'PRE_REVISED' },

    { effectiveDate: new Date('2019-01-01'), percentage: 12, type: undefined },
    { effectiveDate: new Date('2019-01-01'), percentage: 154, type: 'PRE_REVISED' },

    { effectiveDate: new Date('2019-07-01'), percentage: 17, type: undefined },
    { effectiveDate: new Date('2019-07-01'), percentage: 164, type: 'PRE_REVISED' },
] as any[];

function runTest() {
    console.log('Running Robustness Test for Brij Bhushan Case...');

    // Request spanning the full period to verify all months including Jan 2016
    const segments = calculateArrears({
        startDate: new Date('2016-01-01'),
        endDate: new Date('2021-06-30'),
        payEvents,
        daRates
    });

    console.log(`Generated ${segments.length} segments.`);

    // --- CHECK 1: JANUARY 2016 (Missing Jan Bug) ---
    const jan2016 = segments.find(s => s.startDate.getTime() === new Date('2016-01-01').getTime());
    if (!jan2016) {
        console.error('FAIL: January 2016 segment is MISSING.');
    } else {
        const net = Math.round(jan2016.totalDue - jan2016.totalDrawn);
        const expected = 5392; // From user manual sheet
        if (net === expected) {
            console.log('PASS: Jan 2016 Net is correct: ' + net);
        } else {
            console.error(`FAIL: Jan 2016 Net mismatch. Got ${net}, Expected ${expected}`);
            console.log('Debug Jan 2016:', JSON.stringify(jan2016, null, 2));
        }
    }

    // --- CHECK 2: FEB 2019 SPLIT (Double Proration Bug) ---
    // User complaint: 01.02.19 - 20.02.19 (20 Days)
    // Pay used in script: Due BP 42214, Drawn BP 12971
    // Expected Net: 4496 (The shortage), but previously got 3211.
    const splitFeb = segments.find(s => s.startDate.getTime() === new Date('2019-02-01').getTime());
    if (!splitFeb) {
        console.error('FAIL: Feb 2019 Split segment MISSING.');
    } else {
        // Due Calculation:
        // Basic: 42214. DA 12% = 5066 (rounded). Total Due = 47280. 
        // Drawn Calculation: 
        // BP 12971 + GP 3071 + IR 802 = 16844. 
        // DA 154% = 25940 (rounded).
        // Total Drawn = 16844 + 25940 = 42784.
        // Difference = 47280 - 42784 = 4496.

        const net = Math.round(splitFeb.totalDue - splitFeb.totalDrawn);
        // The user says "Current wrong formula gives 3211".
        // My fix (removing proration) should yield 4496.

        console.log('Feb 2019 Split Check:');
        console.log(`  Total Due: ${splitFeb.totalDue} (Expected ~47280)`);
        console.log(`  Total Drawn: ${splitFeb.totalDrawn} (Expected ~42784)`);
        console.log(`  Net Arrear: ${net} (Expected 4496)`);

        if (Math.abs(net - 4496) <= 5) { // Tolerance for minor rounding
            console.log('PASS: Feb 2019 Split matches user expectation (No Double Proration).');
        } else {
            console.error(`FAIL: Feb 2019 Split mismatch. Got ${net}, Expected ~4496`);
        }
    }

    // --- CHECK 3: OVERALL TOTAL ---
    // Sum of all segments
    const totalArrear = segments.reduce((sum, seg) => sum + (seg.totalDue - seg.totalDrawn), 0);
    console.log(`Total Arrear Calculated: ${Math.round(totalArrear)}`);
    // User sheet "Net Arrear Payable: 409,349"
    // Let's see how close we get.
    console.log(`User Expected Total: 409,349`);
    const diff = Math.abs(totalArrear - 409349);
    const accuracy = (1 - (diff / 409349)) * 100;
    console.log(`Accuracy: ${accuracy.toFixed(2)}%`);

    if (accuracy > 99.5) {
        console.log('PASS: Overall Accuracy is excellent.');
    } else {
        console.warn('WARN: Overall Accuracy is below 99.5%. Check other months.');
    }

}

runTest();
