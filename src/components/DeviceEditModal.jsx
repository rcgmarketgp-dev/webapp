import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Camera, 
  Plus, 
  Trash2, 
  Coins, 
  Sparkles, 
  AlertTriangle,
  Info
} from 'lucide-react';
import { calculatePayment, generateCaption } from '../utils/captionGenerator';
import { WOOD_CATEGORIES } from '../data/categories';

export default function DeviceEditModal({ 
  device, 
  profile, 
  onClose, 
  onSave 
}) {
  const isNew = !device;
  const isCompleting = device?.isIncomplete;

  const [category, setCategory] = useState(device?.category || 'saw');
  const [name, setName] = useState(device?.name || '');
  const [model, setModel] = useState(device?.model || '');
  const [year, setYear] = useState(device?.year || '');
  const [totalPrice, setTotalPrice] = useState(device?.totalPrice || '');
  const [cashPercentage, setCashPercentage] = useState(device?.cashPercentage?.toString() || '40');
  const [installmentMonths, setInstallmentMonths] = useState(device?.installmentMonths?.toString() || '10');
  const [installmentNote, setInstallmentNote] = useState(device?.installmentNote || 'اقساط با چک صیادی بنفش بدون کارمزد');
  const [warranty, setWarranty] = useState(device?.warranty || '');
  const [specifications, setSpecifications] = useState(device?.specifications || '');
  const [condition, setCondition] = useState(device?.condition || 'در حد نو');
  const [location, setLocation] = useState(device?.location || 'تهران');
  const [status, setStatus] = useState(device?.status || 'ACTIVE');
  const [captionStyle, setCaptionStyle] = useState(device?.captionStyle || 'ATTRACTIVE');
  const [images, setImages] = useState(device?.images || []);

  const [errorMsg, setErrorMsg] = useState('');

  // Live calculation
  const cashNum = parseInt(cashPercentage, 10) || 0;
  const monthsNum = parseInt(installmentMonths, 10) || 0;
  const payment = calculatePayment(totalPrice, cashNum, monthsNum);

  // Live caption preview
  const livePreview = generateCaption(
    {
      name: name || 'نام دستگاه',
      model,
      year,
      totalPrice,
      cashPercentage: cashNum,
      installmentMonths: monthsNum,
      installmentNote,
      warranty,
      specifications,
      condition,
      location,
      captionStyle
    },
    profile,
    captionStyle
  );

  const handleAddPhotos = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const readers = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(newImages => {
      setImages(prev => [...prev, ...newImages]);
    });
  };

  const handleRemovePhoto = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('لطفاً نام دستگاه را وارد کنید.');
      return;
    }

    const isIncomplete = !name.trim() ||
      !model.trim() ||
      !year.trim() ||
      !totalPrice.trim() ||
      (cashNum === 0 && monthsNum === 0) ||
      !warranty.trim() ||
      !specifications.trim() ||
      images.length === 0;

    const updatedDevice = {
      id: device?.id || `device_${Date.now()}`,
      source: device?.source || 'MANUAL',
      category,
      name: name.trim(),
      model: model.trim(),
      year: year.trim(),
      totalPrice: totalPrice.trim(),
      cashPercentage: cashNum,
      installmentMonths: monthsNum,
      installmentNote: installmentNote.trim(),
      warranty: warranty.trim(),
      specifications: specifications.trim(),
      condition: condition.trim(),
      location: location.trim(),
      status,
      captionStyle,
      images,
      customCaption: device?.customCaption || '',
      isIncomplete,
      createdAt: device?.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    onSave(updatedDevice);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{isNew ? 'ثبت دستی دستگاه جدید' : isCompleting ? 'تکمیل اطلاعات دستگاه ناقص' : 'ویرایش مشخصات دستگاه'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isCompleting ? 'اطلاعات باقیمانده را وارد کنید تا کپشن و فایل به حالت کامل درآید.' : 'مشخصات دستگاه، شرایط اقساط و عکس‌ها را وارد کنید.'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1 text-xs">
          
          {errorMsg && (
            <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 p-3 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isCompleting && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-3 rounded-xl flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>این دستگاه از اکسل وارد شده و برای ثبت نهایی نیازمند تکمیل قیمت، اقساط، گارانتی یا عکس می‌باشد.</span>
            </div>
          )}

          {/* Photo Upload Section */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-amber-400" />
                تصاویر دستگاه ({images.length} تصویر)
              </span>
              <label className="cursor-pointer inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md">
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن عکس</span>
                <input type="file" accept="image/*" multiple onChange={handleAddPhotos} className="hidden" />
              </label>
            </div>

            {images.length > 0 ? (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-750 flex-shrink-0 group">
                    <img src={img} alt="تصویر" className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute bottom-0 inset-x-0 bg-amber-500 text-slate-950 font-bold text-[9px] text-center">
                        اصلی
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 left-1 bg-rose-600/90 hover:bg-rose-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-3 border border-dashed border-slate-800 rounded-xl">
                هیچ عکسی افزوده نشده است. برای نمایش جذاب‌تر در کانال‌ها یک یا چند عکس اضافه کنید.
              </p>
            )}
          </div>

          {/* Device Basic Info Card */}
          <div className="bg-slate-850 border border-slate-750 rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-300">مشخصات پایه دستگاه</h4>
              <span className="text-[11px] text-amber-400 font-bold">دسته‌بندی پرکاربرد صنعت چوب و ماشین‌ابزار</span>
            </div>

            {/* انتخاب سریع دسته‌بندی */}
            <div>
              <label className="block text-slate-400 mb-1.5 font-semibold">دسته‌بندی دستگاه (جهت فیلتر و تکمیل مشخصات):</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {WOOD_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-2 rounded-xl text-right text-xs transition-all flex items-center gap-1.5 border ${
                      category === cat.id
                        ? 'bg-blue-600/30 border-blue-500 text-white font-bold ring-1 ring-blue-500'
                        : 'bg-slate-900/60 border-slate-750 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span className="truncate text-[11px]">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">نام دستگاه (الزامی) *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrorMsg(''); }}
                placeholder="مثال: دستگاه تراش CNC سه محور"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">مدل / تیپ / سیستم کنترل</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="مثال: CK6140 / زیمنس 808D"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">سال ساخت</label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="مثال: ۱۴۰۲ یا 2023"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">وضعیت کارکرد دستگاه</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="صفر / آکبند">صفر / آکبند</option>
                  <option value="در حد نو">در حد نو</option>
                  <option value="کارکرده تمیز">کارکرده تمیز</option>
                  <option value="اورهال شده">اورهال شده</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">شهر و محل بازدید دستگاه</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="مثال: تهران، شمس‌آباد"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Installments Card */}
          <div className="bg-slate-850 border border-slate-750 rounded-2xl p-4 space-y-3.5">
            <h4 className="font-bold text-slate-300 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>قیمت و شرایط پرداخت نقدی و اقساط</span>
            </h4>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">مبلغ کل دستگاه</label>
              <input
                type="text"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                placeholder="مثال: 850,000,000 تومان یا توافقی"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">درصد پیش‌پرداخت نقدی (٪)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={cashPercentage}
                  onChange={(e) => setCashPercentage(e.target.value)}
                  placeholder="مثلاً 40"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">تعداد اقساط ماهیانه</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={installmentMonths}
                  onChange={(e) => setInstallmentMonths(e.target.value)}
                  placeholder="مثلاً 10"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Calculated Pill */}
            {payment.hasCalculated && (
              <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-3 text-emerald-300">
                <span className="font-bold block mb-1">محاسبه خودکار اقساط در کپشن:</span>
                <p>پیش‌پرداخت: {payment.formattedDownPayment} | هر قسط: {payment.formattedMonthly} (طی {installmentMonths} ماه)</p>
              </div>
            )}

            <div>
              <label className="block text-slate-400 mb-1">شرایط چک و توضیحات تسویه</label>
              <input
                type="text"
                value={installmentNote}
                onChange={(e) => setInstallmentNote(e.target.value)}
                placeholder="مثال: اقساط ماهیانه با چک صیادی بنفش بدون کارمزد"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Warranty & Specs Card */}
          <div className="bg-slate-850 border border-slate-750 rounded-2xl p-4 space-y-3.5">
            <h4 className="font-bold text-slate-300">گارانتی و مشخصات فنی</h4>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">میزان گارانتی و خدمات پس از فروش</label>
              <input
                type="text"
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                placeholder="مثال: ۱۲ ماه گارانتی قطعات و ۱۰ سال پشتیبانی فنی"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">مشخصات فنی و جزییات دستگاه</label>
              <textarea
                value={specifications}
                onChange={(e) => setSpecifications(e.target.value)}
                rows={4}
                placeholder="ابعاد کارگیر، قدرت موتور، سیستم کنترلر، ابزارها و تجهیزات جانبی..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Status & Storage Section */}
          <div className="bg-slate-850 border border-slate-750 rounded-2xl p-4 space-y-3">
            <label className="font-bold text-slate-300 block">وضعیت نگهداری در برنامه:</label>
            <div className="flex gap-2">
              {[
                { id: 'ACTIVE', label: 'فعال برای فروش' },
                { id: 'SOLD', label: 'فروخته شد' },
                { id: 'ARCHIVED', label: 'بایگانی' }
              ].map(st => (
                <button
                  type="button"
                  key={st.id}
                  onClick={() => setStatus(st.id)}
                  className={`flex-1 py-2 rounded-xl font-bold border transition-all ${
                    status === st.id
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Accordion */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <span className="font-bold text-slate-400 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>پیش‌نمایش خودکار کپشن این دستگاه:</span>
            </span>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-slate-300 text-[11px] whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
              {livePreview}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-900/30 transition-all text-sm"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره نهایی اطلاعات دستگاه</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
