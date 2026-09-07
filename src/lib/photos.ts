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
