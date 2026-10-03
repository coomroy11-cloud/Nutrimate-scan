/**
 * Image Quality Assessment for NutriMed Scan AI
 * Evaluates image brightness, contrast, and sharpness using HTML5 Canvas
 */

export interface ImageQualityReport {
  isQualityGood: boolean;
  brightnessScore: number; // 0 - 100
  sharpnessScore: number;  // 0 - 100
  issue: 'none' | 'dark' | 'bright' | 'blurry' | 'low_contrast';
  warningMessage?: string;
  details: string;
}

export function assessImageQuality(dataUrl: string): Promise<ImageQualityReport> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        // Sample down to manageable size for fast computation
        const maxDim = 320;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            isQualityGood: true,
            brightnessScore: 70,
            sharpnessScore: 70,
            issue: 'none',
            details: 'ไม่สามารถประมวลผลพิกเซลได้ ข้ามการตรวจสอบ',
          });
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        let totalBrightness = 0;
        const grayPixels: number[] = new Array(w * h);

        // 1. Calculate average brightness & convert to grayscale
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Standard perceived luminance formula
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          totalBrightness += lum;
          grayPixels[i / 4] = lum;
        }

        const avgBrightness = totalBrightness / (w * h);
        const brightnessScore = Math.min(100, Math.round((avgBrightness / 255) * 100));

        // 2. Measure high-frequency edge sharpness using Laplacian gradient approximation
        let edgeSum = 0;
        let edgeSamples = 0;

        for (let y = 1; y < h - 1; y += 2) {
          for (let x = 1; x < w - 1; x += 2) {
            const idx = y * w + x;
            // Approximate Laplacian: 4 * center - top - bottom - left - right
            const center = grayPixels[idx];
            const top = grayPixels[idx - w];
            const bottom = grayPixels[idx + w];
            const left = grayPixels[idx - 1];
            const right = grayPixels[idx + 1];

            const laplacian = Math.abs(4 * center - top - bottom - left - right);
            edgeSum += laplacian;
            edgeSamples++;
          }
        }

        const avgEdge = edgeSamples > 0 ? edgeSum / edgeSamples : 0;
        // Normal text/labels typically have edge gradients > 12
        const sharpnessScore = Math.min(100, Math.round((avgEdge / 35) * 100));

        // Quality rules
        let issue: 'none' | 'dark' | 'bright' | 'blurry' | 'low_contrast' = 'none';
        let isQualityGood = true;
        let warningMessage: string | undefined = undefined;
        let details = 'ภาพมีความสว่างและคมชัดในเกณฑ์มาตรฐาน';

        if (avgBrightness < 45) {
          issue = 'dark';
          isQualityGood = false;
          warningMessage = 'ภาพอาจไม่ชัดพอสำหรับการวิเคราะห์ กรุณาถ่ายภาพใหม่';
          details = 'ภาพมืดเกินไป แสงสว่างไม่เพียงพอต่อการอ่านข้อความบนฉลาก';
        } else if (avgBrightness > 242) {
          issue = 'bright';
          isQualityGood = false;
          warningMessage = 'ภาพอาจไม่ชัดพอสำหรับการวิเคราะห์ กรุณาถ่ายภาพใหม่';
          details = 'ภาพสว่างจ้าเกินไป มีแสงสะท้อนหรือแสงแฟลชบังตัวอักษร';
        } else if (avgEdge < 6.5) {
          issue = 'blurry';
          isQualityGood = false;
          warningMessage = 'ภาพอาจไม่ชัดพอสำหรับการวิเคราะห์ กรุณาถ่ายภาพใหม่';
          details = 'ภาพเบลอหรือไม่โฟกัส เส้นตัวหนังสือไม่คมชัด';
        }

        resolve({
          isQualityGood,
          brightnessScore,
          sharpnessScore,
          issue,
          warningMessage,
          details,
        });
      } catch (e) {
        console.warn('Quality check calculation error:', e);
        resolve({
          isQualityGood: true,
          brightnessScore: 70,
          sharpnessScore: 70,
          issue: 'none',
          details: 'พร้อมวิเคราะห์ฉลาก',
        });
      }
    };

    img.onerror = () => {
      resolve({
        isQualityGood: false,
        brightnessScore: 0,
        sharpnessScore: 0,
        issue: 'blurry',
        warningMessage: 'ภาพอาจไม่ชัดพอสำหรับการวิเคราะห์ กรุณาถ่ายภาพใหม่',
        details: 'ไม่สามารถโหลดภาพได้',
      });
    };

    img.src = dataUrl;
  });
}
