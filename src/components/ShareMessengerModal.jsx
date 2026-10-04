import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  Send, 
  MessageSquare, 
  ExternalLink,
  Images,
  Info
} from 'lucide-react';

export default function ShareMessengerModal({ device, caption, onClose, onCopySuccess }) {
  const [copied, setCopied] = useState(false);
  const images = device?.images || [];

  const handleCopy = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    if (onCopySuccess) onCopySuccess();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `فروش ${device.name}`,
          text: caption
        });
      } catch (e) {
        console.log('Share dismissed', e);
      }
    } else {
      handleCopy();
    }
  };

  // Direct messenger share links
  const shareToWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(caption)}`;
    window.open(url, '_blank');
  };

  const shareToTelegram = () => {
    const url = `https://t.me/share/url?url=&text=${encodeURIComponent(caption)}`;
    window.open(url, '_blank');
  };

  const shareToEitaa = () => {
    const url = `https://eitaa.com/share/url?text=${encodeURIComponent(caption)}`;
    window.open(url, '_blank');
  };

  const shareToBale = () => {
    // Bale web share endpoint
    const url = `https://ble.ir/share/url?text=${encodeURIComponent(caption)}`;
    window.open(url, '_blank');
  };

  const shareToRubika = () => {
    const url = `https://rubika.ir/`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-blue-400" />
              <span>ارسال به کانال و گروه‌های پیام‌رسان</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {device?.name} ({images.length} تصویر پیوست)
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tip Box */}
        <div className="mt-4 bg-blue-950/40 border border-blue-800/40 rounded-2xl p-3.5 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-200 leading-relaxed">
            کپشن آماده شامل تمام مشخصات، قیمت، جدول اقساط و اطلاعات تماس فروشنده می‌باشد. می‌توانید مستقیماً به پیام‌رسان دلخواه منتقل شوید یا متن را کپی کنید.
          </p>
        </div>

        {/* Attached Photos Carousel Preview */}
        {images.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1 font-semibold text-slate-300">
                <Images className="w-3.5 h-3.5 text-amber-400" />
                تصاویر همراه کپشن ({images.length} عکس):
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <div key={i} className="w-20 h-20 rounded-xl overflow-hidden border border-slate-750 flex-shrink-0 bg-slate-950">
                  <img src={img} alt={`تصویر ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messengers Buttons Grid */}
        <div className="mt-5">
          <p className="text-xs font-bold text-slate-300 mb-3">انتخاب پیام‌رسان جهت ارسال مستقیم:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            
            {/* Bale */}
            <button
              onClick={shareToBale}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-teal-950/40 hover:bg-teal-900/40 border border-teal-700/40 text-teal-300 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-teal-600/20 flex items-center justify-center text-lg mb-1.5 group-hover:scale-110 transition-transform">
                🌿
              </div>
              <span className="text-xs font-bold">پیام‌رسان بله</span>
            </button>

            {/* Eitaa */}
            <button
              onClick={shareToEitaa}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-orange-950/40 hover:bg-orange-900/40 border border-orange-700/40 text-orange-300 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-orange-600/20 flex items-center justify-center text-lg mb-1.5 group-hover:scale-110 transition-transform">
                🟠
              </div>
              <span className="text-xs font-bold">پیام‌رسان ایتا</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={shareToWhatsApp}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-700/40 text-emerald-300 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center text-lg mb-1.5 group-hover:scale-110 transition-transform">
                💬
              </div>
              <span className="text-xs font-bold">واتساپ</span>
            </button>

            {/* Telegram */}
            <button
              onClick={shareToTelegram}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-sky-950/40 hover:bg-sky-900/40 border border-sky-700/40 text-sky-300 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-sky-600/20 flex items-center justify-center text-lg mb-1.5 group-hover:scale-110 transition-transform">
                ✈️
              </div>
              <span className="text-xs font-bold">تلگرام</span>
            </button>

          </div>
        </div>

        {/* Caption Preview Box */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>متن کپشن آماده:</span>
            <button 
              onClick={handleCopy}
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'کپی شد!' : 'کپی متن'}</span>
            </button>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-36 overflow-y-auto text-xs text-slate-300 whitespace-pre-wrap leading-relaxed select-all">
            {caption}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-5 flex gap-2.5">
          <button
            onClick={handleNativeShare}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-900/30 transition-all text-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>اشتراک‌گذاری در همه برنامه‌ها</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 px-4 rounded-xl border border-slate-700 transition-all text-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'کپی شد' : 'کپی کپشن'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
