/**
 * Converts any image URL (local file data or web URL) to an embedded Base64 data URL
 * so it can be transferred between computers and phones completely offline.
 */
export async function convertImageToBase64(url) {
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('data:image/')) return url; // Already Base64

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 600;
        canvas.height = img.naturalHeight || img.height || 450;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/jpeg', 0.82);
        resolve(dataURL);
      } catch (err) {
        // Fallback to original url if CORS prevents canvas export
        resolve(url);
      }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
}

/**
 * Prepares all devices for export by ensuring every photo is embedded
 */
export async function prepareDevicesForExport(devices) {
  const result = [];
  for (const d of devices) {
    if (!d.images || d.images.length === 0) {
      result.push(d);
      continue;
    }

    const embeddedImages = await Promise.all(
      d.images.map(img => convertImageToBase64(img))
    );

    result.push({
      ...d,
      images: embeddedImages
    });
  }
  return result;
}
