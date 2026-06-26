import { jsPDF } from 'jspdf';

// ============================================================
// Download Quality: 2 tiers
// - Free: full resolution + watermark
// - Paid (Starter/Pro/Business): full resolution, no watermark
// Quality is always full resolution — only watermark differs
// ============================================================

/** Load image from blob */
function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(blob);
  });
}

/** Add PixCraftX watermark to canvas */
function applyWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  const fontSize = Math.max(16, Math.floor(width / 25));
  ctx.font = `${fontSize}px Arial, sans-serif`;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const text = 'PixCraftX';
  const textWidth = ctx.measureText(text).width;
  const stepX = textWidth + 60;
  const stepY = fontSize * 4;

  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 6);

  for (let y = -height; y < height; y += stepY) {
    for (let x = -width; x < width; x += stepX) {
      ctx.fillText(text, x, y);
    }
  }
  ctx.restore();
}

/** Check if user has a paid plan */
function isPaidPlan(plan: string): boolean {
  return ['starter', 'pro', 'business'].includes(plan);
}

/**
 * Download image as PNG
 * - Free: full resolution + watermark
 * - Paid: full resolution, no watermark
 */
export async function downloadPNG(
  imageUrl: string,
  filename: string,
  plan: string = 'free'
): Promise<void> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const pngFilename = filename.endsWith('.png') ? filename : `${filename}.png`;

    // Paid users: full resolution direct download, no watermark
    if (isPaidPlan(plan)) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pngFilename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return;
    }

    // Free users: full resolution + watermark
    const img = await loadImage(blob);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;

    ctx.drawImage(img, 0, 0);
    applyWatermark(ctx, canvas.width, canvas.height);

    canvas.toBlob((processedBlob) => {
      if (!processedBlob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = pngFilename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return;
      }
      const url = window.URL.createObjectURL(processedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pngFilename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 'image/png');

    URL.revokeObjectURL(img.src);
  } catch (err) {
    console.error('PNG download failed:', err);
    throw err;
  }
}

/**
 * Download image as PDF (Pro/Business only)
 * Full resolution
 */
export async function downloadPDF(
  imageUrl: string,
  filename: string
): Promise<void> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const img = await loadImage(blob);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: 'letter',
    });

    const pageWidth = 8.5;
    const pageHeight = 11;
    const margin = 0.5;
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;

    const imgAspect = img.naturalWidth / img.naturalHeight;
    let drawWidth = maxWidth;
    let drawHeight = drawWidth / imgAspect;

    if (drawHeight > maxHeight) {
      drawHeight = maxHeight;
      drawWidth = drawHeight * imgAspect;
    }

    const x = (pageWidth - drawWidth) / 2;
    const y = (pageHeight - drawHeight) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');

    pdf.addImage(dataUrl, 'PNG', x, y, drawWidth, drawHeight);

    const pdfFilename = filename.replace(/\.png$/i, '') + '.pdf';
    pdf.save(pdfFilename);

    URL.revokeObjectURL(img.src);
  } catch (err) {
    console.error('PDF download failed:', err);
    throw err;
  }
}

// ============================================================
// Permission helpers
// ============================================================

export function canExportPDF(plan: string): boolean {
  return ['pro', 'business'].includes(plan);
}

export function hasNoWatermark(plan: string): boolean {
  return isPaidPlan(plan);
}
