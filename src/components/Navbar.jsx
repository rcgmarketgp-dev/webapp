import React from 'react';
import { 
  Cpu, 
  FileSpreadsheet, 
  PlusCircle, 
  UserCheck, 
  Search, 
  X, 
  AlertTriangle,
  Code,
  Download,
  Database,
  Save,
  Sliders,
  FolderDown,
  HardDrive
} from 'lucide-react';

export default function Navbar({ 
  searchQuery, 
  setSearchQuery, 
  onOpenImport, 
  onOpenAdd, 
  onOpenProfile,
  onOpenBackup,
  onSaveProject,
  onOpenSaveAs,
  onOpenExcelCustomizer,
  onOpenDriveSync,
  connectedDirectory,
  incompleteCount
}) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & App Title with RCG Branding */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-orange-900/30 text-xl font-black">
              🪵
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">گروه صنعتی آرسی (RCG)</h1>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950">
                  نمایندگی پایون
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">راه‌حل یکپارچه ماشین‌ابزار صنعت چوب | کپشن‌ساز و فروش</p>
            </div>
          </div>

          {/* Search Box */}
          <div className="flex-1 max-w-sm relative hidden md:block">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی دورکن، لبه‌چسبان، CNC، مدل..."
              className="w-full bg-slate-800/80 border border-slate-700 text-xs sm:text-sm rounded-xl py-2 px-9 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Quick Save Button */}
            <button
              onClick={onSaveProject}
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-bold rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition-all shadow-sm"
              title="ذخیره سریع اطلاعات (Ctrl+S)"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ذخیره (Save)</span>
            </button>

            {/* Save As Button */}
            <button
              onClick={onOpenSaveAs}
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-bold rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 transition-all shadow-sm"
              title="ذخیره با نام دلخواه و خروجی با فرمت‌های مختلف"
            >
              <FolderDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save As...</span>
            </button>

            {/* Download Standalone HTML Button */}
            <a
              href="/standalone-app.html"
              download="dastgah-yar-standalone.html"
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-bold rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 transition-all shadow-sm"
              title="دانلود مستقیم تک‌فایل HTML + JavaScript (اجرای آفلاین با دبل‌کلیک بدون نیاز به نصب)"
            >
              <Code className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden xl:inline">کد HTML مستقل</span>
            </a>

            {/* Drive Directory Sync Button */}
            <button
              onClick={onOpenDriveSync}
              className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-bold rounded-xl transition-all shadow-sm border ${
                connectedDirectory 
                  ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30' 
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
              }`}
              title={connectedDirectory ? `پوشه درایو متصل: ${connectedDirectory.name} - کلیک جهت مدیریت و همگام‌سازی عکس‌ها` : 'اتصال به دایرکتوری درایو برای ایجاد پوشه و خواندن عکس‌های دستگاه‌ها'}
            >
              <HardDrive className={`w-3.5 h-3.5 ${connectedDirectory ? 'text-amber-400' : 'text-slate-400'}`} />
              {connectedDirectory ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="hidden md:inline">پوشه درایو: {connectedDirectory.name}</span>
                  <span className="md:hidden">پوشه</span>
                </>
              ) : (
                <span className="hidden md:inline">پوشه درایو</span>
              )}
            </button>

            {/* Excel Customizer Button */}
            <button
              onClick={onOpenExcelCustomizer}
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-all"
              title="شخصی‌سازی ستون‌ها و قالب اکسل"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">قالب اکسل</span>
            </button>

            {/* Import Excel Button */}
            <button
              onClick={onOpenImport}
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 transition-all"
              title="آپلود فایل اکسل"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">آپلود اکسل</span>
            </button>

            {/* Add Manual Button */}
            <button
              onClick={onOpenAdd}
              className="flex items-center gap-1 px-3 py-2 text-xs sm:text-sm font-bold rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-md shadow-amber-900/30 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">افزودن دستگاه</span>
              <span className="sm:hidden">ثبت</span>
            </button>

            {/* Seller Profile Button */}
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
              title="پروفایل شرکت آرسی و شماره‌های تماس نمایندگی پایون"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline">پروفایل آرسی</span>
            </button>

            {/* Standalone HTML Download */}
            <a
              href="/standalone-app.html"
              download="dastgahyar-app.html"
              className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/40 hover:to-indigo-600/40 text-purple-200 border border-purple-400/40 transition-all shadow-sm"
              title="دریافت و دانلود فایل کامل تک‌فایلی HTML و JavaScript برای استفاده آفلاین"
            >
              <Download className="w-3.5 h-3.5 text-purple-300" />
              <span className="hidden md:inline">دانلود HTML/JS</span>
            </a>

          </div>

        </div>

        {/* Mobile Search input */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی دورکن، لبه‌چسبان، CNC..."
              className="w-full bg-slate-800/80 border border-slate-700 text-xs rounded-xl py-2 px-8 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
