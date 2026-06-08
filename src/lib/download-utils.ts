import { jsPDF } from 'jspdf';

/**
 * Download image as PNG with optional watermark for free users
 */
export async function downloadPNG(
  imageUrl: string,
  filename: string,
  plan: string = 'free'
): Promise<void> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    // Starter+: download clean image
    if (plan !== 'free') {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return;
    }

    // Free users: add watermark
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(blob);
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    
    ctx.drawImage(img, 0, 0);
    
    // Add watermark
    ctx.save();
    const fontSize = Math.max(16, Math.floor(canvas.width / 25));
    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const text = 'PixCraftX';
    const textWidth = ctx.measureText(text).width;
    const stepX = textWidth + 60;
    const stepY = fontSize * 4;
    
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 6);
    
    for (let y = -canvas.height; y < canvas.height; y += stepY) {
      for (let x = -canvas.width; x < canvas.width; x += stepX) {
        ctx.fillText(text, x, y);
      }
    }
    ctx.restore();
    
    canvas.toBlob((watermarkedBlob) => {
      if (!watermarkedBlob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return;
      }
      const url = window.URL.createObjectURL(watermarkedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
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
 * Download image as PDF (Pro+ only)
 */
export async function downloadPDF(
  imageUrl: string,
  filename: string
): Promise<void> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(blob);
    });

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

export function canExportPDF(plan: string): boolean {
  return ['pro', 'business'].includes(plan);
}

export function hasNoWatermark(plan: string): boolean {
  return ['starter', 'pro', 'business'].includes(plan);
}
