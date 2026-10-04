import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  Coins, 
  Share2, 
  Copy, 
  Edit3, 
  Camera, 
  AlertTriangle,
  CheckCircle2,
  Archive,
  Image as ImageIcon,
  Trash2,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  Wrench,
  Clock,
  RotateCcw,
  Tag
} from 'lucide-react';
import { calculatePayment } from '../utils/captionGenerator';
import { getCategoryById } from '../data/categories';

export default function DeviceCard({ 
  device, 
  onCardClick, 
  onShareClick, 
  onCopyCaption, 
  onEditClick,
  onDeleteClick,
  onStatusChange,
  onUpdatePriority,
  onRequestSellArchive,
  onRestoreFromArchive,
  isArchiveView = false,
  isSelected,
  onToggleSelect
}) {
  const payment = calculatePayment(device.totalPrice, device.cashPercentage, device.installmentMonths);
  const images = device.images && device.images.length > 0 ? device.images : [];
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const category = getCategoryById(device.category);
  const isExcel = device.source === 'EXCEL' || (device.id && String(device.id).startsWith('excel'));

  const isReadyForSale = device.status === 'ACTIVE' || device.status === 'READY_FOR_SALE';
  const isOverhaul = device.status === 'UNDER_OVERHAUL';
  const isNotReady = device.status === 'NOT_READY';
  const isSold = device.status === 'SOLD';

  // اسلاید آرام عکس‌ها حین هاور کاربر روی کارت
  useEffect(() => {
    if (!isHovered || images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentImgIdx(prev => (prev + 1) % images.length);
    }, 1800);
    return () => clearInterval(timer);
  }, [isHovered, images.length]);

  const handleNextPhoto = (e) => {
    e.stopPropagation();
    if (images.length > 1) {
      setCurrentImgIdx(prev => (prev + 1) % images.length);
    }
  };

  const handlePrevPhoto = (e) => {
    e.stopPropagation();
    if (images.length > 1) {
      setCurrentImgIdx(prev => (prev - 1 + images.length) % images.length);
    }
  };

  const handleToggleReadySale = (e) => {
    e.stopPropagation();
    if (onStatusChange) {
      onStatusChange(device, isReadyForSale ? 'NOT_READY' : 'ACTIVE');
    }
  };

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowStatusMenu(false); }}
      className={`bg-slate-850 hover:bg-slate-800/90 border ${
        isSelected 
          ? 'border-blue-500 ring-1 ring-blue-500' 
          : isSold 
          ? 'border-purple-800/40 hover:border-purple-600/60'
          : 'border-slate-750 hover:border-slate-600'
      } rounded-2xl p-4 transition-all duration-200 shadow-lg shadow-black/20 flex flex-col justify-between group relative`}
    >
      <div>
        {/* Top Badges & Select */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              checked={!!isSelected}
              onChange={() => onToggleSelect && onToggleSelect(device.id)}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700 cursor-pointer"
              title="انتخاب جهت عملیات گروهی"
            />

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* نشان دسته‌بندی ماشین‌آلات چوب */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                <span>{category.icon}</span>
                <span className="truncate max-w-[110px]">{category.name}</span>
              </span>

              {isExcel && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  <FileSpreadsheet className="w-3 h-3 text-teal-400" />
                  اکسل
                </span>
              )}

              {/* نشان‌های دقیق وضعیت فروش و کارگاه */}
              {isReadyForSale && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  آماده برای فروش
                </span>
              )}

              {isOverhaul && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Wrench className="w-3 h-3 text-amber-400" />
                  در مرحله اورهال
                </span>
              )}

              {isNotReady && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/50 text-slate-300 border border-slate-600">
                  <Clock className="w-3 h-3 text-slate-400" />
                  آماده فروش نیست
                </span>
              )}

              {isSold && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  <Tag className="w-3 h-3 text-purple-400" />
                  فروخته شده (بایگانی)
                </span>
              )}

              {device.isIncomplete && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onEditClick(device); }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 transition-all"
                  title="برای تکمیل اطلاعات کلیک کنید"
                >
                  <AlertTriangle className="w-3 h-3 text-rose-400 animate-pulse" />
                  ناقص
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* اولویت چیدمان در صفحه اول */}
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="flex items-center gap-1 bg-slate-900 border border-amber-500/50 hover:border-amber-400 px-1.5 py-0.5 rounded-lg shadow-sm"
              title="تعیین اولویت چیدمان در صفحه اول (اعداد ۱ به بالا: عدد ۱ در صدر صفحه قرار می‌گیرد)"
            >
              <span className="text-[10px] text-amber-300 font-bold flex items-center gap-0.5">
                <span>⭐</span>
                <span className="text-[10px] hidden sm:inline">اولویت:</span>
              </span>
              <input 
                type="number"
                min="1"
                step="1"
                value={device.priority ?? ''}
                onChange={(e) => {
                  e.stopPropagation();
                  onUpdatePriority && onUpdatePriority(device.id, e.target.value);
                }}
                placeholder="-"
                className="w-9 text-center bg-slate-950 border border-amber-500/40 rounded text-[11px] font-black text-amber-300 focus:outline-none focus:border-amber-400 py-0.5"
                title="تغییر رتبه اولویت (عدد ۱ در صدر لیست)"
              />
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); onDeleteClick && onDeleteClick(device); }}
              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="حذف این دستگاه"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Status Quick Controller Bar */}
        <div className="mb-3 p-2 rounded-xl bg-slate-900/90 border border-slate-750 flex items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleReadySale}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all border ${
                isReadyForSale
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-900/40'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
              }`}
              title={isReadyForSale ? 'برای غیرفعال کردن کلیک کنید' : 'کلیک برای فعال کردن جهت فروش'}
            >
              <span className={`w-2 h-2 rounded-full ${isReadyForSale ? 'bg-white' : 'bg-slate-500'}`}></span>
              <span>{isReadyForSale ? 'فعال برای فروش (روشن)' : 'خاموش (غیرآماده)'}</span>
            </button>

            {/* Quick status cycle button */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowStatusMenu(!showStatusMenu); }}
                className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 font-medium transition-colors"
              >
                تغییر وضعیت ▾
              </button>

              {showStatusMenu && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-30 space-y-0.5 text-xs animate-fadeIn"
                >
                  <button
                    onClick={() => { onStatusChange(device, 'ACTIVE'); setShowStatusMenu(false); }}
                    className="w-full text-right px-2.5 py-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-1.5 text-[11px]"
                  >
                    <span>🟢</span>
                    <span>آماده برای فروش</span>
                  </button>
                  <button
                    onClick={() => { onStatusChange(device, 'UNDER_OVERHAUL'); setShowStatusMenu(false); }}
                    className="w-full text-right px-2.5 py-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 flex items-center gap-1.5 text-[11px]"
                  >
                    <span>⚙️</span>
                    <span>در مرحله اورهال</span>
                  </button>
                  <button
                    onClick={() => { onStatusChange(device, 'NOT_READY'); setShowStatusMenu(false); }}
                    className="w-full text-right px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 flex items-center gap-1.5 text-[11px]"
                  >
                    <span>⏸️</span>
                    <span>آماده فروش نیست</span>
                  </button>
                  <div className="border-t border-slate-800 my-1"></div>
                  <button
                    onClick={() => { onRequestSellArchive && onRequestSellArchive(device); setShowStatusMenu(false); }}
                    className="w-full text-right px-2.5 py-1.5 rounded-lg text-purple-300 hover:bg-purple-500/15 flex items-center gap-1.5 text-[11px] font-bold"
                  >
                    <span>🏷️</span>
                    <span>ثبت فروش و بایگانی...</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {!isSold ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRequestSellArchive && onRequestSellArchive(device); }}
              className="text-[10px] font-bold px-2 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition-all flex items-center gap-1"
              title="ثبت فروش و انتقال خودکار به بخش بایگانی"
            >
              <Archive className="w-3 h-3 text-purple-400" />
              <span>فروخته شد</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRestoreFromArchive && onRestoreFromArchive(device); }}
              className="text-[10px] font-bold px-2 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-all flex items-center gap-1"
              title="بازگردانی به لیست اصلی دستگاه‌های فعال"
            >
              <RotateCcw className="w-3 h-3 text-blue-400" />
              <span>بازگردانی به لیست</span>
            </button>
          )}
        </div>

        {/* Content Row: Image with Animated Carousel + Details */}
        <div className="flex gap-3.5 cursor-pointer" onClick={() => onCardClick(device)}>
          
          {/* Animated Thumbnail Carousel */}
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-slate-900 border border-slate-750 overflow-hidden flex-shrink-0 relative group-hover:border-blue-500/50 transition-colors shadow-inner">
            {images.length > 0 ? (
              <div className="w-full h-full relative overflow-hidden">
                <img 
                  key={currentImgIdx}
                  src={images[currentImgIdx]} 
                  alt={device.name}
                  className="w-full h-full object-cover transition-all duration-500 ease-out transform group-hover:scale-105"
                />

                {/* افکت نوری و فلش‌های ناوبری در صورت وجود چند عکس */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevPhoto}
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      title="عکس قبلی"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleNextPhoto}
                      className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      title="عکس بعدی"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {/* نشانگرهای نقطه‌ای عکس‌ها */}
                    <div className="absolute bottom-1.5 inset-x-0 flex items-center justify-center gap-1 z-10">
                      {images.map((_, dotIdx) => (
                        <span 
                          key={dotIdx}
                          className={`h-1.5 rounded-full transition-all ${
                            dotIdx === currentImgIdx 
                              ? 'w-4 bg-amber-400 shadow-sm shadow-amber-500/50' 
                              : 'w-1.5 bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* بج تعداد عکس‌ها با انیمیشن */}
                <span className="absolute top-1.5 left-1.5 bg-black/75 backdrop-blur-sm text-[9px] font-bold px-1.5 py-0.5 rounded-md text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                  <Camera className="w-2.5 h-2.5" />
                  <span>{images.length}</span>
                </span>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 p-2 text-center">
                <ImageIcon className="w-6 h-6 mb-1 opacity-40" />
                <span className="text-[10px] text-slate-500">بدون عکس</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-blue-400 transition-colors leading-snug">
              {device.name}
            </h3>

            {device.model && (
              <p className="text-xs text-slate-300 font-mono truncate mt-0.5">
                مدل: {device.model}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-400">
              {device.year && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>ساخت: {device.year}</span>
                </div>
              )}

              {device.warranty && (
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-500/80" />
                  <span className="truncate max-w-[130px]">{device.warranty}</span>
                </div>
              )}
            </div>

            {device.location && (
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                <MapPin className="w-3 h-3 text-emerald-500/80" />
                <span className="truncate">{device.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Pricing & Installments Pill */}
        <div className="mt-3 bg-slate-900/80 border border-slate-750 rounded-xl p-2.5 text-xs">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-slate-400 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              قیمت کل:
            </span>
            <span className="font-bold text-emerald-400">
              {device.totalPrice ? device.totalPrice : (
                <span className="text-rose-400 font-normal">قیمت وارد نشده</span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800 text-[11px]">
            <span className="text-slate-400">شرایط پرداخت:</span>
            <span className="font-medium text-slate-200 truncate">
              {device.cashPercentage > 0 && device.installmentMonths > 0 ? (
                <span className="text-amber-300">
                  {device.cashPercentage}٪ نقد + {device.installmentMonths} قسط
                </span>
              ) : device.cashPercentage > 0 ? (
                `${device.cashPercentage}٪ نقدی`
              ) : device.installmentMonths > 0 ? (
                `${device.installmentMonths} قسط ماهیانه`
              ) : (
                <span className="text-slate-500">شرایط وارد نشده</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
        <button
          onClick={() => onShareClick(device)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-3 rounded-xl transition-all shadow-md shadow-blue-900/20"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>ارسال و کپشن</span>
        </button>

        <button
          onClick={() => onCopyCaption(device)}
          className="flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium py-2 px-3 rounded-xl border border-slate-700 transition-all"
          title="کپی متن کپشن در کلیپ‌بورد"
        >
          <Copy className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">کپی</span>
        </button>

        <button
          onClick={() => onEditClick(device)}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all"
          title="ویرایش یا تکمیل اطلاعات"
        >
          <Edit3 className="w-4 h-4" />
        </button>

        <button
          onClick={() => onDeleteClick && onDeleteClick(device)}
          className="p-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 rounded-xl border border-rose-800/40 transition-all"
          title="حذف این دستگاه"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
