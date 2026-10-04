import React, { useState } from 'react';
import { 
  X, 
  Archive, 
  CheckCircle2, 
  Coins, 
  Calendar, 
  User, 
  FileText, 
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { getCategoryById } from '../data/categories';

export default function SellArchiveModal({
  isOpen,
  onClose,
  device,
  onConfirmSold,
  showToast
}) {
  if (!isOpen || !device) return null;

  const category = getCategoryById(device.category);
  const now = new Date();
  const defaultDateStr = now.toLocaleDateString('fa-IR');

  const [soldPrice, setSoldPrice] = useState(device.totalPrice || '');
  const [buyerName, setBuyerName] = useState(device.buyerName || '');
  const [soldDate, setSoldDate] = useState(device.soldDate || defaultDateStr);
  const [soldNote, setSoldNote] = useState(device.soldNote || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!soldPrice.trim()) {
      showToast('لطفاً قیمت نهایی فروش را وارد فرمایید.');
      return;
    }

    const updatedDevice = {
      ...device,
      status: 'SOLD',
      soldPrice: soldPrice.trim(),
      buyerName: buyerName.trim(),
      soldDate: soldDate.trim(),
      soldNote: soldNote.trim(),
      archivedAt: Date.now()
    };

    onConfirmSold(updatedDevice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl shadow-purple-950/50 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 text-lg">
              🏷️
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>ثبت فروش و انتقال به بایگانی</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
                  بایگانی سوابق
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                دستگاه از لیست فعال خارج شده و در بخش بایگانی با دسته‌بندی مشخص ذخیره می‌شود
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1 text-xs">
          
          {/* Device Summary Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm truncate max-w-xs">{device.name}</span>
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-850">
              <span>مدل: <strong className="text-slate-200">{device.model || '-'}</strong></span>
              <span>سال ساخت: <strong className="text-slate-200">{device.year || '-'}</strong></span>
              <span>قیمت اولیه: <strong className="text-emerald-400">{device.totalPrice || 'توافقی'}</strong></span>
            </div>
          </div>

          {/* Sold Price (قیمت فروش در بایگانی) */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-bold flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>قیمت قطعی فروش / قیمت ذخیره در بایگانی (تومان): *</span>
            </label>
            <input
              type="text"
              required
              value={soldPrice}
              onChange={(e) => setSoldPrice(e.target.value)}
              placeholder="مثال: ۸۵۰,۰۰۰,۰۰۰ تومان"
              className="w-full bg-slate-800 border border-slate-750 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm focus:outline-none transition-all placeholder-slate-500"
            />
            <p className="text-[10px] text-slate-400">
              این قیمت در سوابق مالی و گزارشات فروش بر اساس نوع دستگاه ثبت می‌شود.
            </p>
          </div>

          {/* Buyer Name & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-semibold flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>نام خریدار / نام کارگاه (اختیاری):</span>
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="مثال: کارگاه برادران رضایی"
                className="w-full bg-slate-800 border border-slate-750 focus:border-purple-500 rounded-xl px-3 py-2 text-white text-xs focus:outline-none transition-all placeholder-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>تاریخ فروش / بایگانی:</span>
              </label>
              <input
                type="text"
                value={soldDate}
                onChange={(e) => setSoldDate(e.target.value)}
                placeholder="مثال: ۱۴۰۳/۰۷/۱۰"
                className="w-full bg-slate-800 border border-slate-750 focus:border-purple-500 rounded-xl px-3 py-2 text-white text-xs focus:outline-none transition-all placeholder-slate-500 font-mono"
              />
            </div>
          </div>

          {/* Sold Note */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-semibold flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>یادداشت یا نحوه تسویه (اختیاری):</span>
            </label>
            <textarea
              rows={2}
              value={soldNote}
              onChange={(e) => setSoldNote(e.target.value)}
              placeholder="مثال: ۵۰ درصد نقد تسویه شد، مابقی طی ۲ فقره چک صیادی بنفش..."
              className="w-full bg-slate-800 border border-slate-750 focus:border-purple-500 rounded-xl p-2.5 text-white text-xs focus:outline-none transition-all placeholder-slate-500"
            />
          </div>

          {/* Info notice */}
          <div className="bg-purple-950/30 border border-purple-800/40 rounded-2xl p-3 text-[11px] text-purple-200 leading-relaxed space-y-1">
            <span className="font-bold flex items-center gap-1 text-purple-300">
              <Archive className="w-3.5 h-3.5" />
              <span>نتیجه انتقال به بایگانی:</span>
            </span>
            <p>
              این دستگاه دیگر در لیست اصلی فروش نمایش داده نخواهد شد تا کاتالوگ فروش خلوت و آماده باشد. هر زمان در تب <strong>«بایگانی و فروخته‌شده‌ها»</strong> می‌توانید سوابق آن را مشاهده یا با یک کلیک مجدداً به لیست اصلی بازگردانید.
            </p>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-900/30 transition-all"
            >
              <Archive className="w-4 h-4" />
              <span>تأیید فروش و انتقال به بایگانی</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
