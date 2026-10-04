import React, { useState } from 'react';
import { 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Smartphone, 
  Laptop, 
  HardDriveDownload,
  Share2,
  Image as ImageIcon,
  Archive,
  FolderArchive,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { prepareDevicesForExport } from '../utils/imageUtils';
import { createComprehensiveZipBackup, parseBackupZipOrJson } from '../utils/zipBackupUtils';

export default function BackupModal({ 
  isOpen, 
  onClose, 
  devices, 
  sellerProfile, 
  connectedDirectory = null,
  onRestoreBackup, 
  showToast 
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedBackup, setParsedBackup] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [zipProgress, setZipProgress] = useState(null); // { message, percentage }

  if (!isOpen) return null;

  // ۱. پشتیبان‌گیری جامع ZIP با فولدرهای تفکیک‌شده عکس‌ها
  const handleExportZip = async () => {
    try {
      setIsExporting(true);
      setErrorMsg('');
      showToast('در حال ساخت فایل فشرده ZIP شامل فایل بکاپ و فولدرهای عکس...');

      await createComprehensiveZipBackup({
        devices,
        sellerProfile,
        connectedDirectory,
        onProgress: (p) => setZipProgress(p)
      });

      setIsExporting(false);
      setZipProgress(null);
      showToast('فایل فشرده ZIP حاوی فولدرهای عکس و داده‌های پشتیبان دانلود شد 📦');
    } catch (err) {
      console.error(err);
      setIsExporting(false);
      setZipProgress(null);
      setErrorMsg('خطا در ایجاد فایل ZIP: ' + err.message);
    }
  };

  // ۲. خروجی فایل پشتیبان JSON همراه با Base64
  const handleExportJson = async () => {
    try {
      setIsExporting(true);
      showToast('در حال آماده‌سازی و تبدیل عکس‌های دستگاه‌ها به داده‌های پشتیبان...');

      const embeddedDevices = await prepareDevicesForExport(devices);
      const now = new Date();
      const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);

      const backupData = {
        app: 'DastgahYar',
        company: 'گروه صنعتی آرسی (RCG)',
        version: '3.0',
        exportedAt: now.toISOString(),
        totalDevices: embeddedDevices.length,
        sellerProfile: sellerProfile,
        devices: embeddedDevices
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RCG-Backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsExporting(false);
      showToast('فایل پشتیبان کامل همراه با تمامی عکس‌های دستگاه‌ها ذخیره شد 💾');
    } catch (err) {
      setIsExporting(false);
      showToast('خطا در دانلود فایل پشتیبان');
    }
  };

  // ۳. خروجی CSV از دستگاه‌ها
  const handleExportCsv = () => {
    if (devices.length === 0) {
      showToast('هیچ دستگاهی برای خروجی وجود ندارد.');
      return;
    }

    const headers = ['نام دستگاه', 'مدل', 'سال ساخت', 'قیمت کل', 'درصد نقد', 'تعداد اقساط', 'میزان گارانتی', 'وضعیت', 'محل بازدید', 'مشخصات فنی'];
    const rows = devices.map(d => [
      `"${(d.name || '').replace(/"/g, '""')}"`,
      `"${(d.model || '').replace(/"/g, '""')}"`,
      `"${(d.year || '').replace(/"/g, '""')}"`,
      `"${(d.totalPrice || '').replace(/"/g, '""')}"`,
      d.cashPercentage || 0,
      d.installmentMonths || 0,
      `"${(d.warranty || '').replace(/"/g, '""')}"`,
      `"${(d.condition || '').replace(/"/g, '""')}"`,
      `"${(d.location || '').replace(/"/g, '""')}"`,
      `"${(d.specifications || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dastgah_list_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('فایل اکسل/CSV دستگاه‌ها دانلود شد ✓');
  };

  // ۴. انتخاب و بررسی فایل پشتیبان (پشتیبانی از JSON و ZIP)
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setErrorMsg('');
    setSelectedFile(file);

    try {
      const parsed = await parseBackupZipOrJson(file);
      setParsedBackup(parsed);
    } catch (err) {
      setErrorMsg(err.message || 'خطا در خواندن فایل پشتیبان.');
      setParsedBackup(null);
    }
  };

  // ۵. تأیید بازیابی
  const handleApplyRestore = (mode) => {
    if (!parsedBackup) return;
    onRestoreBackup(parsedBackup, mode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">پشتیبان‌گیری، خروجی و بازیابی اطلاعات</h3>
              <p className="text-[11px] text-slate-400">انتقال اطلاعات به سیستم یا گوشی دیگر بدون از دست رفتن داده‌ها</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
          
          {/* راهنمای انتقال به دستگاه دیگر */}
          <div className="bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-700/40 rounded-2xl p-4 space-y-2">
            <h4 className="font-bold text-purple-300 text-sm flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-purple-400" />
              <span>چطور دستگاه‌ها و اطلاعات را به موبایل یا کامپیوتر دیگر منتقل کنم؟</span>
            </h4>
            <ol className="list-decimal list-inside text-slate-300 space-y-1 text-xs leading-relaxed">
              <li>دکمه‌ی <strong>«دانلود فایل پشتیبان کامل (.json)»</strong> را بزنید تا فایل ذخیره شود.</li>
              <li>این فایل را از طریق پیام‌رسان‌ها (بله، ایتا، تلگرام)، ایمیل یا فلش به گوشی یا سیستم دوم بفرستید.</li>
              <li>در گوشی یا سیستم دوم، وارد برنامه شده و در بخش <strong>«بازیابی از فایل پشتیبان»</strong> این فایل را انتخاب کنید.</li>
              <li>تمام دستگاه‌ها به همراه عکس‌ها، سال ساخت، اقساط و پروفایل شما بلافاصله بارگذاری می‌شوند!</li>
            </ol>
          </div>

          {/* بخش تهیه پشتیبان (Export) */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-sm">تهیه نسخه پشتیبان (خروجی)</h4>
                <p className="text-xs text-slate-400 mt-0.5">شامل {devices.length} دستگاه، تمام عکس‌ها، شرایط پرداخت و اطلاعات تماس فروشنده</p>
              </div>
              <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                پشتیبانی از ZIP و JSON
              </span>
            </div>

            {/* کارت ویژه پشتیبان‌گیری فشرده ZIP */}
            <div className="bg-gradient-to-r from-blue-950/50 via-indigo-950/40 to-purple-950/50 border border-blue-500/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/25 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <FolderArchive className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs sm:text-sm">
                      پشتیبان‌گیری فشرده ZIP (فایل بکاپ + فولدر جداگانه عکس هر دستگاه)
                    </h5>
                    <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                      یک فایل فشرده ZIP تولید می‌شود که درون آن هم فایل داده‌های JSON وجود دارد و هم برای هر دستگاه یک پوشه اختصاصی شامل تمام عکس‌ها و مشخصات متنی آن قرار گرفته است.
                    </p>
                    {connectedDirectory && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 w-fit">
                        <span>📁 پوشه درایو متصل: {connectedDirectory.name} (پوشه‌های این درایو در ZIP قرار می‌گیرند)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportZip}
                disabled={isExporting}
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all text-xs sm:text-sm disabled:opacity-50"
              >
                {isExporting && zipProgress ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                    <span>{zipProgress.message}</span>
                  </>
                ) : (
                  <>
                    <FolderArchive className="w-4 h-4 text-amber-300" />
                    <span>دانلود فایل فشرده ZIP (بکاپ کامل + فولدرهای عکس) 📦</span>
                  </>
                )}
              </button>

              {/* Progress bar */}
              {isExporting && zipProgress && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span>{zipProgress.message}</span>
                    <span className="font-mono text-amber-400">{zipProgress.percentage}٪</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-amber-400 transition-all duration-300"
                      style={{ width: `${zipProgress.percentage}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* گزینه‌های پشتیبان استاندارد JSON و CSV */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleExportJson}
                disabled={isExporting}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition-all text-xs disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>دانلود فایل استاندارد (.json)</span>
              </button>

              <button
                onClick={handleExportCsv}
                disabled={isExporting}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-all text-xs disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>خروجی فایل اکسل/CSV</span>
              </button>
            </div>
          </div>

          {/* بخش بازیابی اطلاعات (Restore) */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-3">
            <h4 className="font-bold text-white text-sm">بازیابی از فایل پشتیبان (Restore)</h4>
            <p className="text-xs text-slate-400">
              فایل پشتیبان فشرده (.zip) یا فایل داده‌ها (.json) را انتخاب نمایید تا اطلاعات روی این دستگاه بارگذاری شوند:
            </p>

            <div
              className="border-2 border-dashed border-slate-700 hover:border-purple-500 bg-slate-950/60 rounded-2xl p-6 text-center cursor-pointer transition-all"
              onClick={() => document.getElementById('reactBackupInput').click()}
            >
              <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="font-bold text-white text-xs mb-1">انتخاب یا رها کردن فایل پشتیبان (.zip یا .json)</p>
              <p className="text-[11px] text-slate-400">
                {selectedFile ? selectedFile.name : 'پشتیبانی از هر دو فرمت ZIP و JSON - برای انتخاب کلیک کنید'}
              </p>
              <input 
                type="file" 
                id="reactBackupInput" 
                accept=".json,.zip,application/zip" 
                className="hidden" 
                onChange={handleFileChange} 
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {parsedBackup && (
              <div className="bg-slate-900 border border-purple-500/40 rounded-xl p-4 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300">اطلاعات فایل پشتیبان با موفقیت شناسایی شد:</span>
                  <span className="text-xs font-bold text-white bg-purple-600/30 px-2.5 py-1 rounded-md">
                    {parsedBackup.devices ? parsedBackup.devices.length : 0} دستگاه
                  </span>
                </div>
                
                <p className="text-xs text-slate-400">
                  تاریخ پشتیبان: {parsedBackup.exportedAt ? new Date(parsedBackup.exportedAt).toLocaleString('fa-IR') : 'نامشخص'}
                  {parsedBackup.sellerProfile && parsedBackup.sellerProfile.businessName && (
                    <span> | فروشگاه: {parsedBackup.sellerProfile.businessName}</span>
                  )}
                </p>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleApplyRestore('REPLACE')}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-all shadow"
                  >
                    جایگزینی کامل لیست با این فایل
                  </button>
                  <button
                    onClick={() => handleApplyRestore('MERGE')}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-3 rounded-xl text-xs transition-all border border-slate-700"
                  >
                    افزودن و ادغام با لیست فعلی
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
