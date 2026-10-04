/**
 * Comprehensive ZIP Backup & Restore Utility
 * Bundles backup JSON + individual device folders with all their images into a compressed ZIP file.
 */

import JSZip from 'jszip';
import { getDeviceFolderName } from '../services/driveSyncService';
import { prepareDevicesForExport } from './imageUtils';

/**
 * Converts a Data URL or web URL to a binary ArrayBuffer / Blob for JSZip
 */
async function urlToBinary(url) {
  if (!url) return null;

  if (url.startsWith('data:')) {
    // Data URL
    const commaIndex = url.indexOf(',');
    if (commaIndex === -1) return null;
    const byteString = atob(url.slice(commaIndex + 1));
    const mimeMatch = url.match(/data:([^;]+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return { data: ab, mimeType, ext: mimeType.split('/')[1] || 'jpg' };
  } else {
    // Web URL
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const ab = await blob.arrayBuffer();
      const mimeType = blob.type || 'image/jpeg';
      return { data: ab, mimeType, ext: mimeType.split('/')[1] || 'jpg' };
    } catch (err) {
      console.warn('Could not fetch image for zip:', url, err);
      return null;
    }
  }
}

/**
 * Creates and downloads a comprehensive ZIP backup containing:
 * 1. backup_data.json
 * 2. Folders for each device containing their photos
 * 3. Text specification files inside each device folder
 * 4. Overall catalog summary text file
 */
export async function createComprehensiveZipBackup({
  devices,
  sellerProfile,
  connectedDirectory = null,
  customFileName = null,
  onProgress = null
}) {
  const zip = new JSZip();
  const now = new Date();
  const dateStr = now.toLocaleDateString('fa-IR').replace(/\//g, '-');
  const baseName = customFileName || `RCG-Backup-With-Folders-${dateStr}`;

  if (onProgress) onProgress({ step: 'PREPARING', message: 'در حال آماده‌سازی و تبدیل تصاویر دستگاه‌ها...', percentage: 10 });

  // 1. Ensure all device photos are ready
  const embeddedDevices = await prepareDevicesForExport(devices);

  // 2. Main Backup JSON
  const backupData = {
    app: 'DastgahYar',
    company: sellerProfile?.businessName || 'گروه صنعتی آرسی (RCG)',
    version: '3.0',
    exportedAt: now.toISOString(),
    connectedDirectoryName: connectedDirectory?.name || null,
    totalDevices: embeddedDevices.length,
    sellerProfile: sellerProfile || {},
    devices: embeddedDevices
  };

  zip.file('backup_data.json', JSON.stringify(backupData, null, 2));

  // 3. Overall Catalog Summary Text File
  let summaryText = `=======================================================\n`;
  summaryText += `فهرست موجودی ماشین‌آلات - ${backupData.company}\n`;
  summaryText += `تاریخ پشتیبان‌گیری: ${now.toLocaleString('fa-IR')}\n`;
  summaryText += `پوشه درایو مرجع: ${connectedDirectory?.name || 'تعریف نشده'}\n`;
  summaryText += `تعداد کل دستگاه‌ها: ${embeddedDevices.length} دستگاه\n`;
  summaryText += `=======================================================\n\n`;

  embeddedDevices.forEach((d, idx) => {
    summaryText += `${idx + 1}. ${d.name} (${d.model || 'نامشخص'})\n`;
    summaryText += `   پوشه متناظر: ${getDeviceFolderName(d)}\n`;
    summaryText += `   قیمت کل: ${d.totalPrice || 'توافقی'} | پیش‌پرداخت: ${d.cashPercentage || 0}٪ | اقساط: ${d.installmentMonths || 0} ماهه\n`;
    summaryText += `   وضعیت: ${d.condition || 'سالم'} | گارانتی: ${d.warranty || 'دارد'} | محل: ${d.location || 'رشت'}\n`;
    summaryText += `   تعداد عکس‌ها: ${(d.images || []).length} تصویر\n`;
    if (d.specifications) {
      summaryText += `   مشخصات: ${d.specifications.replace(/\n/g, ' ')}\n`;
    }
    summaryText += `-------------------------------------------------------\n`;
  });

  zip.file('فهرست_کلی_دستگاه_ها.txt', summaryText);

  // 4. Create subfolder for each device with its photos and specs inside the root photos folder
  const rootFolderName = connectedDirectory?.name ? `پوشه_درایو_${connectedDirectory.name}` : 'فولدر_تصاویر_دستگاه_ها';
  const photosRoot = zip.folder(rootFolderName);
  const total = embeddedDevices.length;
  const usedFolderNames = new Set();

  for (let i = 0; i < total; i++) {
    const dev = embeddedDevices[i];
    let baseFolderName = getDeviceFolderName(dev);
    let folderName = baseFolderName;
    let counter = 2;
    while (usedFolderNames.has(folderName)) {
      folderName = `${baseFolderName} (${counter})`;
      counter++;
    }
    usedFolderNames.add(folderName);

    const devFolder = photosRoot.folder(folderName);

    if (onProgress) {
      const pct = 15 + Math.round(((i + 1) / total) * 70);
      onProgress({
        step: 'ADDING_PHOTOS',
        message: `افزودن پوشه و عکس‌های: ${dev.name}`,
        current: i + 1,
        total,
        percentage: pct
      });
    }

    // Individual device specs file inside its folder
    let devSpecs = `==============================\n`;
    devSpecs += `اطلاعات و مشخصات دستگاه\n`;
    devSpecs += `==============================\n`;
    devSpecs += `نام دستگاه: ${dev.name}\n`;
    devSpecs += `مدل و تیپ: ${dev.model || 'نامشخص'}\n`;
    devSpecs += `سال ساخت: ${dev.year || 'نامشخص'}\n`;
    devSpecs += `قیمت کل: ${dev.totalPrice || 'توافقی'}\n`;
    devSpecs += `درصد پیش‌پرداخت نقدی: ${dev.cashPercentage || 0}٪\n`;
    devSpecs += `تعداد اقساط: ${dev.installmentMonths || 0} ماهه\n`;
    devSpecs += `شرایط چک: ${dev.installmentNote || 'اقساط با چک صیادی'}\n`;
    devSpecs += `گارانتی: ${dev.warranty || 'ندارد'}\n`;
    devSpecs += `وضعیت: ${dev.condition || 'سالم'}\n`;
    devSpecs += `محل استقرار: ${dev.location || 'رشت'}\n\n`;
    devSpecs += `مشخصات فنی:\n${dev.specifications || 'ثبت نشده'}\n\n`;
    if (dev.customCaption) {
      devSpecs += `کپشن فروش اختصاصی:\n${dev.customCaption}\n`;
    }

    devFolder.file('مشخصات_دستگاه.txt', devSpecs);

    // Add each photo to the device folder
    const images = dev.images || [];
    for (let imgIdx = 0; imgIdx < images.length; imgIdx++) {
      const imgUrl = images[imgIdx];
      const binaryObj = await urlToBinary(imgUrl);
      if (binaryObj) {
        const photoFileName = `عکس_${imgIdx + 1}.${binaryObj.ext}`;
        devFolder.file(photoFileName, binaryObj.data);
      }
    }
  }

  // 5. Generate ZIP file
  if (onProgress) onProgress({ step: 'COMPRESSING', message: 'در حال فشرده‌سازی فایل نهایی ZIP...', percentage: 90 });

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  if (onProgress) onProgress({ step: 'DONE', message: 'دانلود فایل فشرده...', percentage: 100 });

  // 6. Trigger download
  const downloadUrl = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `${baseName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);

  return {
    fileName: `${baseName}.zip`,
    size: zipBlob.size
  };
}

/**
 * Restores data from an uploaded ZIP or JSON backup file
 */
export async function parseBackupZipOrJson(file) {
  if (!file) throw new Error('فایلی انتخاب نشده است.');

  const isZip = file.name.toLowerCase().endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed';

  if (!isZip) {
    // Regular JSON
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!parsed.devices || !Array.isArray(parsed.devices)) {
      throw new Error('ساختار فایل JSON معتبر نیست.');
    }
    return parsed;
  }

  // ZIP File
  const zip = await JSZip.loadAsync(file);

  // Look for backup_data.json inside zip
  let jsonFile = zip.file('backup_data.json');
  if (!jsonFile) {
    // Check if there is any other .json in the root
    const jsonEntries = zip.file(/\.json$/i);
    if (jsonEntries.length > 0) {
      jsonFile = jsonEntries[0];
    }
  }

  if (!jsonFile) {
    throw new Error('فایل اطلاعات backup_data.json در داخل فایل فشرده ZIP یافت نشد.');
  }

  const jsonText = await jsonFile.async('text');
  const backupData = JSON.parse(jsonText);

  if (!backupData.devices || !Array.isArray(backupData.devices)) {
    throw new Error('اطلاعات دستگاه‌ها در فایل فشرده معتبر نیست.');
  }

  // Restore photos from device subfolders inside the zip if needed
  try {
    for (let i = 0; i < backupData.devices.length; i++) {
      const dev = backupData.devices[i];
      if (!dev.images || dev.images.length === 0) {
        const folderName = getDeviceFolderName(dev);
        const escaped = folderName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const photoEntries = zip.file(new RegExp(escaped + '/.*\\.(jpe?g|png|webp|gif|bmp)$', 'i'));
        if (photoEntries.length > 0) {
          const restoredImages = [];
          for (const entry of photoEntries) {
            const blob = await entry.async('blob');
            const dataUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.readAsDataURL(blob);
            });
            restoredImages.push(dataUrl);
          }
          if (restoredImages.length > 0) {
            dev.images = restoredImages;
          }
        }
      }
    }
  } catch (err) {
    console.warn('Could not extract subfolder images during zip restore:', err);
  }

  return backupData;
}
