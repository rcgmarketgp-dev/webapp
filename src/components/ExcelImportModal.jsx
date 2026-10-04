import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Table,
  Sparkles,
  RefreshCw,
  Key,
  Sliders,
  Check
} from 'lucide-react';
import { parseExcelFile, generateSampleCsvContent } from '../utils/excelParser';
import { sampleDevices } from '../data/sampleData';
import { 
  hasGeminiApiKey, 
  getGeminiApiKey,
  setGeminiApiKey,
  batchGenerateGeminiCaptions, 
  GEMINI_MODEL 
} from '../services/geminiService';

export default function ExcelImportModal({ 
  profile,
  onClose, 
  onImportSuccess,
  onOpenApiKeySettings
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [importResult, setImportResult] = useState(null);
  
  // Gemini AI options
  const [enableGeminiAi, setEnableGeminiAi] = useState(true);
  const [aiTone, setAiTone] = useState('ATTRACTIVE');
  const [aiProgress, setAiProgress] = useState(null); // { current, total, currentDeviceName, percentage }
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [inlineKey, setInlineKey] = useState('');
  const [hasKey, setHasKey] = useState(() => hasGeminiApiKey());

  const handleSaveInlineKey = () => {
    if (inlineKey.trim()) {
      setGeminiApiKey(inlineKey.trim());
      setHasKey(true);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setIsLoading(true);
    setErrorMsg('');
    setImportResult(null);
    setAiProgress(null);

    // Auto-save inline key if user typed it
    let activeKey = getGeminiApiKey();
    if (!activeKey && inlineKey.trim()) {
      setGeminiApiKey(inlineKey.trim());
      setHasKey(true);
      activeKey = inlineKey.trim();
    }

    try {
      const result = await parseExcelFile(file);
      if (result.devices.length === 0) {
        throw new Error('هیچ دستگاهی در فایل اکسل یافت نشد.');
      }

      let finalDevices = result.devices;

      // If Gemini AI is enabled and we have an API key or want to run AI
      if (enableGeminiAi && activeKey) {
        setIsAiProcessing(true);
        try {
          finalDevices = await batchGenerateGeminiCaptions({
            devices: result.devices,
            profile,
            tone: aiTone,
            onProgress: (p) => setAiProgress(p)
          });
        } catch (aiErr) {
          console.warn('Gemini batch error, proceeding with parsed devices:', aiErr);
        } finally {
          setIsAiProcessing(false);
        }
      }

      setImportResult({
        ...result,
        devices: finalDevices,
        aiGeneratedCount: finalDevices.filter(d => d.isAiGenerated).length
      });
      onImportSuccess(finalDevices);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'خطا در خواندن فایل اکسل. لطفاً از فرمت معتبر xlsx یا csv استفاده فرمایید.');
    } finally {
      setIsLoading(false);
      setIsAiProcessing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDownloadSample = () => {
    const csvContent = generateSampleCsvContent();
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_machines_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadSampleDemo = async () => {
    let demoList = [...sampleDevices];
    if (enableGeminiAi && hasKey) {
      setIsLoading(true);
      setIsAiProcessing(true);
      try {
        demoList = await batchGenerateGeminiCaptions({
          devices: sampleDevices.slice(0, 3), // AI caption for first 3 demo devices
          profile,
          tone: aiTone,
          onProgress: (p) => setAiProgress(p)
        });
      } catch (err) {
        console.warn('Demo AI error:', err);
      } finally {
        setIsLoading(false);
        setIsAiProcessing(false);
      }
    }
    onImportSuccess(demoList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base sm:text-lg font-bold text-white">آپلود و ورود هوشمند اطلاعات از فایل اکسل</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1 text-xs">
          
          {/* Gemini AI Auto-Generation Banner */}
          <div className="bg-gradient-to-r from-blue-950/50 via-indigo-950/40 to-slate-850 border border-blue-600/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enableGeminiAi}
                  onChange={(e) => setEnableGeminiAi(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500"
                />
                <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>تولید خودکار کپشن با هوش مصنوعی Gemini ({GEMINI_MODEL})</span>
                </span>
              </label>

              {!hasKey && onOpenApiKeySettings && (
                <button
                  type="button"
                  onClick={onOpenApiKeySettings}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20"
                >
                  <Key className="w-3 h-3" />
                  <span>تنظیم کلید API</span>
                </button>
              )}
            </div>

            {enableGeminiAi && (
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  هوش مصنوعی بلافاصله پس از پردازش فایل اکسل، سطر به سطر مشخصات فنی، قیمت، درصد نقد و اقساط دستگاه‌ها را می‌خواند و متن فروش فارسی حرفه‌ای و بدون غلط نگارش می‌کند.
                </p>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-400 text-[10px]">لحن نگارش:</span>
                  {[
                    { id: 'ATTRACTIVE', label: '🔥 جذاب و پربازدید' },
                    { id: 'INDUSTRIAL', label: '🏢 رسمی و صنعتی' },
                    { id: 'INSTALLMENT', label: '💳 ویژه شرایط اقساط' },
                    { id: 'COMPACT', label: '📋 کاتالوگی کوتاه' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setAiTone(t.id)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all ${
                        aiTone === t.id 
                          ? 'bg-blue-600 text-white font-bold' 
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {!hasKey && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-amber-300">
                      <span>🔑 وارد کردن کلید Gemini API جهت فعال‌سازی تولید خودکار:</span>
                      <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        دریافت رایگان کلید
                      </a>
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="password"
                        value={inlineKey}
                        onChange={(e) => setInlineKey(e.target.value)}
                        placeholder="کلید API خود را اینجا جای‌گذاری کنید (AIzaSy...)"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono text-[11px] focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleSaveInlineKey}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] rounded-xl transition-colors whitespace-nowrap"
                      >
                        ثبت کلید
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Progress Bar during import */}
          {isAiProcessing && aiProgress && (
            <div className="bg-blue-950/40 border border-blue-500/40 rounded-2xl p-4 space-y-2.5 animate-pulse">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-300 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>در حال نگارش کپشن هوشمند با هوش مصنوعی Gemini...</span>
                </span>
                <span className="font-mono text-amber-400 font-bold">
                  {aiProgress.current} از {aiProgress.total} ({aiProgress.percentage}٪)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-amber-400 transition-all duration-300"
                  style={{ width: `${aiProgress.percentage}%` }}
                ></div>
              </div>
              {aiProgress.currentDeviceName && (
                <p className="text-[11px] text-slate-400 truncate">
                  در حال بررسی: <strong className="text-white">{aiProgress.currentDeviceName}</strong>
                </p>
              )}
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 p-3.5 rounded-2xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Summary */}
          {importResult && (
            <div className="bg-emerald-950/40 border border-emerald-700/50 text-emerald-300 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>عملیات استخراج و ثبت با موفقیت انجام شد!</span>
              </div>
              <p>تعداد {importResult.totalRows} دستگاه از فایل اکسل استخراج شدند.</p>
              {importResult.aiGeneratedCount > 0 && (
                <p className="text-amber-300 flex items-center gap-1 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>کپشن {importResult.aiGeneratedCount} دستگاه مستقیماً توسط Gemini AI تولید شد.</span>
                </p>
              )}
              {importResult.detectedColumns.length > 0 && (
                <p className="text-[11px] text-emerald-400/80">
                  ستون‌های شناسایی شده: {importResult.detectedColumns.slice(0, 6).join('، ')}...
                </p>
              )}
              <button
                onClick={onClose}
                className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors"
              >
                مشاهده دستگاه‌ها در لیست
              </button>
            </div>
          )}

          {/* Upload Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-7 text-center transition-all flex flex-col items-center justify-center ${
              isDragging 
                ? 'border-blue-400 bg-blue-950/20 scale-[0.99]' 
                : 'border-slate-700 hover:border-slate-600 bg-slate-950/50'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-2.5 shadow-inner">
              <UploadCloud className="w-7 h-7" />
            </div>

            <h4 className="text-sm font-bold text-white mb-1">
              فایل اکسل (.xlsx, .xls) یا .csv را به اینجا بکشید
            </h4>
            <p className="text-slate-400 mb-3.5 text-[11px]">
              سیستم به صورت خودکار سطرها را تفکیک کرده و مشخصات فنی، مبالغ نقد و اقساط را تشخیص می‌دهد.
            </p>

            <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-blue-900/30 transition-all text-xs">
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isLoading ? 'در حال پردازش...' : 'انتخاب فایل اکسل از کامپیوتر یا گوشی'}</span>
              <input 
                type="file" 
                accept=".xlsx,.xls,.csv" 
                onChange={(e) => handleFileUpload(e.target.files[0])}
                disabled={isLoading}
                className="hidden" 
              />
            </label>
          </div>

          {/* Quick Demo & Download Sample Tools */}
          <div className="bg-slate-850 border border-slate-750 rounded-2xl p-3.5 space-y-2">
            <h4 className="font-bold text-slate-300">ابزارهای کمکی و تست:</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadSample}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>دریافت فایل نمونه اکسل (CSV)</span>
              </button>

              <button
                type="button"
                onClick={handleLoadSampleDemo}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold transition-colors"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>بارگذاری دستگاه‌های تستی صنایع چوب آرسی</span>
              </button>
            </div>
          </div>

          {/* Column structure guidelines */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <Table className="w-4 h-4 text-blue-400" />
              <span>ستون‌های مورد پشتیبانی در فایل اکسل:</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="font-bold text-blue-400">نام دستگاه:</span> دورکن، لبه‌چسبان، CNC و...
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="font-bold text-blue-400">مدل:</span> PS-3200، EB-600 و...
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="font-bold text-blue-400">سال ساخت:</span> ۱۴۰۲، 2023 و...
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="font-bold text-blue-400">قیمت کل:</span> مثلاً ۳۸۵,۰۰۰,۰۰۰ تومان
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="font-bold text-blue-400">درصد نقدی:</span> 40%
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="font-bold text-blue-400">تعداد اقساط:</span> 10 ماه
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="font-bold text-blue-400">میزان گارانتی:</span> ۱۲ ماه گارانتی قطعات
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="font-bold text-blue-400">مشخصات:</span> طول ریل، قدرت موتور و...
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
