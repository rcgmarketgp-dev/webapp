/**
 * Drive Directory & Device Folders Synchronization Service
 * Uses File System Access API (window.showDirectoryPicker) for direct OS Drive integration
 */

import JSZip from 'jszip';
import { saveStoredDirectoryHandle, getStoredDirectoryHandle, clearStoredDirectoryHandle } from '../utils/directoryStorage';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.jfif', '.svg'];

/**
 * Checks if the browser supports modern File System Access API
 */
export function isFileSystemAccessSupported() {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Sanitizes a folder name for Windows / Linux / macOS file systems
 */
export function sanitizeFolderName(name) {
  if (!name) return 'دستگاه_بدون_نام';
  return String(name)
    .replace(/[\\/:*?"<>|#%&{}\\<>*?/$!'":@+`|=]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 70);
}

/**
 * Generates a clean, consistent folder name for a device
 */
export function getDeviceFolderName(device) {
  if (!device) return 'دستگاه';
  const cleanName = sanitizeFolderName(device.name || 'دستگاه');
  const cleanModel = device.model ? sanitizeFolderName(device.model) : '';
  
  if (cleanModel && cleanModel !== '-') {
    return `${cleanName} - ${cleanModel}`;
  }
  return cleanName;
}

/**
 * Checks or requests readwrite permission for a stored directory handle
 */
export async function verifyDirectoryPermission(dirHandle, readWrite = true) {
  if (!dirHandle) return false;
  const options = {};
  if (readWrite) {
    options.mode = 'readwrite';
  }

  try {
    if ((await dirHandle.queryPermission(options)) === 'granted') {
      return true;
    }
    if ((await dirHandle.requestPermission(options)) === 'granted') {
      return true;
    }
  } catch (err) {
    console.warn('Error verifying directory permission:', err);
  }
  return false;
}

/**
 * Opens native OS directory picker so user can pick any folder on any drive (C, D, E, etc.)
 */
export async function pickDriveDirectory() {
  if (!isFileSystemAccessSupported()) {
    throw new Error('مرورگر شما از انتخاب مستقیم دایرکتوری درایو پشتیبانی نمی‌کند. لطفاً از مرورگرهای مدرن مانند گوگل کروم یا مایکروسافت اج استفاده فرمایید.');
  }

  try {
    const dirHandle = await window.showDirectoryPicker({
      id: 'dastgah_yar_drive_sync',
      mode: 'readwrite',
      startIn: 'desktop'
    });

    const hasPermission = await verifyDirectoryPermission(dirHandle, true);
    if (!hasPermission) {
      throw new Error('دسترسی خواندن و نوشتن به پوشه انتخاب شده تأیید نشد.');
    }

    const folderName = dirHandle.name;
    await saveStoredDirectoryHandle(dirHandle, folderName);

    return {
      handle: dirHandle,
      name: folderName
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      return null; // User cancelled
    }
    throw err;
  }
}

/**
 * Retrieves the previously saved directory handle from IndexedDB
 */
export async function restoreSavedDirectory() {
  const stored = await getStoredDirectoryHandle();
  if (!stored || !stored.handle) return null;

  try {
    const hasPerm = await verifyDirectoryPermission(stored.handle, false);
    return {
      handle: stored.handle,
      name: stored.name,
      hasPermission: hasPerm
    };
  } catch (err) {
    return null;
  }
}

/**
 * Disconnects the current drive directory
 */
export async function disconnectDriveDirectory() {
  await clearStoredDirectoryHandle();
}

/**
 * Ensures a subfolder exists in the connected directory for the given device
 * Also writes specs file and any existing images into the folder
 */
export async function ensureDeviceFolder(rootHandle, device, writeSpecs = true) {
  if (!rootHandle || !device) return null;
  
  const hasPerm = await verifyDirectoryPermission(rootHandle, true);
  if (!hasPerm) {
    throw new Error('دسترسی نوشتن (Write Permission) در این دایرکتوری درایو تأیید نشد.');
  }

  const folderName = getDeviceFolderName(device);
  try {
    const subDirHandle = await rootHandle.getDirectoryHandle(folderName, { create: true });

    // ذخیره فایل مشخصات دستگاه درون پوشه جهت ثبات در فایل سیستم
    if (writeSpecs) {
      try {
        let specsContent = `=========================================\r\n`;
        specsContent += `مشخصات دستگاه - گروه صنعتی آرسی (RCG)\r\n`;
        specsContent += `=========================================\r\n`;
        specsContent += `نام دستگاه: ${device.name || ''}\r\n`;
        specsContent += `مدل و تیپ: ${device.model || 'نامشخص'}\r\n`;
        specsContent += `دسته‌بندی: ${device.category || 'صنعتی'}\r\n`;
        specsContent += `سال ساخت: ${device.year || 'نامشخص'}\r\n`;
        specsContent += `قیمت کل: ${device.totalPrice || 'توافقی'}\r\n`;
        specsContent += `درصد پیش‌پرداخت: ${device.cashPercentage || 0}٪\r\n`;
        specsContent += `تعداد اقساط: ${device.installmentMonths || 0} ماهه\r\n`;
        specsContent += `شرایط چک: ${device.installmentNote || 'اقساط با چک صیادی'}\r\n`;
        specsContent += `وضعیت: ${device.condition || 'سالم'}\r\n`;
        specsContent += `محل استقرار: ${device.location || 'رشت'}\r\n\r\n`;
        specsContent += `مشخصات فنی:\r\n${device.specifications || 'ثبت نشده'}\r\n\r\n`;
        if (device.customCaption) {
          specsContent += `کپشن فروش:\r\n${device.customCaption}\r\n`;
        }

        const txtHandle = await subDirHandle.getFileHandle('مشخصات_دستگاه.txt', { create: true });
        const writable = await txtHandle.createWritable();
        await writable.write(new Blob([specsContent], { type: 'text/plain;charset=utf-8' }));
        await writable.close();
      } catch (specErr) {
        console.warn('Could not write specs file inside device folder:', specErr);
      }
    }

    // ذخیره تصاویر موجود دستگاه در صورت وجود
    const images = device.images || [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (img && typeof img === 'string' && img.startsWith('data:')) {
        try {
          const blob = dataUrlToBlob(img);
          if (blob) {
            const ext = blob.type.split('/')[1] || 'jpg';
            const imgHandle = await subDirHandle.getFileHandle(`عکس_${i + 1}.${ext}`, { create: true });
            const imgWritable = await imgHandle.createWritable();
            await imgWritable.write(blob);
            await imgWritable.close();
          }
        } catch (imgErr) {
          console.warn('Could not write image to device folder:', imgErr);
        }
      }
    }

    return {
      folderName,
      handle: subDirHandle,
      success: true
    };
  } catch (err) {
    console.warn(`Could not create folder for ${device.name}:`, err);
    throw err;
  }
}

/**
 * Creates folders for all devices in the provided list inside the selected directory
 */
export async function createFoldersForAllDevices(rootHandle, devices, onProgress = null) {
  if (!rootHandle || !devices || devices.length === 0) return { createdCount: 0, total: 0 };

  const hasPerm = await verifyDirectoryPermission(rootHandle, true);
  if (!hasPerm) {
    throw new Error('دسترسی نوشتن (Write Permission) به دایرکتوری درایو تأیید نشد. لطفاً در پیامی که مرورگر نمایش می‌دهد گزینه «Allow» یا «ویرایش فایل‌ها» را تأیید کنید.');
  }

  let createdCount = 0;
  const total = devices.length;
  const errors = [];

  for (let i = 0; i < total; i++) {
    const dev = devices[i];
    const folderName = getDeviceFolderName(dev);

    try {
      await ensureDeviceFolder(rootHandle, dev, true);
      createdCount++;
    } catch (err) {
      console.warn(`Failed creating folder for ${dev.name}:`, err);
      errors.push(`${dev.name}: ${err.message || 'خطا در ساخت پوشه'}`);
    }

    if (onProgress) {
      onProgress({
        current: i + 1,
        total,
        currentDeviceName: dev.name,
        folderName,
        percentage: Math.round(((i + 1) / total) * 100)
      });
    }
  }

  if (createdCount === 0 && total > 0) {
    throw new Error(
      `امکان ساخت هیچ پوشه‌ای در دایرکتوری فراهم نشد. علل احتمالی: عدم دسترسی نوشتن در این درایو. جزئیات: ${errors[0] || 'خطای مجوز مرورگر'}`
    );
  }

  return {
    createdCount,
    total,
    errors
  };
}

/**
 * Reads all image files from a single device's subfolder
 */
export async function readImagesFromDeviceFolder(rootHandle, device) {
  if (!rootHandle || !device) return [];

  const folderName = getDeviceFolderName(device);
  let subDirHandle = null;

  try {
    subDirHandle = await rootHandle.getDirectoryHandle(folderName, { create: false });
  } catch (err) {
    // Folder doesn't exist yet
    return [];
  }

  const images = [];

  try {
    for await (const [name, entry] of subDirHandle.entries()) {
      if (entry.kind === 'file') {
        const lowerName = name.toLowerCase();
        const isImage = IMAGE_EXTENSIONS.some(ext => lowerName.endsWith(ext));
        
        if (isImage) {
          try {
            const file = await entry.getFile();
            const dataUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            images.push(dataUrl);
          } catch (readErr) {
            console.warn(`Could not read file ${name}:`, readErr);
          }
        }
      }
    }
  } catch (iterErr) {
    console.warn(`Could not iterate directory for ${device.name}:`, iterErr);
  }

  return images;
}

/**
 * Scans all device subfolders in the root directory and updates device images
 */
export async function syncAllDeviceImagesFromDirectory(rootHandle, devices, onProgress = null) {
  if (!rootHandle || !devices || devices.length === 0) {
    return { updatedDevices: devices, totalImagesFound: 0, devicesSyncedCount: 0 };
  }

  const hasPerm = await verifyDirectoryPermission(rootHandle, false);
  if (!hasPerm) {
    throw new Error('دسترسی خواندن از دایرکتوری درایو تأیید نشد.');
  }

  const updatedDevices = [];
  let totalImagesFound = 0;
  let devicesSyncedCount = 0;
  const total = devices.length;

  for (let i = 0; i < total; i++) {
    const dev = devices[i];
    const folderName = getDeviceFolderName(dev);

    if (onProgress) {
      onProgress({
        current: i + 1,
        total,
        currentDeviceName: dev.name,
        percentage: Math.round(((i + 1) / total) * 100)
      });
    }

    const folderImages = await readImagesFromDeviceFolder(rootHandle, dev);

    if (folderImages.length > 0) {
      totalImagesFound += folderImages.length;
      devicesSyncedCount++;
      // If folder has images, we merge or replace
      updatedDevices.push({
        ...dev,
        images: folderImages,
        folderSynced: true,
        folderName
      });
    } else {
      updatedDevices.push({
        ...dev,
        folderName
      });
    }
  }

  return {
    updatedDevices,
    totalImagesFound,
    devicesSyncedCount
  };
}

/**
 * Fallback parser when user uploads a directory using <input webkitdirectory>
 */
export async function parseImagesFromWebkitDirectoryFiles(files, devices) {
  const fileArray = Array.from(files);
  const updatedDevices = [...devices];
  let totalImagesFound = 0;
  let devicesSyncedCount = 0;

  // Map of folderName -> File[]
  const folderFilesMap = new Map();

  for (const file of fileArray) {
    const path = file.webkitRelativePath || file.name;
    const parts = path.split('/');
    if (parts.length >= 2) {
      const subfolder = parts[parts.length - 2];
      const fileName = parts[parts.length - 1].toLowerCase();
      const isImg = IMAGE_EXTENSIONS.some(ext => fileName.endsWith(ext));

      if (isImg) {
        if (!folderFilesMap.has(subfolder)) {
          folderFilesMap.set(subfolder, []);
        }
        folderFilesMap.get(subfolder).push(file);
      }
    }
  }

  // Match folders to devices
  for (let i = 0; i < updatedDevices.length; i++) {
    const dev = updatedDevices[i];
    const targetFolderName = getDeviceFolderName(dev);

    // Look for exact match or close match
    let matchedFiles = folderFilesMap.get(targetFolderName);
    if (!matchedFiles) {
      for (const [fName, filesInFolder] of folderFilesMap.entries()) {
        if (fName.includes(sanitizeFolderName(dev.name)) || (dev.model && fName.includes(sanitizeFolderName(dev.model)))) {
          matchedFiles = filesInFolder;
          break;
        }
      }
    }

    if (matchedFiles && matchedFiles.length > 0) {
      const images = await Promise.all(
        matchedFiles.map(file => {
          return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
          });
        })
      );

      const validImages = images.filter(Boolean);
      if (validImages.length > 0) {
        updatedDevices[i] = {
          ...dev,
          images: validImages,
          folderSynced: true,
          folderName: targetFolderName
        };
        totalImagesFound += validImages.length;
        devicesSyncedCount++;
      }
    }
  }

  return {
    updatedDevices,
    totalImagesFound,
    devicesSyncedCount
  };
}

/**
 * Converts Data URL to binary Blob
 */
export function dataUrlToBlob(dataUrl) {
  if (!dataUrl) return null;
  if (!dataUrl.startsWith('data:')) return null;
  try {
    const commaIndex = dataUrl.indexOf(',');
    if (commaIndex === -1) return null;
    const byteString = atob(dataUrl.slice(commaIndex + 1));
    const mimeMatch = dataUrl.match(/data:([^;]+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeType });
  } catch (err) {
    console.warn('Could not convert dataUrl to Blob:', err);
    return null;
  }
}

/**
 * Saves a single image (File or Blob or Data URL) directly into the device's subfolder on the drive
 */
export async function saveImageFileToDeviceFolder(rootHandle, device, fileOrDataUrl, preferredFileName = null) {
  if (!rootHandle || !device) return false;

  const hasPerm = await verifyDirectoryPermission(rootHandle, true);
  if (!hasPerm) return false;

  try {
    const folderName = getDeviceFolderName(device);
    const subDirHandle = await rootHandle.getDirectoryHandle(folderName, { create: true });

    let blob = null;
    let fileName = preferredFileName;

    if (fileOrDataUrl instanceof File) {
      blob = fileOrDataUrl;
      fileName = fileName || fileOrDataUrl.name;
    } else if (fileOrDataUrl instanceof Blob) {
      blob = fileOrDataUrl;
      fileName = fileName || `عکس_${Date.now()}.jpg`;
    } else if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
      blob = dataUrlToBlob(fileOrDataUrl);
      const mime = blob?.type || 'image/jpeg';
      const ext = mime.split('/')[1] || 'jpg';
      fileName = fileName || `عکس_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
    }

    if (!blob) return false;

    // Sanitize file name
    const safeFileName = sanitizeFolderName(fileName).replace(/^-+|-+$/g, '') || `عکس_${Date.now()}.jpg`;
    const fileHandle = await subDirHandle.getFileHandle(safeFileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    return true;
  } catch (err) {
    console.warn(`Could not save image to folder for ${device.name}:`, err);
    return false;
  }
}

/**
 * Saves multiple images (Files or Data URLs) directly into the device's folder on the drive
 */
export async function saveMultipleImagesToDeviceFolder(rootHandle, device, imagesOrFiles) {
  if (!rootHandle || !device || !Array.isArray(imagesOrFiles) || imagesOrFiles.length === 0) return 0;

  const hasPerm = await verifyDirectoryPermission(rootHandle, true);
  if (!hasPerm) return 0;

  let savedCount = 0;
  for (let idx = 0; idx < imagesOrFiles.length; idx++) {
    const item = imagesOrFiles[idx];
    const preferredName = (item instanceof File) ? item.name : `عکس_${idx + 1}.jpg`;
    const success = await saveImageFileToDeviceFolder(rootHandle, device, item, preferredName);
    if (success) savedCount++;
  }

  return savedCount;
}

/**
 * Writes device specs text and JSON metadata into the device's folder on the drive
 */
export async function saveDeviceSpecsToFolder(rootHandle, device, sellerProfile = null) {
  if (!rootHandle || !device) return false;

  const hasPerm = await verifyDirectoryPermission(rootHandle, true);
  if (!hasPerm) return false;

  try {
    const folderName = getDeviceFolderName(device);
    const subDirHandle = await rootHandle.getDirectoryHandle(folderName, { create: true });

    // 1. Text specifications file
    let devSpecs = `=========================================\n`;
    devSpecs += `اطلاعات و مشخصات دستگاه - گروه صنعتی آرسی\n`;
    devSpecs += `=========================================\n`;
    devSpecs += `نام دستگاه: ${device.name}\n`;
    devSpecs += `مدل و تیپ: ${device.model || 'نامشخص'}\n`;
    devSpecs += `سال ساخت: ${device.year || 'نامشخص'}\n`;
    devSpecs += `قیمت کل: ${device.totalPrice || 'توافقی'}\n`;
    devSpecs += `درصد پیش‌پرداخت نقدی: ${device.cashPercentage || 0}٪\n`;
    devSpecs += `تعداد اقساط: ${device.installmentMonths || 0} ماهه\n`;
    devSpecs += `شرایط چک: ${device.installmentNote || 'اقساط با چک صیادی'}\n`;
    devSpecs += `گارانتی: ${device.warranty || 'ندارد'}\n`;
    devSpecs += `وضعیت: ${device.condition || 'سالم'}\n`;
    devSpecs += `محل استقرار: ${device.location || 'رشت'}\n`;
    devSpecs += `تاریخ آخرین بروزرسانی: ${new Date().toLocaleString('fa-IR')}\n\n`;
    devSpecs += `مشخصات فنی:\n${device.specifications || 'ثبت نشده'}\n\n`;
    if (device.customCaption) {
      devSpecs += `کپشن فروش اختصاصی:\n${device.customCaption}\n\n`;
    }
    if (sellerProfile) {
      devSpecs += `فروشنده: ${sellerProfile.businessName || ''}\n`;
      devSpecs += `شماره تماس: ${sellerProfile.phone1 || ''} - ${sellerProfile.phone2 || ''}\n`;
    }

    const txtFileHandle = await subDirHandle.getFileHandle('مشخصات_دستگاه.txt', { create: true });
    const txtWritable = await txtFileHandle.createWritable();
    await txtWritable.write(new Blob([devSpecs], { type: 'text/plain;charset=utf-8' }));
    await txtWritable.close();

    // 2. Machine-readable JSON
    const jsonHandle = await subDirHandle.getFileHandle('اطلاعات_دستگاه.json', { create: true });
    const jsonWritable = await jsonHandle.createWritable();
    const cleanDev = { ...device };
    delete cleanDev.images; // Don't bloat JSON with base64 images because images are stored as separate files
    await jsonWritable.write(new Blob([JSON.stringify(cleanDev, null, 2)], { type: 'application/json' }));
    await jsonWritable.close();

    return true;
  } catch (err) {
    console.warn(`Could not save specs to folder for ${device.name}:`, err);
    return false;
  }
}

/**
 * ایجاد و دانلود مستقیم فایل فشرده ZIP شامل پوشه‌های تمامی دستگاه‌ها
 * به همراه فایل متنی مشخصات و عکس‌های هر دستگاه
 */
export async function downloadDeviceFoldersZip(devices, archiveName = null, onProgress = null) {
  if (!devices || devices.length === 0) {
    throw new Error('دستگاهی برای ساخت پوشه وجود ندارد.');
  }

  const zip = new JSZip();
  const rootFolderName = 'پوشه_های_ماشین_آلات';
  const rootDir = zip.folder(rootFolderName);

  const total = devices.length;
  for (let i = 0; i < total; i++) {
    const dev = devices[i];
    const folderName = getDeviceFolderName(dev);
    const devFolder = rootDir.folder(folderName);

    if (onProgress) {
      onProgress({
        current: i + 1,
        total,
        folderName,
        percentage: Math.round(((i + 1) / total) * 100)
      });
    }

    // فایل متنی مشخصات
    let specs = `=========================================\r\n`;
    specs += `مشخصات دستگاه - گروه صنعتی آرسی (RCG)\r\n`;
    specs += `=========================================\r\n`;
    specs += `نام دستگاه: ${dev.name || ''}\r\n`;
    specs += `مدل و تیپ: ${dev.model || 'نامشخص'}\r\n`;
    specs += `دسته‌بندی: ${dev.category || 'صنعتی'}\r\n`;
    specs += `سال ساخت: ${dev.year || 'نامشخص'}\r\n`;
    specs += `قیمت: ${dev.totalPrice || 'توافقی'}\r\n`;
    specs += `پیش‌پرداخت: ${dev.cashPercentage || 0}٪\r\n`;
    specs += `اقساط: ${dev.installmentMonths || 0} ماهه\r\n`;
    specs += `شرایط چک: ${dev.installmentNote || 'اقساط با چک صیادی'}\r\n`;
    specs += `وضعیت: ${dev.condition || 'سالم'}\r\n`;
    specs += `محل: ${dev.location || 'رشت'}\r\n\r\n`;
    specs += `مشخصات فنی:\r\n${dev.specifications || 'ثبت نشده'}\r\n\r\n`;
    if (dev.customCaption) {
      specs += `کپشن فروش:\r\n${dev.customCaption}\r\n`;
    }

    devFolder.file('مشخصات_دستگاه.txt', specs);

    // افزودن تصاویر موجود
    const images = dev.images || [];
    for (let k = 0; k < images.length; k++) {
      const img = images[k];
      if (img && typeof img === 'string' && img.startsWith('data:')) {
        const commaIdx = img.indexOf(',');
        if (commaIdx !== -1) {
          const b64 = img.slice(commaIdx + 1);
          const mimeMatch = img.match(/data:([^;]+);/);
          const ext = mimeMatch ? mimeMatch[1].split('/')[1] || 'jpg' : 'jpg';
          devFolder.file(`عکس_${k + 1}.${ext}`, b64, { base64: true });
        }
      }
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const finalName = archiveName || `فولدرهای_دستگاه_ها_${new Date().toISOString().slice(0, 10)}.zip`;
  
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, fileName: finalName };
}

/**
 * ایجاد و دانلود فایل اسکریپت ویندوز (.bat) جهت ساخت ۱ ثانیه‌ای تمام پوشه‌ها در هر درایو دلخواه
 */
export function downloadWindowsBatchScript(devices) {
  if (!devices || devices.length === 0) {
    throw new Error('دستگاهی برای ساخت پوشه وجود ندارد.');
  }

  let batContent = `@echo off\r\n`;
  batContent += `chcp 65001 > nul\r\n`;
  batContent += `title ایجاد خودکار پوشه های ماشین آلات - گروه صنعتی آرسی\r\n`;
  batContent += `echo ================================================================\r\n`;
  batContent += `echo در حال ساخت خودکار پوشه برای تمامی دستگاه ها...\r\n`;
  batContent += `echo ================================================================\r\n`;

  for (const dev of devices) {
    const fName = getDeviceFolderName(dev);
    batContent += `if not exist "${fName}" (\r\n`;
    batContent += `    mkdir "${fName}"\r\n`;
    batContent += `    echo پوشه ساخته شد: ${fName}\r\n`;
    batContent += `)\r\n`;
  }

  batContent += `echo ================================================================\r\n`;
  batContent += `echo تعداد ${devices.length} پوشه با موفقیت در این مسیر ایجاد گردید!\r\n`;
  batContent += `echo اکنون می توانید عکس های هر دستگاه را درون پوشه خودش قرار دهید.\r\n`;
  batContent += `echo ================================================================\r\n`;
  batContent += `pause\r\n`;

  // UTF-8 BOM
  const blob = new Blob(['\uFEFF' + batContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'ساخت_خودکار_پوشه_ها_ویندوز.bat';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

