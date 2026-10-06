import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles, Smartphone } from 'lucide-react';

export default function PWAInstallBanner({ 
  onOpenModal, 
  deferredPrompt, 
  isInstalled 
}) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed recently (within 24 hours)
    const lastDismissed = localStorage.getItem('pwa_banner_dismissed');
    if (lastDismissed) {
      const timeDiff = Date.now() - parseInt(lastDismissed, 10);
      if (timeDiff < 24 * 60 * 60 * 1000) {
        setDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa_banner_dismissed', Date.now().toString());
  };

  // If already running inside installed standalone PWA, or user dismissed, don't show
  if (isInstalled || dismissed) return null;

  return (
    <aside 
      aria-label="پیشنهاد نصب وب‌اپلیکیشن"
      className="bg-gradient-to-r from-amber-600/90 via-orange-600/90 to-blue-700/90 text-white py-2 px-3 sm:px-4 shadow-md backdrop-blur-md relative z-30 transition-all border-b border-amber-400/30"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
        
        {/* Banner Info */}
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-[#0A1836] p-0.5 flex-shrink-0 flex items-center justify-center border border-blue-400/40 overflow-hidden">
            <img src="/rcg-logo.svg" alt="RCG" className="w-full h-full object-contain" />
          </div>
          <div className="truncate">
            <span className="font-black text-amber-200 ml-1.5">نصب وب‌اپلیکیشن (PWA):</span>
            <span className="text-slate-100 hidden sm:inline">
              دسترسی سریع، آفلاین و بدون نیاز به دانلود فایل APK یا گوگل‌پلی
            </span>
            <span className="text-slate-100 sm:hidden">
              نصب آسان با دسترسی آفلاین
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onOpenModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 text-amber-400 hover:text-amber-300 font-bold text-xs shadow transition-all active:scale-95 border border-amber-400/40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>نصب برنامه</span>
          </button>
          
          <button
            onClick={handleDismiss}
            className="p-1 text-slate-200 hover:text-white rounded-md hover:bg-slate-950/30 transition-colors"
            title="بستن اعلان"
            aria-label="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </aside>
  );
}
