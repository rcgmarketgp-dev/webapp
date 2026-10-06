import React, { useState } from 'react';
import { 
  Globe, 
  Copy, 
  Check, 
  Share2, 
  RefreshCw, 
  ExternalLink, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Smartphone, 
  Zap, 
  Send, 
  QrCode,
  AlertCircle
} from 'lucide-react';
import { checkForUpdate, applyUpdate } from '../registerServiceWorker';

export default function SharePublicAppModal({ 
  isOpen, 
  onClose, 
  isUpdateAvailable,
  onApplyUpdate,
  showToast 
}) {
  const [copied, setCopied] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(null); // null | { message, hasUpdate }
  const [showQR, setShowQR] = useState(false);

  // Official Public App URL
  const publicUrl = 'https://ais-pre-pjkgm55qbk6esdtblcleqp-55588296822.europe-west2.run.app';
  const appVersion = 'v1.2.5';

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    if (showToast) showToast('لینک عمومی برنامه با موفقیت کپی شد ✓');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    setUpdateStatus(null);
    try {
      const res = await checkForUpdate();
      setUpdateStatus({
        message: res.message,
        hasUpdate: res.updated
      });
      if (res.updated && showToast) {
        showToast('نسخه جدیدتر کشف شد! می‌توانید آن را اعمال کنید.');
      }
    } catch (err) {
      setUpdateStatus({
        message: 'خطا در بررسی به‌روزرسانی. اتصال خود را بررسی کنید.',
        hasUpdate: false
      });
    } finally {
      setCheckingUpdate(false);
    }
  };

  // Messenger share messages
  const shareText = `سلام! سامانه هوشمند «دستگاه‌یار» (مدیریت ماشین‌آلات و کپشن‌ساز حرفه‌ای گروه صنعتی آرسی) آماده استفاده است.\n\n🌐 لینک دسترسی عمومی و نصب مستقیم:\n${publicUrl}`;

  const shareToWhatsapp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const shareToTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(publicUrl)}&text=${encodeURIComponent('سامانه هوشمند دستگاه‌یار | گروه صنعتی آرسی')}`, '_blank');
  };

  const shareToEitaa = () => {
    window.open(`https://eitaa.com/share/url?url=${encodeURIComponent(publicUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const shareToBale = () => {
    window.open(`https://ble.ir/share/url?url=${encodeURIComponent(publicUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden text-right"
        dir="rtl"
      >
        {/* Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="بستن"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-[#0A1836] border border-blue-500/40 p-1 flex items-center justify-center shadow-lg shadow-blue-950/50 flex-shrink-0 overflow-hidden">
            <img src="/rcg-logo.svg" alt="RCG" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">لینک اشتراک‌گذاری عمومی و آپدیت</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                {appVersion}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              لینک عمومی آنلاین جهت دسترسی همگانی و دریافت آخرین نسخه‌ها
            </p>
          </div>
        </div>

        {/* Public Link Box */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 mb-4">
          <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 flex items-center justify-between">
            <span>آدرس عمومی وب‌اپلیکیشن (Public URL):</span>
            <span className="text-emerald-400 text-[10px] flex items-center gap-1 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              آنلاین و فعال
            </span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 select-all focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
                copied 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
              }`}
              title="کپی لینک عمومی"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'کپی شد' : 'کپی لینک'}</span>
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="باز کردن در پنجره جدید"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Social Share Buttons */}
        <div className="mb-5">
          <label className="text-[11px] font-semibold text-slate-400 block mb-2">
            ارسال سریع لینک به پیام‌رسان‌ها:
          </label>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={shareToWhatsapp}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 transition-all text-[11px] font-bold"
            >
              <span className="text-base mb-1">💬</span>
              <span>واتساپ</span>
            </button>

            <button
              onClick={shareToTelegram}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-sky-950/40 hover:bg-sky-900/50 border border-sky-500/30 text-sky-300 transition-all text-[11px] font-bold"
            >
              <span className="text-base mb-1">✈️</span>
              <span>تلگرام</span>
            </button>

            <button
              onClick={shareToEitaa}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 text-amber-300 transition-all text-[11px] font-bold"
            >
              <span className="text-base mb-1">🇮🇷</span>
              <span>ایتا</span>
            </button>

            <button
              onClick={shareToBale}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/30 text-blue-300 transition-all text-[11px] font-bold"
            >
              <span className="text-base mb-1">🔷</span>
              <span>بله</span>
            </button>
          </div>
        </div>

        {/* Live Version & Automatic Update Card */}
        <div className="bg-slate-850/80 border border-slate-700/80 rounded-xl p-3.5 mb-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white">قابلیت آپدیت خودکار (Live PWA Update)</span>
            </div>
            <button
              onClick={handleCheckUpdate}
              disabled={checkingUpdate}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 text-cyan-400 ${checkingUpdate ? 'animate-spin' : ''}`} />
              <span>{checkingUpdate ? 'در حال بررسی...' : 'بررسی نسخه جدید'}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            این برنامه از فناوری <strong>سرویس‌ورکر (Service Worker)</strong> استفاده می‌کند. به محض انتشار تغییرات یا قابلیت‌های جدید، بدون نیاز به دانلود دستی فایل نصبی، نسخه جدید به صورت خودکار دریافت می‌شود.
          </p>

          {/* Update result feedback */}
          {updateStatus && (
            <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
              updateStatus.hasUpdate 
                ? 'bg-amber-950/50 border border-amber-500/40 text-amber-300' 
                : 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
            }`}>
              {updateStatus.hasUpdate ? (
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              )}
              <span>{updateStatus.message}</span>
            </div>
          )}

          {/* If update ready */}
          {(isUpdateAvailable || updateStatus?.hasUpdate) && (
            <div className="pt-1">
              <button
                onClick={() => {
                  if (onApplyUpdate) onApplyUpdate();
                  else applyUpdate();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-900/30 flex items-center justify-center gap-1.5 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>اعمال نسخه جدید و بارگذاری مجدد (به‌روزرسانی آنی)</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
          <span className="text-[11px] text-slate-500">
            نسخه فعلی: <strong className="text-slate-400 font-mono">{appVersion}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition-colors"
          >
            بستن
          </button>
        </div>

      </div>
    </div>
  );
}
