'use client';

import imageCompression from 'browser-image-compression';

/**
 * Phone cameras produce 4-12MB files. Two different sizes are needed:
 *
 *  - `display`: what customers see. Big enough to judge a border, small enough
 *    to load on a patchy mobile connection.
 *  - `forTagging`: sent to the model. Accuracy plateaus around 768px, so
 *    anything larger is money spent per upload for no gain.
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
    maxWidthOrHeight: 768,
    maxSizeMB: 0.15,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.75,
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
 * Kept at 1024px rather than the 768px used for sarees. The two are judged
 * differently: a saree is judged on colour and weave, which survives being
 * small, while a bill is judged on six-point digits, which does not. Measured,
 * 768px costs 1,058 input tokens and 1024px costs 1,586 — half again more
 * detail for a fraction of a paisa.
 *
 * There is no point going higher. The API caps images near 1.19 megapixels, so
 * a 1568px photo is resized back down before the model sees it: identical
 * token cost, identical legibility, 245KB more to upload from a phone.
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
  // the only thing on the page that matters.
  const forReading = await imageCompression(file, {
    maxWidthOrHeight: 1024,
    maxSizeMB: 0.4,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.88,
  });

  return {
    display,
    readingBase64: await toBase64(forReading),
    mediaType: 'image/jpeg',
  };
}
