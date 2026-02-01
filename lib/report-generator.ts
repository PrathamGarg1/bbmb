import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface ComprehensiveReportData {
    employeeName: string;
    employeeId: string;
    startDate: Date;
    endDate: Date;
    segments: any[];
    totalArrear: number;
    status: string;
    verificationResult?: {
        ocrConfidence: number;
        extractedData: any;
        comparison: {
            accuracy: number;
            matches: number;
            mismatches: number;
            details: Array<{ field: string; extracted: any; system: any; match: boolean }>;
        };
    };
    uploadedImages?: string[]; // Base64 encoded images
}

export const generateComprehensiveReport = (data: ComprehensiveReportData) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    let yPos = 15;

    // ===== HEADER =====
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('BBMB ARREAR VERIFICATION REPORT', 105, yPos, { align: 'center' });

    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 105, yPos, { align: 'center' });

    yPos += 15;

    // ===== EMPLOYEE DETAILS =====
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Employee Information', 14, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${data.employeeName}`, 14, yPos);
    yPos += 5;
    doc.text(`ID: ${data.employeeId}`, 14, yPos);
    yPos += 5;
    doc.text(`Period: ${format(data.startDate, 'dd MMM yyyy')} to ${format(data.endDate, 'dd MMM yyyy')}`, 14, yPos);
    yPos += 5;
    doc.text(`Status: ${data.status}`, 14, yPos);
    yPos += 10;

    // ===== VERIFICATION SUMMARY (if available) =====
    if (data.verificationResult) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Verification Summary', 14, yPos);
        yPos += 7;

        const accuracy = data.verificationResult.comparison.accuracy;
        const color = accuracy >= 80 ? [34, 197, 94] : accuracy >= 60 ? [234, 179, 8] : [239, 68, 68];

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`OCR Confidence: ${(data.verificationResult.ocrConfidence * 100).toFixed(1)}%`, 14, yPos);
        yPos += 5;

        doc.setTextColor(color[0], color[1], color[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(`Overall Accuracy: ${accuracy.toFixed(1)}%`, 14, yPos);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        yPos += 5;

        doc.text(`Matches: ${data.verificationResult.comparison.matches} | Mismatches: ${data.verificationResult.comparison.mismatches}`, 14, yPos);
        yPos += 10;

        // Verification Details Table
        if (data.verificationResult.comparison.details.length > 0) {
            const detailsData = data.verificationResult.comparison.details.map(d => [
                d.field,
                String(d.extracted),
                String(d.system),
                d.match ? '✓ Match' : '✗ Mismatch'
            ]);

            (doc as any).autoTable({
                head: [['Field', 'Extracted Value', 'System Value', 'Status']],
                body: detailsData,
                startY: yPos,
                theme: 'grid',
                styles: { fontSize: 9 },
                headStyles: { fillColor: [59, 130, 246] },
                columnStyles: {
                    3: {
                        cellWidth: 25,
                        fontStyle: 'bold'
                    }
                },
                didParseCell: function (data: any) {
                    if (data.column.index === 3 && data.cell.section === 'body') {
                        if (data.cell.raw.includes('Match')) {
                            data.cell.styles.textColor = [34, 197, 94];
                        } else {
                            data.cell.styles.textColor = [239, 68, 68];
                        }
                    }
                }
            });

            yPos = (doc as any).lastAutoTable.finalY + 10;
        }
    }

    // ===== CALCULATION SUMMARY =====
    if (yPos > 240) {
        doc.addPage();
        yPos = 15;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Calculation Summary', 14, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Segments: ${data.segments.length}`, 14, yPos);
    yPos += 5;
    doc.text(`Total Arrear Payable: ₹${data.totalArrear.toLocaleString()}`, 14, yPos);
    yPos += 10;

    // ===== DETAILED CALCULATION TABLE =====
    const calcHeaders = [
        'Period',
        'DA%',
        'Basic',
        'Total Due',
        'Total Drawn',
        'Net Arrear'
    ];

    const calcData = data.segments.map(seg => [
        `${format(new Date(seg.startDate), 'dd.MM.yy')} - ${format(new Date(seg.endDate), 'dd.MM.yy')}`,
        `${seg.daPercentage}%`,
        seg.basicPay,
        seg.monthlyDueTotal,
        seg.drawnTotal,
        Math.round(seg.totalDue - seg.totalDrawn)
    ]);

    (doc as any).autoTable({
        head: [calcHeaders],
        body: calcData,
        startY: yPos,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
        columnStyles: {
            0: { cellWidth: 35 },
            5: { fontStyle: 'bold' }
        }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // ===== FOOTER =====
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(
            `Page ${i} of ${pageCount}`,
            105,
            290,
            { align: 'center' }
        );
        doc.text(
            'BBMB Arrear Calculation System - Confidential',
            105,
            285,
            { align: 'center' }
        );
    }

    // Save the PDF
    doc.save(`Verification_Report_${data.employeeName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
};
