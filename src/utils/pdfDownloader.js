import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';

/**
 * Downloads a multi-page A4 report container as a PDF file with exact A4 dimensions.
 * Iterates through each .report-page element to ensure 100% clean page breaks without overflow.
 * 
 * @param {HTMLElement} containerElement - The container element holding .report-page elements
 * @param {string} filename - Desired filename without .pdf extension
 * @param {function} onProgress - Optional callback for progress: (current, total) => {}
 * @returns {Promise<boolean>}
 */
export async function downloadReportAsPdf(containerElement, filename = 'Rapor_Siswa', onProgress) {
  if (!containerElement) {
    throw new Error('Container element not found');
  }

  // Find all individual report page elements
  const pageElements = containerElement.querySelectorAll('.report-page');
  const pagesToRender = pageElements.length > 0 
    ? Array.from(pageElements) 
    : [containerElement];

  const totalPages = pagesToRender.length;
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  // Temporarily reset any CSS transforms so html2canvas captures at true 100% scale
  const originalTransform = containerElement.style.transform;
  const originalTransformOrigin = containerElement.style.transformOrigin;
  containerElement.style.transform = 'none';
  containerElement.style.transformOrigin = 'top left';

  try {
    for (let i = 0; i < totalPages; i++) {
      if (typeof onProgress === 'function') {
        onProgress(i + 1, totalPages);
      }

      const pageEl = pagesToRender[i];

      // Capture single page with high resolution (scale: 2 is sharp yet efficient)
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollY: -window.scrollY,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }

      // Add image to full A4 page: 210mm x 297mm
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    }

    const cleanFilename = filename.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'Rapor_Siswa';
    pdf.save(`${cleanFilename}.pdf`);
    return true;
  } finally {
    // Restore original transform
    containerElement.style.transform = originalTransform;
    containerElement.style.transformOrigin = originalTransformOrigin;
  }
}
