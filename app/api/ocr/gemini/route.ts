import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    console.log('Gemini API key found:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');

    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    console.log(`Processing ${files.length} images with Gemini...`);

    // Process all images
    const results = await Promise.all(files.map(file => processImageWithGemini(file)));

    // Merge results for multi-page documents
    const merged = mergeResults(results);

    return NextResponse.json(merged);

  } catch (error) {
    console.error('Gemini API error:', error);
    console.error('Error details:', error instanceof Error ? error.stack : error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process images' },
      { status: 500 }
    );
  }
}

async function processImageWithGemini(file: File) {
  // Use gemini-2.0-flash for v1 API (fast, supports image input)
  // Available models: gemini-2.5-flash, gemini-2.0-flash, gemini-2.5-pro
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // Convert File to ArrayBuffer then to base64
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  const prompt = `You are analyzing a government arrear calculation sheet from BBMB (Bhakra Beas Management Board). This document contains detailed pay calculations for an employee.

CRITICAL INSTRUCTIONS:
1. This is a TABULAR document with rows and columns
2. Extract ALL data from the table systematically - DO NOT skip any rows
3. Pay special attention to dates, amounts, and percentages
4. The table typically has these columns: Date, DA%, Basic Pay, Grade Pay, HRA, Total Due, Total Drawn, Arrear

EXTRACT THE FOLLOWING DATA:

**Employee Information:**
- Employee Name (usually at top of document)
- Employee ID/Number
- Designation/Post (if mentioned)

**Period:**
- Start Date (first date in calculation period)
- End Date (last date in calculation period)

**Pay Events Table:**
For EACH ROW in the table, extract:
- Date (format: DD.MM.YYYY or DD/MM/YYYY)
- Basic Pay (7th CPC revised pay - usually larger amounts)
- Grade Pay (6th CPC, if present - usually smaller amounts like 4200, 4600, 4800)
- DA Percentage (Dearness Allowance % - like 119%, 125%, 131%)
- HRA (House Rent Allowance, if present)
- Event Type: Determine if this is:
  * "PROMOTION" - if there's a large jump in basic pay (>5000)
  * "INCREMENT" - if there's a small increase in basic pay (typically 3% annual increment)
  * "REVISION" - if only DA% changes but basic pay stays same
  * "NORMAL" - otherwise

**Calculations:**
- Total Due (sum of all "Due" amounts or "7th CPC" amounts or "Revised Pay" amounts)
- Total Drawn (sum of all "Drawn" amounts or "6th CPC" amounts or "Old Pay" amounts)
- Net Arrear (Total Due - Total Drawn, also called "Payable" or "Arrear Amount")
- If there are period-wise breakdowns in the table, extract each period with its amounts

**IMPORTANT RULES:**
- Extract EVERY single row from the table - if there are 20 rows, I need 20 pay events
- If a cell is empty or unclear, use null
- For dates, maintain DD.MM.YYYY format
- For amounts, extract only numbers (remove ₹, commas, or any currency symbols)
- Be precise with percentages - include the exact number
- Look for both horizontal and vertical table layouts
- Some sheets have multiple sections - extract all of them

**COMMON TABLE PATTERNS:**
Pattern 1: Period | DA% | Basic | Grade Pay | DA Amount | Total Due | Total Drawn | Arrear
Pattern 2: Date | Revised Pay | Old Pay | Difference
Pattern 3: From-To | Days | Basic | DA% | Due | Drawn | Net

Return the data in this EXACT JSON format (no markdown, just pure JSON):
{
  "employeeInfo": {
    "name": "string",
    "employeeId": "string",
    "designation": "string or null"
  },
  "period": {
    "startDate": "DD.MM.YYYY",
    "endDate": "DD.MM.YYYY"
  },
  "payEvents": [
    {
      "date": "DD.MM.YYYY",
      "basicPay": number,
      "gradePay": number or null,
      "daPercent": number,
      "hra": number or null,
      "eventType": "NORMAL|INCREMENT|PROMOTION|REVISION"
    }
  ],
  "calculations": {
    "totalDue": number,
    "totalDrawn": number,
    "netArrear": number,
    "periodBreakdowns": [
      {
        "period": "string",
        "due": number,
        "drawn": number,
        "arrear": number
      }
    ] or null
  },
  "confidence": number (0.0 to 1.0, your confidence in this extraction)
}`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: file.type,
        data: base64
      }
    }
  ]);

  const response = await result.response;
  const text = response.text();

  // Extract JSON from response (Gemini sometimes wraps it in markdown)
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse Gemini response as JSON');
  }

  const extractedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
  return extractedData;
}

function mergeResults(results: any[]) {
  if (results.length === 1) {
    return results[0];
  }

  // Merge strategy: Use first page for metadata, combine all pay events, use last page for totals
  const merged = {
    employeeInfo: results[0].employeeInfo,
    period: results[0].period,
    payEvents: results.flatMap((r: any) => r.payEvents),
    calculations: results[results.length - 1].calculations,
    confidence: results.reduce((sum: number, r: any) => sum + r.confidence, 0) / results.length
  };

  // Remove duplicate pay events (same date)
  const uniqueEvents = new Map();
  merged.payEvents.forEach((event: any) => {
    uniqueEvents.set(event.date, event);
  });
  merged.payEvents = Array.from(uniqueEvents.values());

  return merged;
}
