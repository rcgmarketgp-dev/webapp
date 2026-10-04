import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  Coins, 
  Camera, 
  Plus, 
  Sparkles, 
  RefreshCw,
  Star,
  CheckCircle2,
  Archive,
  AlertTriangle
} from 'lucide-react';
import { calculatePayment, generateCaption } from '../utils/captionGenerator';
import { getDeviceFolderName, readImagesFromDeviceFolder, saveMultipleImagesToDeviceFolder } from '../services/driveSyncService';

export default function DeviceDetailModal({ 
  device, 
  profile, 
  onClose, 
  onEdit, 
  onDelete, 
  onUpdateDevice,
  onOpenShare,
  connectedDirectory
}) {
  const [activeStyle, setActiveStyle] = useState(device.captionStyle || 'ATTRACTIVE');
  const [customCaption, setCustomCaption] = useState(
    device.customCaption || generateCaption(device, profile, device.captionStyle || 'ATTRACTIVE')
  );
  const [copied, setCopied] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isSyncingFolder, setIsSyncingFolder] = useState(false);
  const [folderMsg, setFolderMsg] = useState('');

  const deviceFolderName = getDeviceFolderName(device);

  const handleSyncFromDriveFolder = async () => {
    if (!connectedDirectory?.handle) return;
    setIsSyncingFolder(true);
    setFolderMsg('');

    try {
      const folderImages = await readImagesFromDeviceFolder(connectedDirectory.handle, device);
      if (folderImages.length > 0) {
        onUpdateDevice({ ...device, images: folderImages });
        setFolderMsg(`تعداد ${folderImages.length} عکس از پوشه درایو با موفقیت بارگذاری شد ✓`);
      } else {
        setFolderMsg(`هنوز فایلی در پوشه «${deviceFolderName}» قرار داده نشده است.`);
      }
    } catch (err) {
      setFolderMsg('خطا در خواندن پوشه: ' + err.message);
    } finally {
      setIsSyncingFolder(false);
    }
  };

  const payment = calculatePayment(device.totalPrice, device.cashPercentage, device.installmentMonths);
  const images = device.images || [];

  const handleStyleChange = (style) => {
    setActiveStyle(style);
    const newCap = generateCaption(device, profile, style);
    setCustomCaption(newCap);
    onUpdateDevice({ ...device, captionStyle: style, customCaption: '' });
  };

  const handleResetCaption = () => {
    const defaultCap = generateCaption(device, profile, activeStyle);
    setCustomCaption(defaultCap);
    onUpdateDevice({ ...device, customCaption: '' });
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(customCaption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddPhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const readers = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.readAsDataURL(file);
      });
    });

    const newImages = await Promise.all(readers);
    const updatedImages = [...images, ...newImages];
    onUpdateDevice({ ...device, images: updatedImages });

    // ذخیره مستقیم فایل‌های آپلود شده در پوشه دستگاه در درایو
    if (connectedDirectory?.handle) {
      try {
        const savedCount = await saveMultipleImagesToDeviceFolder(connectedDirectory.handle, device, files);
        if (savedCount > 0) {
          setFolderMsg(`${savedCount} عکس جدید مستقیماً در پوشه درایو «${deviceFolderName}» ذخیره شد 📁`);
        }
      } catch (err) {
        console.warn('Could not save photo to drive folder:', err);
      }
    }
  };

  const handleRemovePhoto = (indexToRemove) => {
    const updatedImages = images.filter((_, idx) => idx !== indexToRemove);
    onUpdateDevice({ ...device, images: updatedImages });
    if (selectedPhotoIndex >= updatedImages.length) {
      setSelectedPhotoIndex(Math.max(0, updatedImages.length - 1));
    }
  };

  const handleSetCoverPhoto = (idx) => {
    const list = [...images];
    const [selected] = list.splice(idx, 1);
    list.unshift(selected);
    onUpdateDevice({ ...device, images: list });
    setSelectedPhotoIndex(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base sm:text-lg font-bold text-white truncate max-w-xs sm:max-w-md">
              {device.name}
            </h3>
            {device.isIncomplete && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <AlertTriangle className="w-3 h-3" />
                اطلاعات ناقص
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEdit(device)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="ویرایش مشخصات"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(device)}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="حذف دستگاه"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
          
          {/* Photos Manager Section */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-amber-400" />
                تصاویر دستگاه ({images.length} تصویر)
              </span>
              <label className="cursor-pointer inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-900/30">
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن عکس</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleAddPhotos} 
                  className="hidden" 
                />
              </label>
            </div>

            {images.length > 0 ? (
              <div className="space-y-3">
                {/* Main Large Photo Display */}
                <div className="relative w-full h-56 sm:h-72 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center">
                  <img 
                    src={images[selectedPhotoIndex] || images[0]} 
                    alt="نمایش دستگاه" 
                    className="w-full h-full object-contain"
                  />
                  {selectedPhotoIndex === 0 && (
                    <span className="absolute top-3 right-3 bg-amber-500 text-slate-950 font-black text-[11px] px-2.5 py-1 rounded-lg shadow-lg">
                      تصویر اصلی کاور
                    </span>
                  )}
                  {selectedPhotoIndex !== 0 && (
                    <button
                      onClick={() => handleSetCoverPhoto(selectedPhotoIndex)}
                      className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 backdrop-blur-md text-amber-400 text-xs px-2.5 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1 transition-all"
                    >
                      <Star className="w-3.5 h-3.5" />
                      <span>انتخاب به عنوان تصویر اصلی</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleRemovePhoto(selectedPhotoIndex)}
                    className="absolute top-3 left-3 bg-rose-600/80 hover:bg-rose-600 text-white p-1.5 rounded-lg transition-colors"
                    title="حذف این عکس"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Thumbnails Row */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 cursor-pointer flex-shrink-0 transition-all ${
                        selectedPhotoIndex === idx ? 'border-amber-400 scale-95 shadow-md shadow-amber-500/20' : 'border-slate-800 hover:border-slate-600 opacity-80'
                      }`}
                    >
                      <img src={img} alt="بندانگشتی" className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-amber-500 text-black text-[9px] font-bold text-center">
                          اصلی
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-slate-750 rounded-2xl p-6 text-center bg-slate-900/40">
                <Camera className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">هنوز تصویری برای این دستگاه آپلود نشده است.</p>
                <label className="mt-3 cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  <span>انتخاب عکس از گالری / سیستم</span>
                  <input type="file" accept="image/*" multiple onChange={handleAddPhotos} className="hidden" />
                </label>
              </div>
            )}

            {connectedDirectory && (
              <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-sm">📁</span>
                  <div>
                    <span className="text-slate-300 font-medium">پوشه درایو این دستگاه: </span>
                    <span className="font-mono text-amber-300 font-bold">{deviceFolderName}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSyncFromDriveFolder}
                  disabled={isSyncingFolder}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold transition-all disabled:opacity-50 text-[11px]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFolder ? 'animate-spin' : ''}`} />
                  <span>خواندن عکس‌ها از پوشه درایو</span>
                </button>
              </div>
            )}

            {folderMsg && (
              <p className="mt-1.5 text-[11px] text-emerald-400 bg-emerald-950/30 p-2 rounded-lg border border-emerald-800/30">{folderMsg}</p>
            )}
          </div>

          {/* Machine Specs Card */}
          <div className="bg-slate-850 border border-slate-750 rounded-2xl p-4 sm:p-5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">مشخصات فنی و شرایط فروش</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">نام دستگاه:</span>
                <span className="font-bold text-white">{device.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">مدل / تیپ:</span>
                <span className="font-semibold text-slate-200">{device.model || 'ثبت نشده'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">سال ساخت:</span>
                <span className="font-semibold text-amber-400">{device.year || 'ثبت نشده'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">وضعیت کارکرد:</span>
                <span className="font-semibold text-slate-200">{device.condition || 'کارکرده'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">محل استقرار / بازدید:</span>
                <span className="font-semibold text-emerald-400">{device.location || 'ثبت نشده'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">گارانتی و خدمات:</span>
                <span className="font-bold text-emerald-400">{device.warranty || 'بدون گارانتی'}</span>
              </div>
            </div>

            {device.specifications && (
              <div className="mt-3.5 pt-3 border-t border-slate-800">
                <span className="text-xs text-slate-400 block mb-1.5 font-bold">جزییات و امکانات فنی:</span>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  {device.specifications}
                </p>
              </div>
            )}
          </div>

          {/* Payment & Installment Calculation Table */}
          <div className="bg-slate-850 border border-slate-750 rounded-2xl p-4 sm:p-5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>جدول شرایط مالی و محاسبات اقساط</span>
            </h4>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">💰 قیمت کل دستگاه:</span>
                <span className="font-bold text-emerald-400 text-sm">{device.totalPrice || 'وارد نشده'}</span>
              </div>

              {device.cashPercentage > 0 && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">💵 پیش‌پرداخت نقدی ({device.cashPercentage}٪):</span>
                  <span className="font-bold text-white">
                    {payment.hasCalculated ? payment.formattedDownPayment : `${device.cashPercentage} درصد`}
                  </span>
                </div>
              )}

              {device.installmentMonths > 0 && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">🗓️ تعداد اقساط ماهیانه:</span>
                  <span className="font-bold text-amber-400">
                    {device.installmentMonths} قسط {payment.hasCalculated && `(ماهیانه ${payment.formattedMonthly})`}
                  </span>
                </div>
              )}

              {payment.remaining && (
                <div className="flex items-center justify-between py-1 text-slate-400">
                  <span>مابقی مبلغ تسهیلات:</span>
                  <span>{payment.formattedRemaining}</span>
                </div>
              )}

              {device.installmentNote && (
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                  <span className="text-slate-400 font-bold">توضیحات چک: </span>
                  {device.installmentNote}
                </div>
              )}
            </div>
          </div>

          {/* Caption Studio & Editor */}
          <div className="bg-slate-850 border border-slate-750 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>کپشن آماده فروش برای کانال و گروه‌ها</span>
              </h4>
              <button
                onClick={handleResetCaption}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                title="بازسازی خودکار بر اساس سبک انتخاب شده"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>بازسازی خودکار</span>
              </button>
            </div>

            {/* Style Selector Chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                { id: 'ATTRACTIVE', label: 'جذاب و پربازدید (ایموجی)' },
                { id: 'INDUSTRIAL', label: 'رسمی و صنعتی B2B' },
                { id: 'INSTALLMENT', label: 'طرح ویژه اقساطی' },
                { id: 'COMPACT', label: 'کاتالوگی و کوتاه' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => handleStyleChange(s.id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                    activeStyle === s.id
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Editable Caption Textarea */}
            <textarea
              value={customCaption}
              onChange={(e) => {
                setCustomCaption(e.target.value);
                onUpdateDevice({ ...device, customCaption: e.target.value });
              }}
              rows={8}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-blue-500 font-mono transition-colors"
              placeholder="متن کپشن..."
            />

            <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
              <span>طول متن: {customCaption.length} کاراکتر</span>
              <button
                onClick={handleCopyCaption}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'متن کپی شد ✓' : 'کپی متن کپشن'}</span>
              </button>
            </div>
          </div>

          {/* Quick Status Toggle */}
          <div className="bg-slate-850 border border-slate-750 rounded-2xl p-4">
            <span className="text-xs font-bold text-slate-400 block mb-2.5">تغییر وضعیت در برنامه:</span>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdateDevice({ ...device, status: 'ACTIVE' })}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                  device.status === 'ACTIVE' 
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/20' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                فعال برای فروش
              </button>
              <button
                onClick={() => onUpdateDevice({ ...device, status: 'SOLD' })}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                  device.status === 'SOLD' 
                    ? 'bg-slate-600 text-white border-slate-500' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                فروخته شد
              </button>
              <button
                onClick={() => onUpdateDevice({ ...device, status: 'ARCHIVED' })}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                  device.status === 'ARCHIVED' 
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-900/20' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                بایگانی
              </button>
            </div>
          </div>

        </div>

        {/* Modal Bottom Fixed Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex gap-3">
          <button
            onClick={() => onOpenShare(device, customCaption)}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-900/30 transition-all text-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>ارسال به پیام‌رسان‌ها (بله، ایتا، واتساپ، تلگرام)</span>
          </button>

          <button
            onClick={handleCopyCaption}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-3 px-4 rounded-xl border border-slate-700 transition-all text-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline">{copied ? 'کپی شد' : 'کپی کپشن'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
