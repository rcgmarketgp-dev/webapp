import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  CheckSquare, 
  Square, 
  Download, 
  Settings, 
  X, 
  Sliders, 
  Sparkles, 
  Check, 
  HelpCircle,
  Eye
} from 'lucide-react';
import * as XLSX from 'xlsx';

const DEFAULT_COLUMNS = [
  { key: 'name', label: 'نام دستگاه', defaultTitle: 'نام دستگاه', required: true, active: true },
  { key: 'model', label: 'مدل و تیپ دستگاه', defaultTitle: 'مدل دستگاه', required: true, active: true },
  { key: 'category', label: 'دسته‌بندی (دورکن/لبه‌چسبان/CNC/...)', defaultTitle: 'دسته بندی', required: false, active: true },
  { key: 'year', label: 'سال ساخت دستگاه', defaultTitle: 'سال ساخت', required: false, active: true },
  { key: 'price', label: 'قیمت کل (تومان)', defaultTitle: 'قیمت کل (تومان)', required: true, active: true },
  { key: 'cash', label: 'درصد پیش‌پرداخت نقدی (%)', defaultTitle: 'درصد نقدی', required: false, active: true },
  { key: 'months', label: 'تعداد اقساط ماهیانه', defaultTitle: 'تعداد اقساط', required: false, active: true },
  { key: 'installmentNote', label: 'شرایط چک و تسویه', defaultTitle: 'شرایط اقساط و چک', required: false, active: true },
  { key: 'warranty', label: 'میزان گارانتی و خدمات', defaultTitle: 'گارانتی', required: false, active: true },
  { key: 'condition', label: 'وضعیت کارکرد (نو/کارکرده)', defaultTitle: 'وضعیت دستگاه', required: false, active: true },
  { key: 'location', label: 'شهر و محل استقرار', defaultTitle: 'محل دستگاه', required: false, active: true },
  { key: 'specs', label: 'مشخصات فنی و ابعاد', defaultTitle: 'مشخصات فنی', required: false, active: true }
];

