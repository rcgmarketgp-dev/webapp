import React, { useState } from 'react';
import { 
  X, 
  FolderPlus, 
  FolderCheck, 
  HardDrive, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Image as ImageIcon,
  FolderOpen,
  ArrowRight,
  Sparkles,
  Layers,
  Info,
  Check,
  UploadCloud,
  FileDown,
  Terminal,
  PackageCheck
} from 'lucide-react';
import { 
  isFileSystemAccessSupported, 
  pickDriveDirectory, 
  disconnectDriveDirectory, 
  createFoldersForAllDevices, 
  syncAllDeviceImagesFromDirectory,
  parseImagesFromWebkitDirectoryFiles,
  getDeviceFolderName,
  downloadDeviceFoldersZip,
  downloadWindowsBatchScript
} from '../services/driveSyncService';

export default function DriveFolderSyncModal({
  isOpen,
  onClose,
  devices,
  connectedDirectory,
  onDirectoryConnected,
  onDirectoryDisconnected,
  onDevicesUpdated,
  showToast
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(null); // { current, total, message, percentage }
  const [syncSummary, setSyncSummary] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const isSupported = isFileSystemAccessSupported();

  if (!isOpen) return null;

  // 1. Pick Directory on Hard Drive
  const handleSelectDirectory = async () => {
    setErrorMsg('');
    setSyncSummary(null);
    try {
      const result = await pickDriveDirectory();
      if (result) {
        onDirectoryConnected(result);
        showToast(`پوشه «${result.name}» با موفقیت متصل شد 📂`);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'خطا در انتخاب دایرکتوری درایو.');
    }
  };

  // 2. Disconnect Directory
  const handleDisconnect = async () => {
    await disconnectDriveDirectory();
    onDirectoryDisconnected();
    setSyncSummary(null);
    showToast('اتصال به پوشه درایو قطع شد.');
  };

  // 3. Create subfolder for every device in the connected drive directory
  const handleCreateAllFolders = async () => {
    let targetDir = connectedDirectory;
    
    // اگر هنوز دایرکتوری متصل نشده، ابتدا انتخابگر دایرکتوری را باز می‌کنیم
    if (!targetDir?.handle) {
      try {
        const picked = await pickDriveDirectory();
        if (picked) {
          onDirectoryConnected(picked);
          targetDir = picked;
          showToast(`پوشه «${picked.name}» با موفقیت متصل شد 📂`);
        } else {
          return; // کاربر انصراف داد
        }
      } catch (pickErr) {
        setErrorMsg(pickErr.message || 'لطفاً ابتدا یک پوشه در درایو انتخاب نمایید.');
        return;
      }
    }

    if (!targetDir?.handle) {
      setErrorMsg('لطفاً ابتدا یک دایرکتوری در درایو انتخاب نمایید.');
      return;
    }

    if (!devices || devices.length === 0) {
      setErrorMsg('هیچ دستگاهی در لیست موجود نیست.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');
    setSyncSummary(null);

    try {
      const res = await createFoldersForAllDevices(
        targetDir.handle, 
        devices, 
        (p) => setProgress({
          ...p,
          message: `ایجاد پوشه: ${p.folderName}`
        })
      );

      setSyncSummary({
        type: 'CREATE',
        message: `تعداد ${res.createdCount} پوشه به نام دستگاه‌ها به همراه فایل مشخصات در دایرکتوری «${targetDir.name}» با موفقیت ایجاد شد ✓`
      });
      showToast(`${res.createdCount} پوشه به نام دستگاه‌ها در درایو ساخته شد 📁`);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'خطا در ایجاد پوشه‌ها در درایو. دسترسی ویرایش را در پیام مرورگر تأیید کنید یا از دکمه «دانلود ZIP پوشه‌ها» استفاده فرمایید.');
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  // دانلود مستقیم فایل فشرده ZIP شامل تمامی پوشه‌ها
  const handleDownloadZip = async () => {
    if (!devices || devices.length === 0) {
      setErrorMsg('هیچ دستگاهی در لیست ثبت نشده است.');
      return;
    }
    setIsProcessing(true);
    setErrorMsg('');
    try {
      await downloadDeviceFoldersZip(devices, null, (p) => {
        setProgress({
          ...p,
          message: `افزودن پوشه: ${p.folderName}`
        });
      });
      setSyncSummary({
        type: 'CREATE',
        message: `فایل فشرده تمامی ${devices.length} پوشه دستگاه‌ها دانلود شد. آن را در هر پوشه یا درایوی که می‌خواهید Extract (استخراج) کنید تا پوشه‌ها فوراً ساخته شوند ✓`
      });
      showToast('فایل فشرده پوشه‌ها با موفقیت دانلود شد 📦');
    } catch (err) {
      setErrorMsg(err.message || 'خطا در ایجاد فایل ZIP پوشه‌ها.');
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  // دانلود اسکریپت ساخت پوشه‌ها در ویندوز
  const handleDownloadBat = () => {
    if (!devices || devices.length === 0) {
      setErrorMsg('هیچ دستگاهی در لیست ثبت نشده است.');
      return;
    }
    try {
      downloadWindowsBatchScript(devices);
      showToast('فایل ویندوز (.bat) دانلود شد. در پوشه مد نظرتان اجرا فرمایید ⚡');
      setSyncSummary({
        type: 'CREATE',
        message: `فایل اسکریپت ساخت پوشه‌ها دانلود شد. فایل «ساخت_خودکار_پوشه_ها_ویندوز.bat» را به درایو دلخواهتان کپی کرده و دو بار روی آن کلیک کنید تا تمام ${devices.length} پوشه در ۱ ثانیه ساخته شوند ✓`
      });
    } catch (err) {
      setErrorMsg(err.message || 'خطا در دانلود اسکریپت ویندوز.');
    }
  };

  // 4. Scan folders and load images into app devices
  const handleSyncImages = async () => {
    if (!connectedDirectory?.handle) {
      setErrorMsg('لطفاً ابتدا یک دایرکتوری در درایو انتخاب نمایید.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');
    setSyncSummary(null);

    try {
      const res = await syncAllDeviceImagesFromDirectory(
        connectedDirectory.handle,
        devices,
        (p) => setProgress({
          ...p,
          message: `اسکن و خواندن عکس‌های: ${p.currentDeviceName}`
        })
      );

      onDevicesUpdated(res.updatedDevices);
      setSyncSummary({
        type: 'SYNC',
        message: `تعداد ${res.totalImagesFound} عکس از پوشه‌های ${res.devicesSyncedCount} دستگاه خوانده و به برنامه اضافه شد ✓`
      });
      showToast(`${res.totalImagesFound} عکس از درایو با موفقیت همگام‌سازی شد 🖼️`);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'خطا در خواندن عکس‌ها از پوشه درایو.');
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  // 5. Fallback folder selection using webkitdirectory input
  const handleFallbackFolderUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setErrorMsg('');
    setSyncSummary(null);

    try {
      const res = await parseImagesFromWebkitDirectoryFiles(files, devices);
      onDevicesUpdated(res.updatedDevices);
      setSyncSummary({
        type: 'SYNC',
        message: `تعداد ${res.totalImagesFound} عکس از پوشه‌های ${res.devicesSyncedCount} دستگاه استخراج و ثبت شد ✓`
      });
      showToast(`${res.totalImagesFound} عکس از پوشه انتخاب‌شده بارگذاری شد ✓`);
    } catch (err) {
      setErrorMsg('خطا در پردازش فایل‌های پوشه.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-750 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-blue-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>مدیریت و همگام‌سازی پوشه درایو ماشین‌آلات</span>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Drive Folder Sync
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                ایجاد خودکار پوشه برای هر دستگاه در درایو و اضافه شدن اتوماتیک عکس‌ها به برنامه
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1 text-xs">
          
          {/* How it works info card */}
          <div className="bg-slate-850 border border-slate-750 rounded-2xl p-4 space-y-2 text-slate-300 leading-relaxed">
            <h4 className="font-bold text-amber-400 flex items-center gap-1.5 text-xs">
              <Info className="w-4 h-4 text-amber-400" />
              <span>نحوه کارکرد سیستم دایرکتوری درایو:</span>
            </h4>
            <ul className="space-y-1.5 text-[11px] pr-4 list-disc list-outside text-slate-300">
              <li>یک دایرکتوری دلخواه در هر یک از درایوهای کامپیوترتان (مانند <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded font-mono">D:\MachineryPhotos</code>) مشخص می‌کنید.</li>
              <li>به ازای هر دستگاه در لیست، یک فولدر به نام همان دستگاه در هارد دیسک شما به صورت خودکار ایجاد می‌شود.</li>
              <li>هر زمان عکس‌های دستگاه را داخل فولدر مربوطه‌اش کپی کنید، با کلیک روی «بروزرسانی عکس‌ها»، تصاویر به صورت خودکار شناسایی و در برنامه ثبت می‌شوند.</li>
            </ul>
          </div>

          {/* Directory Connection State */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className={`w-3.5 h-3.5 rounded-full ${connectedDirectory ? 'bg-emerald-400 animate-pulse ring-4 ring-emerald-500/20' : 'bg-slate-600'}`}></div>
                <div>
                  <span className="font-bold text-white text-xs block">
                    {connectedDirectory ? `پوشه فعال درایو: ${connectedDirectory.name}` : 'دایرکتوری درایو متصل نشده است'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {connectedDirectory ? 'دسترسی همگام‌سازی مستقیم با فایل‌های درایو فعال است' : 'برای شروع، پوشه مد نظر خود را در درایو انتخاب کنید'}
                  </span>
                </div>
              </div>

              {connectedDirectory ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={isProcessing}
                  className="text-[11px] text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-xl border border-rose-500/20 font-medium transition-colors"
                >
                  قطع اتصال این پوشه
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSelectDirectory}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-900/30 transition-all"
                >
                  <FolderOpen className="w-4 h-4 text-amber-300" />
                  <span>انتخاب دایرکتوری در درایو...</span>
                </button>
              )}
            </div>

            {/* Actions Toolbar */}
            <div className="pt-3 border-t border-slate-850 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleCreateAllFolders}
                  disabled={isProcessing || devices.length === 0}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold transition-all text-xs shadow-lg shadow-amber-900/30 disabled:opacity-50"
                >
                  <FolderPlus className="w-4 h-4 text-white" />
                  <span>
                    {connectedDirectory 
                      ? `ایجاد خودکار پوشه برای ${devices.length} دستگاه در درایو «${connectedDirectory.name}»` 
                      : `انتخاب درایو و ایجاد خودکار پوشه‌ها (${devices.length} دستگاه)`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncImages}
                  disabled={isProcessing || !connectedDirectory || devices.length === 0}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 font-bold transition-all text-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 text-blue-400 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>اسکن و خواندن عکس‌ها از پوشه‌ها</span>
                </button>
              </div>

              {/* روش‌های تضمین‌شده و فوری ساخت پوشه‌ها بدون وابستگی به مرورگر */}
              <div className="pt-2 border-t border-slate-800/80 bg-slate-900/70 p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>روش‌های فوری و تضمین‌شده ساخت پوشه‌ها در هارد (بدون محدودیت مرورگر):</span>
                  </span>
                  <span className="text-[10px] text-slate-400">۱۰۰٪ آفلاین و دائمی</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    disabled={isProcessing || devices.length === 0}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold transition-all text-[11px]"
                    title="دانلود فایل فشرده حاوی تمامی پوشه‌ها با نام دستگاه‌ها و مشخصات جهت استخراج در هر درایو"
                  >
                    <FileDown className="w-4 h-4 text-emerald-400" />
                    <span>📦 دانلود ZIP تمامی پوشه‌ها (Extract در هارد)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadBat}
                    disabled={isProcessing || devices.length === 0}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold transition-all text-[11px]"
                    title="دانلود فایل ساخت خودکار پوشه‌ها در ویندوز. کافیست در درایو دلخواه دو بار روی آن کلیک کنید"
                  >
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span>⚡ دانلود فایل ویندوز (.bat) جهت ساخت ۱ ثانیه‌ای</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Browser fallback if showDirectoryPicker is not supported */}
          {!isSupported && (
            <div className="bg-amber-950/40 border border-amber-600/30 rounded-2xl p-4 space-y-2">
              <span className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                <AlertCircle className="w-4 h-4" />
                <span>حالت سازگاری با سایر مرورگرها:</span>
              </span>
              <p className="text-[11px] text-slate-300">
                مرورگر فعلی شما از File System Access مستقیم پشتیبانی نمی‌کند؛ اما می‌توانید با دکمه زیر، یک پوشه را انتخاب کنید تا تصاویر تمام زیرپوشه‌های دستگاه‌ها یکجا خوانده شوند:
              </p>
              <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs border border-slate-700 transition-colors">
                <UploadCloud className="w-4 h-4 text-amber-300" />
                <span>انتخاب پوشه حاوی عکس‌ها از سیستم</span>
                <input
                  type="file"
                  webkitdirectory="true"
                  directory="true"
                  multiple
                  onChange={handleFallbackFolderUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Processing Progress Bar */}
          {isProcessing && progress && (
            <div className="bg-blue-950/40 border border-blue-500/40 rounded-2xl p-4 space-y-2.5 animate-pulse">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-300 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>{progress.message}</span>
                </span>
                <span className="font-mono text-amber-400 font-bold">
                  {progress.current} از {progress.total} ({progress.percentage}٪)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-400 transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Success Summary */}
          {syncSummary && (
            <div className="bg-emerald-950/40 border border-emerald-600/40 rounded-2xl p-4 space-y-1.5 text-emerald-300">
              <div className="flex items-center gap-2 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>عملیات با موفقیت انجام شد:</span>
              </div>
              <p className="text-[11px] text-slate-200">{syncSummary.message}</p>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 p-3 rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* List of device folders preview */}
          <div className="bg-slate-850 border border-slate-750 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 text-xs">
                فهرست پوشه‌های متناظر با دستگاه‌های موجود ({devices.length} دستگاه):
              </span>
              <span className="text-[10px] text-slate-400">نام پوشه در درایو</span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800">
              {devices.map((d, idx) => {
                const fName = getDeviceFolderName(d);
                const photoCount = (d.images || []).length;
                return (
                  <div key={d.id} className="pt-1.5 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-500 font-mono text-[10px]">{idx + 1}.</span>
                      <span className="font-bold text-white truncate max-w-xs">{d.name}</span>
                      <span className="text-slate-400 text-[10px] hidden sm:inline">({d.model || '-'})</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-mono text-amber-300 bg-slate-900 px-2 py-0.5 rounded text-[10px] truncate max-w-[150px]">
                        📁 {fName}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${photoCount > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                        {photoCount} عکس
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            بستن
          </button>

          {connectedDirectory && (
            <button
              type="button"
              onClick={handleSyncImages}
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-blue-900/30 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-amber-300 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>همگام‌سازی و بروزرسانی عکس‌ها از درایو</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
