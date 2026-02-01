import Tesseract from 'tesseract.js';

interface OCRResult {
    text: string;
    confidence: number;
}

interface ExtractedData {
    periods: Array<{ start: string; end: string }>;
    amounts: number[];
    daRates: number[];
    totals: number[];
    confidence: number;
}

export const processImage = async (imageFile: File): Promise<OCRResult> => {
    try {
        const result = await Tesseract.recognize(imageFile, 'eng', {
            logger: (m) => console.log(m),
        });

        return {
            text: result.data.text,
            confidence: result.data.confidence,
        };
    } catch (error) {
        console.error('OCR Error:', error);
        throw new Error('Failed to process image');
    }
};

export const extractCalculationData = (ocrText: string): ExtractedData => {
    const lines = ocrText.split('\n').filter(line => line.trim().length > 0);

    const periods: Array<{ start: string; end: string }> = [];
    const amounts: number[] = [];
    const daRates: number[] = [];
    const totals: number[] = [];

    // Pattern matching for dates (dd.MM.yy format)
    const datePattern = /(\d{2}\.\d{2}\.\d{2})\s*(?:to|-)\s*(\d{2}\.\d{2}\.\d{2})/gi;

    // Pattern for DA percentages
    const daPattern = /(\d{1,3})%/g;

    // Pattern for amounts (numbers with optional commas)
    const amountPattern = /\b(\d{1,3}(?:,?\d{3})*)\b/g;

    // Extract periods
    let dateMatch;
    while ((dateMatch = datePattern.exec(ocrText)) !== null) {
        periods.push({
            start: dateMatch[1],
            end: dateMatch[2],
        });
    }

    // Extract DA rates
    let daMatch;
    while ((daMatch = daPattern.exec(ocrText)) !== null) {
        const rate = parseInt(daMatch[1]);
        if (rate >= 0 && rate <= 200) { // Reasonable DA rate range
            daRates.push(rate);
        }
    }

    // Extract amounts
    let amountMatch;
    while ((amountMatch = amountPattern.exec(ocrText)) !== null) {
        const amount = parseInt(amountMatch[1].replace(/,/g, ''));
        if (amount > 1000 && amount < 1000000) { // Reasonable amount range
            amounts.push(amount);
        }
    }

    // Look for total arrear (usually at the bottom)
    const totalPattern = /total.*?(\d{1,3}(?:,?\d{3})*)/gi;
    let totalMatch;
    while ((totalMatch = totalPattern.exec(ocrText)) !== null) {
        const total = parseInt(totalMatch[1].replace(/,/g, ''));
        totals.push(total);
    }

    return {
        periods,
        amounts,
        daRates,
        totals,
        confidence: 0.7, // Base confidence, can be improved with ML
    };
};

export const compareWithCalculation = (
    extractedData: ExtractedData,
    systemSegments: any[],
    systemTotal: number
): {
    matches: number;
    mismatches: number;
    accuracy: number;
    details: Array<{ field: string; extracted: any; system: any; match: boolean }>;
} => {
    const details: Array<{ field: string; extracted: any; system: any; match: boolean }> = [];
    let matches = 0;
    let mismatches = 0;

    // Compare total arrear
    if (extractedData.totals.length > 0) {
        const extractedTotal = extractedData.totals[extractedData.totals.length - 1];
        const tolerance = systemTotal * 0.02; // 2% tolerance
        const match = Math.abs(extractedTotal - systemTotal) <= tolerance;

        details.push({
            field: 'Total Arrear',
            extracted: extractedTotal,
            system: systemTotal,
            match,
        });

        if (match) matches++;
        else mismatches++;
    }

    // Compare number of periods
    const periodCountMatch = extractedData.periods.length === systemSegments.length;
    details.push({
        field: 'Number of Periods',
        extracted: extractedData.periods.length,
        system: systemSegments.length,
        match: periodCountMatch,
    });

    if (periodCountMatch) matches++;
    else mismatches++;

    // Compare DA rates (sample check)
    const systemDARates = systemSegments.map(s => s.daPercentage);
    const uniqueSystemDA = [...new Set(systemDARates)];
    const uniqueExtractedDA = [...new Set(extractedData.daRates)];

    const daRateMatch = uniqueExtractedDA.some(rate => uniqueSystemDA.includes(rate));
    details.push({
        field: 'DA Rates Present',
        extracted: uniqueExtractedDA.join(', ') + '%',
        system: uniqueSystemDA.join(', ') + '%',
        match: daRateMatch,
    });

    if (daRateMatch) matches++;
    else mismatches++;

    const accuracy = (matches / (matches + mismatches)) * 100;

    return {
        matches,
        mismatches,
        accuracy,
        details,
    };
};