export default function ExcelCustomizerModal({ isOpen, onClose, showToast }) {
  const [columns, setColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('dastgah_custom_excel_cols');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_COLUMNS;
  });

  if (!isOpen) return null;

  const toggleColumn = (key) => {
    setColumns(prev => prev.map(c => {
      if (c.key === key && !c.required) {
        return { ...c, active: !c.active };
      }
      return c;
    }));
  };

  const handleTitleChange = (key, newTitle) => {
    setColumns(prev => prev.map(c => {
      if (c.key === key) {
        return { ...c, defaultTitle: newTitle };
      }
      return c;
    }));
  };

  const savePreferences = () => {
    try {
      localStorage.setItem('dastgah_custom_excel_cols', JSON.stringify(columns));
      showToast('تنظیمات ستون‌های اکسل ذخیره شد ✓');
    } catch (e) {}
  };

  // دانلود قالب شخصی‌سازی شده به عنوان فایل واقعی اکسل XLSX
  const handleDownloadCustomTemplate = () => {
    savePreferences();

    const activeCols = columns.filter(c => c.active);
    const headers = activeCols.map(c => c.defaultTitle);

    // سطر نمونه برای شرکت آرسی و ماشین‌آلات چوب
    const sampleRow1 = {};
    const sampleRow2 = {};

    activeCols.forEach(c => {
      switch (c.key) {
        case 'name':
          sampleRow1[c.defaultTitle] = 'دستگاه دورکن ۳۲۰۰ واگن واگنی خط‌زن‌دار پایون';
          sampleRow2[c.defaultTitle] = 'دستگاه لبه‌چسبان ۶ ایستگاه صنعتی پایون';
          break;
        case 'model':
          sampleRow1[c.defaultTitle] = 'Payon PS-3200 Pro';
          sampleRow2[c.defaultTitle] = 'Payon EB-600 Heavy Duty';
          break;
        case 'category':
          sampleRow1[c.defaultTitle] = 'دستگاه‌های برش و دورکن';
          sampleRow2[c.defaultTitle] = 'دستگاه‌های لبه‌چسبان';
          break;
        case 'year':
          sampleRow1[c.defaultTitle] = '1402';
          sampleRow2[c.defaultTitle] = '1403';
          break;
        case 'price':
          sampleRow1[c.defaultTitle] = '385000000';
          sampleRow2[c.defaultTitle] = '590000000';
          break;
        case 'cash':
          sampleRow1[c.defaultTitle] = '40';
          sampleRow2[c.defaultTitle] = '35';
          break;
        case 'months':
          sampleRow1[c.defaultTitle] = '10';
          sampleRow2[c.defaultTitle] = '12';
          break;
        case 'installmentNote':
          sampleRow1[c.defaultTitle] = 'اقساط با چک صیادی بنفش بدون بهره';
          sampleRow2[c.defaultTitle] = 'چک صیادی ماه به ماه';
          break;
        case 'warranty':
          sampleRow1[c.defaultTitle] = '12 ماه گارانتی طلایی شرکت آرسی';
          sampleRow2[c.defaultTitle] = '18 ماه گارانتی رسمی پایون';
          break;
        case 'condition':
          sampleRow1[c.defaultTitle] = 'نو (آکبند)';
          sampleRow2[c.defaultTitle] = 'نو (صفر)';
          break;
        case 'location':
          sampleRow1[c.defaultTitle] = 'رشت، بلوار امام رضا';
          sampleRow2[c.defaultTitle] = 'رشت، بلوار امام رضا';
          break;
        case 'specs':
          sampleRow1[c.defaultTitle] = 'طول ریل ۳۲۰۰ واگنی، موتور اصلی ۷.۵ اسب، زاویه‌خور برقی دیجیتال';
          sampleRow2[c.defaultTitle] = 'پیش‌فرز، چسب‌زن تفلونی، سر و ته‌زن، فرز بالا و پایین، کرنر، لیسه و پولیش';
          break;
        default:
          sampleRow1[c.defaultTitle] = '';
          sampleRow2[c.defaultTitle] = '';
      }
    });

    const data = [sampleRow1, sampleRow2];
    const ws = XLSX.utils.json_to_sheet(data, { header: headers });
    
    // تنظیم عرض ستون‌ها
    ws['!cols'] = headers.map(() => ({ wch: 24 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'قالب دستگاه‌ها');
    XLSX.writeFile(wb, 'قالب_سفارشی_اکسل_ماشین_آلات.xlsx');

    showToast('فایل قالب اکسل شخصی‌سازی شده (.xlsx) دانلود شد 📊');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">شخصی‌سازی فایل اکسل مشخصات دستگاه‌ها</h3>
              <p className="text-[11px] text-slate-400">انتخاب ستون‌های دلخواه، تغییر عنوان سرستون‌ها و ساخت قالب هوشمند</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          
          <div className="bg-emerald-950/30 border border-emerald-700/40 p-3.5 rounded-2xl text-xs text-emerald-200 leading-relaxed flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              ستون‌های مورد نیاز خود برای فایل اکسل را علامت بزنید و در صورت نیاز عنوان نمایشی آن‌ها را تغییر دهید.
              با کلیک روی «دانلود قالب سفارشی اکسل»، یک فایل اکسل استاندارد با همین ساختار و سطرهای تستی صنایع چوب برای شما دانلود می‌شود.
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-2">
              <span>فیلد و نام سرستون در اکسل</span>
              <span>وضعیت درج در فایل</span>
            </div>

            <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl overflow-hidden bg-slate-850">
              {columns.map(col => (
                <div key={col.key} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-800/60 transition-colors">
                  
                  <div className="flex-1 flex items-center gap-3">
                    <button
                      type="button"
                      disabled={col.required}
                      onClick={() => toggleColumn(col.key)}
                      className={`text-slate-300 ${col.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:text-emerald-400'}`}
                    >
                      {col.active ? (
                        <CheckSquare className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-500" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs">{col.label}</span>
                        {col.required && (
                          <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded">اجباری</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 hidden sm:inline">سرستون:</span>
                    <input 
                      type="text"
                      disabled={!col.active}
                      value={col.defaultTitle}
                      onChange={(e) => handleTitleChange(col.key, e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-xs rounded-xl py-1.5 px-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 w-36 sm:w-44 text-right"
                    />
                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-2 bg-slate-900/60 flex-wrap">
          <button
            onClick={() => setColumns(DEFAULT_COLUMNS)}
            className="text-xs text-slate-400 hover:text-white underline"
          >
            بازنشانی به حالت پیش‌فرض
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              بستن
            </button>
            <button
              onClick={handleDownloadCustomTemplate}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-900/40"
            >
              <Download className="w-4 h-4" />
              <span>دانلود قالب سفارشی اکسل (.xlsx)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
