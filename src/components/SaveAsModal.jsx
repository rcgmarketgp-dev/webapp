import React, { useState } from 'react';
import { 
  Save, 
  FileText, 
  FileSpreadsheet, 
  Code, 
  CheckCircle2, 
  X, 
  Download, 
  Info,
  Calendar,
  Sparkles,
  FolderArchive
} from 'lucide-react';
import { createComprehensiveZipBackup } from '../utils/zipBackupUtils';

export default function SaveAsModal({ 
  isOpen, 
  onClose, 
  devices, 
  sellerProfile, 
  onExportJson, 
  onExportCsv, 
  showToast 
}) {
  const [fileName, setFileName] = useState(() => {
    const d = new Date();
    const dateStr = d.toLocaleDateString('fa-IR').replace(/\//g, '-');
    return `RCG-Machinery-Stock-${dateStr}`;
  });
  const [format, setFormat] = useState('zip'); // 'zip', 'json', 'csv', 'html'
  const [versionNote, setVersionNote] = useState('موجودی انبار مرکزی و نمایندگی پایون رشت');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExecuteSaveAs = async () => {
    const cleanName = (fileName || 'DastgahYar-Backup').trim();

    if (format === 'zip') {
      try {
        setIsExporting(true);
        showToast('در حال ساخت فایل فشرده ZIP شامل فولدرهای عکس دستگاه‌ها...');
        await createComprehensiveZipBackup({
          devices,
          sellerProfile,
          customFileName: cleanName
        });
        showToast(`فایل فشرده با نام ${cleanName}.zip ذخیره شد 📦`);
      } catch (err) {
        showToast('خطا در ایجاد فایل ZIP: ' + err.message);
      } finally {
        setIsExporting(false);
      }
    } else if (format === 'json') {
      onExportJson(cleanName, versionNote);
    } else if (format === 'csv') {
      onExportCsv(cleanName);
    } else if (format === 'html') {
      const a = document.createElement('a');
      a.href = '/standalone-app.html';
      a.download = `${cleanName}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`فایل وب مستقل با نام ${cleanName}.html ذخیره شد ✓`);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
              💾
            </div>
            <div>
              <h3 className="text-base font-bold text-white">ذخیره با نام دلخواه (Save As...)</h3>
              <p className="text-[11px] text-slate-400">خروجی و بایگانی پروژه‌ها، دستگاه‌ها و تصاویر با فرمت دلخواه</p>
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
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          
          {/* File Name */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">نام فایل ذخیره:</label>
            <div className="relative">
              <input 
                type="text" 
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="مثال: RCG-Woodworking-Stock"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">پسوند فایل به صورت خودکار متناسب با فرمت انتخابی اضافه می‌شود.</p>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-slate-300 font-bold mb-2">فرمت خروجی مورد نظر:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              <div 
                onClick={() => setFormat('zip')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  format === 'zip' 
                    ? 'bg-blue-950/50 border-blue-500 ring-1 ring-blue-500' 
                    : 'bg-slate-800/80 border-slate-750 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xl">🗜️</span>
                  {format === 'zip' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                </div>
                <h5 className="font-bold text-white text-xs">پشتیبان جامع ZIP (پیشنهادی)</h5>
                <p className="text-[10px] text-slate-300 mt-0.5">شامل فایل بکاپ + فولدر تفکیک‌شده عکس‌ها به نام هر دستگاه</p>
              </div>

              <div 
                onClick={() => setFormat('json')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  format === 'json' 
                    ? 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500' 
                    : 'bg-slate-800/80 border-slate-750 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xl">📦</span>
                  {format === 'json' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                </div>
                <h5 className="font-bold text-white text-xs">پشتیبان کامل JSON</h5>
                <p className="text-[10px] text-slate-400 mt-0.5">شامل تمام دستگاه‌ها و عکس‌های آفلاین به صورت متن فشرده</p>
              </div>

              <div 
                onClick={() => setFormat('csv')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  format === 'csv' 
                    ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500' 
                    : 'bg-slate-800/80 border-slate-750 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xl">📊</span>
                  {format === 'csv' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <h5 className="font-bold text-white text-xs">فایل اکسل / CSV</h5>
                <p className="text-[10px] text-slate-400 mt-0.5">جدول مشخصات دستگاه‌ها و شرایط نقد و اقساط</p>
              </div>

              <div 
                onClick={() => setFormat('html')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  format === 'html' 
                    ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500' 
                    : 'bg-slate-800/80 border-slate-750 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xl">🌐</span>
                  {format === 'html' && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                </div>
                <h5 className="font-bold text-white text-xs">فایل مستقل وب (HTML)</h5>
                <p className="text-[10px] text-slate-400 mt-0.5">اجرای آفلاین و تک‌فایلی روی هر سیستم و گوشی بدون نصب</p>
              </div>

            </div>
          </div>

          {/* Description note */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">یادداشت نسخه یا توضیحات فایل:</label>
            <input 
              type="text"
              value={versionNote}
              onChange={(e) => setVersionNote(e.target.value)}
              placeholder="مثال: لیست قیمت ماشین‌آلات پایون - پاییز ۱۴۰۳"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Info pill */}
          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl text-xs text-slate-300 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              تعداد <span className="font-bold text-white">{devices.length}</span> دستگاه در این فایل ذخیره خواهد شد. فایل‌های عکس به صورت داده‌های باکیفیت درون فایل قرار می‌گیرند و روی هر گوشی و کامپیوتر بدون نیاز به اینترنت کار می‌کنند.
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2 bg-slate-900/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            انصراف
          </button>
          <button
            onClick={handleExecuteSaveAs}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white text-xs flex items-center gap-1.5 shadow-lg shadow-blue-900/40"
          >
            <Download className="w-4 h-4" />
            <span>ذخیره و دانلود فایل</span>
          </button>
        </div>

      </div>
    </div>
  );
}
