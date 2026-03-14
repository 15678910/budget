'use client';

import { useState, useCallback } from 'react';

interface PDFExportButtonProps {
  targetRef: React.RefObject<HTMLElement | null>;
  filename: string;
}

export function PDFExportButton({ targetRef, filename }: PDFExportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = useCallback(async () => {
    if (!targetRef.current || isGenerating) return;
    setIsGenerating(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = targetRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#09090b', // dark background
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // mm
      const contentWidth = pdfWidth - margin * 2;

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = contentWidth / imgWidth;
      const scaledHeight = imgHeight * ratio;

      // Add title
      pdf.setFontSize(10);
      pdf.setTextColor(150);
      const today = new Date().toISOString().split('T')[0];
      pdf.text(`나라살림 | ${filename} | ${today}`, margin, 7);

      // If content fits in one page
      if (scaledHeight + 10 <= pdfHeight - margin) {
        pdf.addImage(imgData, 'PNG', margin, 10, contentWidth, scaledHeight);
      } else {
        // Multi-page: slice the image
        let yOffset = 0;
        const pageContentHeight = pdfHeight - margin - 10; // subtract header space
        const sliceHeight = pageContentHeight / ratio;
        let page = 0;

        while (yOffset < imgHeight) {
          if (page > 0) {
            pdf.addPage();
            pdf.setFontSize(10);
            pdf.setTextColor(150);
            pdf.text(`나라살림 | ${filename} | ${today}`, margin, 7);
          }

          // Create a canvas slice
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = imgWidth;
          const currentSliceHeight = Math.min(sliceHeight, imgHeight - yOffset);
          sliceCanvas.height = currentSliceHeight;
          const ctx = sliceCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(canvas, 0, yOffset, imgWidth, currentSliceHeight, 0, 0, imgWidth, currentSliceHeight);
            const sliceData = sliceCanvas.toDataURL('image/png');
            const scaledSliceHeight = currentSliceHeight * ratio;
            pdf.addImage(sliceData, 'PNG', margin, 10, contentWidth, scaledSliceHeight);
          }

          yOffset += currentSliceHeight;
          page++;
        }
      }

      pdf.save(`나라살림-${filename}-${today}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [targetRef, filename, isGenerating]);

  return (
    <button
      onClick={handleExport}
      disabled={isGenerating}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
    >
      {isGenerating ? (
        <>
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          PDF 생성 중...
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <polyline points="9 15 12 18 15 15" />
          </svg>
          PDF
        </>
      )}
    </button>
  );
}
