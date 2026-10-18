'use client';

import imageCompression from 'browser-image-compression';

/**
 * Phone cameras produce 4-12MB files. Two different sizes are needed:
 *
 *  - `display`: what customers see. Big enough to judge a border, small enough
 *    to load on a patchy mobile connection.
 *  - `forTagging`: sent to the model, at 1280px on the long edge. Matched
 *    against her own sarees, 1280px with medium effort found the right bill
 *    line more often than 768px did, without ever choosing a wrong one.
 */
export async function prepareSareePhoto(file: File): Promise<{
  display: File;
  taggingBase64: string;
  mediaType: 'image/jpeg';
}> {
  const display = await imageCompression(file, {
    maxWidthOrHeight: 1600,
    maxSizeMB: 0.6,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.82,
  });

  const small = await imageCompression(file, {
    maxWidthOrHeight: 1280,
    maxSizeMB: 0.35,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.78,
  });

  return {
    display,
    taggingBase64: await toBase64(small),
    mediaType: 'image/jpeg',
  };
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(',') + 1)); // strip the data: prefix
    };
    reader.onerror = () => reject(new Error('Could not read the photo'));
    reader.readAsDataURL(file);
  });
}

/**
 * A photographed bill, prepared for reading.
 *
 * Sent at 2576px on the long edge, because that is where the reading model
 * stops taking in more detail — measured on one of her own handwritten bills,
 * about 4,750 image tokens there against 1,050 at 1024px. Small handwritten
 * digits are exactly what that detail is for.
 *
 * This used to be 1024px, with a comment claiming 1024px *wide* — but the
 * limit is on the long edge, so a portrait bill actually went out at 768x1024,
 * less than even the old model could use. Measure the long edge, not the width.
 */
export async function prepareBillPhoto(file: File): Promise<{
  display: File;
  readingBase64: string;
  mediaType: 'image/jpeg';
}> {
  const display = await imageCompression(file, {
    maxWidthOrHeight: 1600,
    maxSizeMB: 0.8,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.85,
  });

  // Quality kept high: JPEG artefacts land hardest on small text, which is
  // the only thing on the page that matters. ~1-1.6MB, a second or two to
  // upload on 4G — the price of the model seeing the digits clearly.
  const forReading = await imageCompression(file, {
    maxWidthOrHeight: 2576,
    maxSizeMB: 1.6,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.86,
  });

  return {
    display,
    readingBase64: await toBase64(forReading),
    mediaType: 'image/jpeg',
  };
}
