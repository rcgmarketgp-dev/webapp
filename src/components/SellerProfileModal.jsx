import React, { useState } from 'react';
import { 
  X, 
  Save, 
  UserCheck, 
  Phone, 
  Send, 
  MapPin, 
  Sparkles, 
  Building, 
  Check, 
  Info 
} from 'lucide-react';

export default function SellerProfileModal({ 
  profile, 
  onClose, 
  onSave 
}) {
  const [businessName, setBusinessName] = useState(profile.businessName || '');
  const [phone1, setPhone1] = useState(profile.phone1 || '');
  const [phone2, setPhone2] = useState(profile.phone2 || '');
  const [whatsappNumber, setWhatsappNumber] = useState(profile.whatsappNumber || '');
  const [telegramId, setTelegramId] = useState(profile.telegramId || '');
  const [eitaaId, setEitaaId] = useState(profile.eitaaId || '');
  const [baleId, setBaleId] = useState(profile.baleId || '');
  const [instagramId, setInstagramId] = useState(profile.instagramId || '');
  const [address, setAddress] = useState(profile.address || '');
  const [footerNote, setFooterNote] = useState(profile.footerNote || '');

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const updated = {
      businessName: businessName.trim(),
      phone1: phone1.trim(),
      phone2: phone2.trim(),
      whatsappNumber: whatsappNumber.trim(),
      telegramId: telegramId.trim(),
      eitaaId: eitaaId.trim(),
      baleId: baleId.trim(),
      instagramId: instagramId.trim(),
      address: address.trim(),
      footerNote: footerNote.trim()
    };
    onSave(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-400" />
            <h3 className="text-base sm:text-lg font-bold text-white">پروفایل و اطلاعات تماس فروشنده</h3>
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
          
          <div className="bg-blue-950/40 border border-blue-800/40 rounded-2xl p-3.5 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-blue-200 leading-relaxed text-[11px]">
              این اطلاعات برای دفعات بعد ذخیره شده و به طور خودکار به انتهای تمامی کپشن‌های تولید شده برای پیام‌رسان‌ها متصل می‌گردد.
            </p>
          </div>

          {/* Business & Phones */}
          <div className="bg-slate-850 border border-slate-750 rounded-2xl p-4 space-y-3">
            <h4 className="font-bold text-slate-300 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-blue-400" />
              <span>مشخصات بازرگانی و تلفن‌ها</span>
            </h4>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">نام مجموعه / فروشگاه / شرکت</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="مثال: بازرگانی ماشین‌آلات صنعتی نوین"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">شماره همراه ۱ (مشاوره و فروش)</label>
                <input
                  type="text"
                  value={phone1}
                  onChange={(e) => setPhone1(e.target.value)}
                  placeholder="0912xxxxxxx"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">شماره تماس ۲ / تلفن دفتر</label>
                <input
                  type="text"
                  value={phone2}
                  onChange={(e) => setPhone2(e.target.value)}
                  placeholder="021xxxxxxxx"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">آدرس نمایشگاه / انبار / محل بازدید دستگاه</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="مثال: تهران، جاده مخصوص کرج، روبروی شهرک صنعتی..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Messengers Links & IDs */}
          <div className="bg-slate-850 border border-slate-750 rounded-2xl p-4 space-y-3">
            <h4 className="font-bold text-slate-300 flex items-center gap-1.5">
              <Send className="w-4 h-4 text-amber-400" />
              <span>ارتباط و کانال در پیام‌رسان‌ها</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">آیدی / کانال پیام‌رسان بله</label>
                <input
                  type="text"
                  value={baleId}
                  onChange={(e) => setBaleId(e.target.value)}
                  placeholder="@Channel_Bale"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">آیدی / کانال پیام‌رسان ایتا</label>
                <input
                  type="text"
                  value={eitaaId}
                  onChange={(e) => setEitaaId(e.target.value)}
                  placeholder="@Channel_Eitaa"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">آیدی / کانال در تلگرام</label>
                <input
                  type="text"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                  placeholder="@Channel_Telegram"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">شماره یا لینک واتساپ</label>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="0912xxxxxxx"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">پیج اینستاگرام (اختیاری)</label>
              <input
                type="text"
                value={instagramId}
                onChange={(e) => setInstagramId(e.target.value)}
                placeholder="my_machinery_page"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Custom Footer Slogan */}
          <div className="bg-slate-850 border border-slate-750 rounded-2xl p-4 space-y-2">
            <label className="block font-bold text-slate-300">متن دلخواه انتهای کپشن‌ها (یادداشت اختصاصی)</label>
            <textarea
              value={footerNote}
              onChange={(e) => setFooterNote(e.target.value)}
              rows={2}
              placeholder="مثال: امکان تست سلامت فنی حضوری با هماهنگی قبلی | ارسال و راه‌اندازی در سراسر کشور"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
            />
          </div>

          {/* Footer Preview Box */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-1.5 text-[11px] text-slate-300">
            <span className="font-bold text-amber-400 block mb-1">پیش‌نمایش بخش پایانی کپشن:</span>
            {businessName && <div className="font-bold">🏢 {businessName}</div>}
            <div>📞 جهت مشاوره، استعلام قیمت و خرید:</div>
            {phone1 && <div>📲 تماس: {phone1}</div>}
            {phone2 && <div>☎️ دفتر: {phone2}</div>}
            {baleId && <div>🔸 بله: {baleId}</div>}
            {eitaaId && <div>🔸 ایتا: {eitaaId}</div>}
            {telegramId && <div>🔸 تلگرام: {telegramId}</div>}
            {whatsappNumber && <div>🔸 واتساپ: {whatsappNumber}</div>}
            {address && <div>📍 آدرس: {address}</div>}
            {footerNote && <div className="text-slate-400 mt-1">✨ {footerNote}</div>}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-900/30 transition-all text-sm"
            >
              {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? 'اطلاعات ذخیره شد ✓' : 'ذخیره پروفایل برای همه موارد'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
