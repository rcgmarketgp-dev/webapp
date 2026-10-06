import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  Laptop, 
  CheckCircle2, 
  Share2, 
  PlusSquare, 
  X, 
  Sparkles, 
  Zap, 
  WifiOff, 
  ShieldCheck,
  Check
} from 'lucide-react';

export default function PWAInstallModal({ 
  isOpen, 
  onClose, 
  deferredPrompt, 
  isInstalled, 
  onInstallSuccess 
}) {
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isAndroidDevice = /android/.test(ua);
    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[PWA] Install prompt outcome: ${outcome}`);
        if (outcome === 'accepted') {
          if (onInstallSuccess) onInstallSuccess();
          onClose();
        }
      } catch (err) {
        console.error('[PWA] Install error:', err);
      } finally {
        setInstalling(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden text-right"
        dir="rtl"
      >
        {/* Subtle background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="بستن"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-[#0A1836] border border-blue-500/40 p-1.5 shadow-lg shadow-blue-950/50 flex items-center justify-center overflow-hidden">
            <img 
              src="/icon.svg" 
              alt="لوگو RCG" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">نصب وب‌اپلیکیشن (PWA)</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500 text-slate-950 rounded-full">
                نسخه پیشرو
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              دستگاه‌یار | سامانه جامع ماشین‌آلات و کپشن‌ساز
            </p>
          </div>
        </div>

        {/* Already Installed State */}
        {isInstalled ? (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 mb-5">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <div className="text-xs leading-relaxed">
              <strong>برنامه از قبل روی دستگاه شما نصب شده است!</strong>
              <p className="text-emerald-400/80 text-[11px] mt-0.5">
                می‌توانید مستقیماً از صفحه اصلی گوشی یا دسکتاپ برنامه را مانند یک اپلیکیشن بومی اجرا کنید.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Value Proposition Cards */}
            <div className="grid grid-cols-2 gap-2.5 mb-5 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2.5">
                <WifiOff className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-200">دسترسی آفلاین</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">کار با برنامه حتی بدون اتصال به اینترنت</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-200">سرعت فوق‌العاده</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">حجم کمتر از ۱ مگابایت، بدون کندی</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2.5">
                <Smartphone className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-200">تجربه تمام‌صفحه</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">بدون نوار آدرس مرورگر مثل اپ بومی</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-200">آپدیت خودکار</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">همیشه آخرین نسخه بدون دانلود مجدد</p>
                </div>
              </div>
            </div>

            {/* Instruction for iOS Safari vs Standard Android/Chrome */}
            {isIOS ? (
              <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 mb-5">
                <h3 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-2.5">
                  <Smartphone className="w-4 h-4" />
                  راهنمای نصب روی آیفون و آیپد (iOS Safari):
                </h3>
                <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside pr-1">
                  <li>
                    در مرورگر <strong className="text-white">سافاری (Safari)</strong>، دکمه{' '}
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-700 text-blue-300 font-mono text-[11px]">
                      <Share2 className="w-3 h-3 inline" /> Share
                    </span>{' '}
                    پایین صفحه را لمس کنید.
                  </li>
                  <li>
                    منو را به بالا کشیده و گزینه{' '}
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-700 text-amber-300 font-semibold text-[11px]">
                      <PlusSquare className="w-3 h-3 inline" /> Add to Home Screen
                    </span>{' '}
                    (افزودن به صفحه اصلی) را انتخاب کنید.
                  </li>
                  <li>
                    در گوشه بالا دکمه <strong className="text-white">Add</strong> را بزنید تا آیکون برنامه به صفحه اصلی شما افزوده شود.
                  </li>
                </ol>
              </div>
            ) : deferredPrompt ? (
              <div className="mb-5">
                <button
                  onClick={handleInstallClick}
                  disabled={installing}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Download className="w-4 h-4" />
                  {installing ? 'در حال آماده‌سازی نصب...' : 'نصب مستقیم روی گوشی یا رایانه'}
                </button>
                <p className="text-center text-[11px] text-slate-400 mt-2">
                  بدون نیاز به گوگل پلی یا بازار، تنها با یک کلیک نصب می‌شود
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 mb-5 text-xs text-slate-300 space-y-2">
                <h3 className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Laptop className="w-4 h-4" />
                  راهنمای نصب از طریق مرورگر (Chrome / Edge / سامسونگ):
                </h3>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  روی علامت سه نقطه مرورگر (⋮) کلیک کرده و گزینه <strong>«نصب برنامه» (Install app)</strong> یا <strong>«افزودن به صفحه اصلی» (Add to Home screen)</strong> را انتخاب کنید.
                </p>
              </div>
            )}
          </>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition-colors"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
}
