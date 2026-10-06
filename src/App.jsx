import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import DeviceCard from './components/DeviceCard';
import DeviceDetailModal from './components/DeviceDetailModal';
import DeviceEditModal from './components/DeviceEditModal';
import ExcelImportModal from './components/ExcelImportModal';
import SellerProfileModal from './components/SellerProfileModal';
import ShareMessengerModal from './components/ShareMessengerModal';
import BackupModal from './components/BackupModal';
import SaveAsModal from './components/SaveAsModal';
import ExcelCustomizerModal from './components/ExcelCustomizerModal';
import DriveFolderSyncModal from './components/DriveFolderSyncModal';
import PWAInstallModal from './components/PWAInstallModal';
import PWAInstallBanner from './components/PWAInstallBanner';
import SharePublicAppModal from './components/SharePublicAppModal';
import { onUpdateAvailable, applyUpdate } from './registerServiceWorker';
import { loadDevices, saveDevices, loadSellerProfile, saveSellerProfile } from './utils/storage';
import { generateCaption } from './utils/captionGenerator';
import { WOOD_CATEGORIES } from './data/categories';
import { prepareDevicesForExport } from './utils/imageUtils';
import { 
  restoreSavedDirectory, 
  ensureDeviceFolder, 
  syncAllDeviceImagesFromDirectory,
  saveMultipleImagesToDeviceFolder,
  saveDeviceSpecsToFolder
} from './services/driveSyncService';
import { 
  FileSpreadsheet, 
  Plus, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Archive, 
  Check, 
  Sparkles, 
  Zap, 
  ArrowUpDown, 
  Trash2, 
  Database, 
  Download, 
  Save, 
  Sliders, 
  FolderDown, 
  Layers,
  HardDrive,
  RefreshCw
} from 'lucide-react';

export default function App() {
  const [devices, setDevices] = useState(() => loadDevices());
  const [sellerProfile, setSellerProfile] = useState(() => loadSellerProfile());

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, ACTIVE, INCOMPLETE, EXCEL, SOLD, ARCHIVED
  const [selectedCategory, setSelectedCategory] = useState('ALL'); // ALL, saw, edgebander, cnc, etc.
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Drive Directory Sync state
  const [connectedDirectory, setConnectedDirectory] = useState(null); // { handle, name, hasPermission }
  const [isDriveSyncOpen, setIsDriveSyncOpen] = useState(false);

  // Modals state
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [editingDevice, setEditingDevice] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isSaveAsOpen, setIsSaveAsOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [shareModalData, setShareModalData] = useState(null); // { device, caption }

  // PWA states
  const [isPWAInstallOpen, setIsPWAInstallOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);

  // Public Share & Version Update states
  const [isPublicShareOpen, setIsPublicShareOpen] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  const [toastMessage, setToastMessage] = useState('');

  // Listen for service worker updates
  useEffect(() => {
    onUpdateAvailable(() => {
      setIsUpdateAvailable(true);
      showToast('نسخه جدید دستگاه‌یار آماده به‌روزرسانی است! 🚀');
    });
  }, []);

  // Detect PWA install status and capture beforeinstallprompt
  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
      setIsPWAInstalled(isStandalone);
    };
    checkInstalled();

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('[PWA] beforeinstallprompt captured');
    };

    const handleAppInstalled = () => {
      setIsPWAInstalled(true);
      setDeferredPrompt(null);
      showToast('وب‌اپلیکیشن دستگاه‌یار با موفقیت نصب شد 🎉');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check URL search params for shortcuts (?action=add, import, profile, pwa, share, update)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const action = urlParams.get('action');
      if (action === 'add') setIsAddingNew(true);
      else if (action === 'import') setIsImportOpen(true);
      else if (action === 'profile') setIsProfileOpen(true);
      else if (action === 'pwa') setIsPWAInstallOpen(true);
      else if (action === 'share' || action === 'update') setIsPublicShareOpen(true);
    } catch (e) {
      // ignore
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleApplyUpdate = () => {
    showToast('در حال بارگذاری نسخه جدید...');
    setTimeout(() => {
      applyUpdate();
    }, 400);
  };

  // Persist devices whenever updated
  useEffect(() => {
    saveDevices(devices);
  }, [devices]);

  // Restore saved drive directory on mount and automatically read photos if permitted
  useEffect(() => {
    restoreSavedDirectory().then(async dir => {
      if (dir) {
        setConnectedDirectory(dir);
        if (dir.hasPermission) {
          try {
            const res = await syncAllDeviceImagesFromDirectory(dir.handle, devices);
            if (res.totalImagesFound > 0) {
              setDevices(res.updatedDevices);
              showToast(`بازخوانی خودکار: ${res.totalImagesFound} تصویر از پوشه‌های درایو لود شد 🖼️`);
            }
          } catch (err) {
            console.warn('Auto sync on load error:', err);
          }
        }
      }
    });
  }, []);

  // ذخیره خودکار تمامی تغییرات هنگام بستن یا پنهان شدن صفحه مرورگر
  useEffect(() => {
    const handleSaveOnExit = () => {
      saveDevices(devices);
      saveSellerProfile(sellerProfile);
    };

    window.addEventListener('beforeunload', handleSaveOnExit);
    window.addEventListener('pagehide', handleSaveOnExit);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleSaveOnExit();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleSaveOnExit);
      window.removeEventListener('pagehide', handleSaveOnExit);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [devices, sellerProfile]);

  // Quick sync images from drive directory
  const handleQuickSyncDriveImages = async () => {
    if (!connectedDirectory?.handle) {
      setIsDriveSyncOpen(true);
      return;
    }
    try {
      showToast('در حال اسکن و خواندن عکس‌های دستگاه‌ها از درایو...');
      const res = await syncAllDeviceImagesFromDirectory(connectedDirectory.handle, devices);
      setDevices(res.updatedDevices);
      showToast(`${res.totalImagesFound} عکس از پوشه‌های درایو با موفقیت بروزرسانی شد 🖼️`);
    } catch (err) {
      showToast('خطا در خواندن پوشه درایو: ' + err.message);
    }
  };

  // Keyboard shortcut Ctrl+S / Cmd+S for Quick Save
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleQuickSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [devices, sellerProfile]);

  // Persist seller profile
  const handleSaveProfile = (newProfile) => {
    setSellerProfile(newProfile);
    saveSellerProfile(newProfile);
    showToast('اطلاعات گروه صنعتی آرسی (نمایندگی پایون) با موفقیت ذخیره شد.');
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Quick Save Handler
  const handleQuickSave = () => {
    saveDevices(devices);
    saveSellerProfile(sellerProfile);
    const time = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    showToast(`اطلاعات و تغییرات دستگاه‌ها در ساعت ${time} ذخیره شد (Ctrl+S) 💾`);
  };

  // Export JSON for Save As with embedded base64 images
  const handleExportJsonForSaveAs = async (customFileName, versionNote) => {
    try {
      showToast('در حال آماده‌سازی و تبدیل تصاویر به داده‌های آفلاین...');
      const embeddedDevices = await prepareDevicesForExport(devices);
      const now = new Date();

      const backupData = {
        app: 'DastgahYar',
        company: sellerProfile.businessName || 'گروه صنعتی آرسی (RCG)',
        version: '2.5',
        note: versionNote,
        exportedAt: now.toISOString(),
        totalDevices: embeddedDevices.length,
        sellerProfile: sellerProfile,
        devices: embeddedDevices
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${customFileName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`فایل پشتیبان کامل با نام ${customFileName}.json ذخیره شد 💾`);
    } catch (err) {
      showToast('خطا در ذخیره فایل');
    }
  };

  // Export CSV for Save As
  const handleExportCsvForSaveAs = (customFileName) => {
    if (devices.length === 0) {
      showToast('هیچ دستگاهی برای خروجی وجود ندارد.');
      return;
    }

    const headers = ['نام دستگاه', 'مدل', 'دسته‌بندی', 'سال ساخت', 'قیمت کل', 'درصد نقد', 'تعداد اقساط', 'شرایط چک', 'میزان گارانتی', 'وضعیت', 'محل بازدید', 'مشخصات فنی'];
    const rows = devices.map(d => [
      `"${(d.name || '').replace(/"/g, '""')}"`,
      `"${(d.model || '').replace(/"/g, '""')}"`,
      `"${(d.category || '').replace(/"/g, '""')}"`,
      `"${(d.year || '').replace(/"/g, '""')}"`,
      `"${(d.totalPrice || '').replace(/"/g, '""')}"`,
      d.cashPercentage || 0,
      d.installmentMonths || 0,
      `"${(d.installmentNote || '').replace(/"/g, '""')}"`,
      `"${(d.warranty || '').replace(/"/g, '""')}"`,
      `"${(d.condition || '').replace(/"/g, '""')}"`,
      `"${(d.location || '').replace(/"/g, '""')}"`,
      `"${(d.specifications || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${customFileName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`فایل اکسل/CSV با نام ${customFileName}.csv دانلود شد ✓`);
  };

  // Stats calculation
  const totalCount = devices.length;
  const activeCount = devices.filter(d => d.status === 'ACTIVE').length;
  const incompleteCount = devices.filter(d => d.isIncomplete).length;
  const excelCount = devices.filter(d => d.source === 'EXCEL' || (d.id && String(d.id).startsWith('excel'))).length;
  const soldCount = devices.filter(d => d.status === 'SOLD').length;
  const archivedCount = devices.filter(d => d.status === 'ARCHIVED').length;

  // Filtered devices with category filter
  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      // Category filter
      if (selectedCategory !== 'ALL' && d.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (activeFilter === 'ACTIVE' && d.status !== 'ACTIVE') return false;
      if (activeFilter === 'INCOMPLETE' && !d.isIncomplete) return false;
      if (activeFilter === 'EXCEL' && d.source !== 'EXCEL' && !(d.id && String(d.id).startsWith('excel'))) return false;
      if (activeFilter === 'SOLD' && d.status !== 'SOLD') return false;
      if (activeFilter === 'ARCHIVED' && d.status !== 'ARCHIVED') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (d.name || '').toLowerCase().includes(q);
        const matchesModel = (d.model || '').toLowerCase().includes(q);
        const matchesYear = (d.year || '').toLowerCase().includes(q);
        const matchesSpecs = (d.specifications || '').toLowerCase().includes(q);
        const matchesLocation = (d.location || '').toLowerCase().includes(q);
        return matchesName || matchesModel || matchesYear || matchesSpecs || matchesLocation;
      }

      return true;
    });
  }, [devices, activeFilter, selectedCategory, searchQuery]);

  // Selection handlers
  const toggleSelectDevice = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(filteredDevices.map(d => d.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // Delete Handlers
  const handleDeleteDevice = (deviceToDelete) => {
    if (window.confirm(`آیا از حذف «${deviceToDelete.name}» مطمئن هستید؟`)) {
      setDevices(prev => prev.filter(d => d.id !== deviceToDelete.id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(deviceToDelete.id);
        return next;
      });
      if (selectedDevice?.id === deviceToDelete.id) setSelectedDevice(null);
      showToast('دستگاه با موفقیت حذف شد ✓');
    }
  };

  const handleDeleteSelected = () => {
    const count = selectedIds.size;
    if (count === 0) return;
    if (window.confirm(`آیا از حذف ${count} دستگاه انتخاب شده اطمینان دارید؟`)) {
      setDevices(prev => prev.filter(d => !selectedIds.has(d.id)));
      setSelectedIds(new Set());
      showToast(`${count} دستگاه حذف شدند ✓`);
    }
  };

  const handleDeleteExcelOnly = () => {
    if (excelCount === 0) return;
    if (window.confirm(`آیا می‌خواهید تمام ${excelCount} دستگاه وارد شده از اکسل را حذف کنید؟`)) {
      setDevices(prev => prev.filter(d => d.source !== 'EXCEL' && !(d.id && String(d.id).startsWith('excel'))));
      setSelectedIds(new Set());
      showToast(`تمام ${excelCount} دستگاه اکسل حذف شدند ✓`);
    }
  };

  const handleClearAll = () => {
    if (devices.length === 0) return;
    if (window.confirm(`هشدار: آیا مایلید تمام ${devices.length} دستگاه موجود در برنامه را پاکسازی کنید؟`)) {
      setDevices([]);
      setSelectedIds(new Set());
      showToast('کل لیست دستگاه‌ها پاکسازی شد.');
    }
  };

  // Backup & Restore Handler
  const handleRestoreBackup = (backupData, mode) => {
    if (!backupData || !backupData.devices) return;
    const incoming = backupData.devices;

    if (mode === 'REPLACE') {
      setDevices(incoming);
      showToast(`بازیابی کامل انجام شد! ${incoming.length} دستگاه جایگزین شدند ✓`);
    } else {
      // Merge
      const existingIds = new Set(devices.map(d => d.id));
      const toAdd = incoming.map(nd => {
        if (existingIds.has(nd.id)) {
          return { ...nd, id: 'restored_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5) };
        }
        return nd;
      });
      setDevices(prev => [...prev, ...toAdd]);
      showToast(`${toAdd.length} دستگاه از فایل پشتیبان به لیست اضافه شدند ✓`);
    }

    if (backupData.sellerProfile) {
      handleSaveProfile(backupData.sellerProfile);
    }
  };

  // Actions
  const handleUpdateDevice = (updated) => {
    setDevices(prev => prev.map(d => d.id === updated.id ? updated : d));
    if (selectedDevice?.id === updated.id) setSelectedDevice(updated);
    if (connectedDirectory?.handle) {
      saveDeviceSpecsToFolder(connectedDirectory.handle, updated, sellerProfile);
    }
  };

  const handleSaveDevice = async (savedDevice) => {
    if (devices.some(d => d.id === savedDevice.id)) {
      setDevices(prev => prev.map(d => d.id === savedDevice.id ? savedDevice : d));
      showToast('مشخصات دستگاه با موفقیت ویرایش شد ✓');
    } else {
      setDevices(prev => [savedDevice, ...prev]);
      showToast('دستگاه جدید با موفقیت ثبت شد ✓');
    }

    // Automatically create folder and save images & specs in drive directory if connected
    if (connectedDirectory?.handle) {
      try {
        const folder = await ensureDeviceFolder(connectedDirectory.handle, savedDevice);
        if (folder) {
          // If device has images, write them to the drive folder
          if (savedDevice.images && savedDevice.images.length > 0) {
            await saveMultipleImagesToDeviceFolder(connectedDirectory.handle, savedDevice, savedDevice.images);
          }
          await saveDeviceSpecsToFolder(connectedDirectory.handle, savedDevice, sellerProfile);
          showToast(`پوشه و تصاویر در «${folder.folderName}» درایو ذخیره شدند 📁`);
        }
      } catch (err) {
        console.warn('Failed to auto create device folder on drive:', err);
      }
    }

    setEditingDevice(null);
    setIsAddingNew(false);
  };

  const handleImportSuccess = async (newDevices) => {
    const marked = newDevices.map(d => ({ 
      ...d, 
      source: 'EXCEL',
      category: d.category || 'other'
    }));
    setDevices(prev => [...marked, ...prev]);
    showToast(`${newDevices.length} دستگاه با موفقیت از اکسل وارد شد ✓`);

    // Automatically create folders in drive for all newly imported devices
    if (connectedDirectory?.handle) {
      try {
        for (const dev of marked) {
          await ensureDeviceFolder(connectedDirectory.handle, dev);
        }
        showToast(`پوشه‌های دستگاه‌های وارد شده در درایو «${connectedDirectory.name}» ساخته شدند 📂`);
      } catch (err) {
        console.warn('Failed to auto create folders for imported devices:', err);
      }
    }
  };

  const handleCopyCaption = (device) => {
    const caption = device.customCaption || generateCaption(device, sellerProfile, device.captionStyle || 'ATTRACTIVE');
    navigator.clipboard.writeText(caption);
    showToast('متن کپشن دستگاه در کلیپ‌بورد کپی شد ✓');
  };

  const handleOpenShare = (device, customCap) => {
    const caption = customCap || device.customCaption || generateCaption(device, sellerProfile, device.captionStyle || 'ATTRACTIVE');
    setShareModalData({ device, caption });
  };

  const isAllSelected = filteredDevices.length > 0 && filteredDevices.every(d => selectedIds.has(d.id));

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-['Vazirmatn'] selection:bg-amber-500 selection:text-black">
      
      {/* PWA Install Notification Banner */}
      <PWAInstallBanner
        onOpenModal={() => setIsPWAInstallOpen(true)}
        deferredPrompt={deferredPrompt}
        isInstalled={isPWAInstalled}
      />

      {/* Top Navigation */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenAdd={() => setIsAddingNew(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onSaveProject={handleQuickSave}
        onOpenSaveAs={() => setIsSaveAsOpen(true)}
        onOpenExcelCustomizer={() => setIsCustomizerOpen(true)}
        onOpenDriveSync={() => setIsDriveSyncOpen(true)}
        connectedDirectory={connectedDirectory}
        incompleteCount={incompleteCount}
        onOpenPWAInstall={() => setIsPWAInstallOpen(true)}
        isPWAInstalled={isPWAInstalled}
        onOpenPublicShare={() => setIsPublicShareOpen(true)}
        isUpdateAvailable={isUpdateAvailable}
      />

      {/* Live Version Update Notification Bar (when update detected) */}
      {isUpdateAvailable && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between shadow-lg sticky top-16 z-30 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-base">🚀</span>
            <span>نسخه جدیدتر دستگاه‌یار با قابلیت‌ها و بهبودهای جدید منتشر شد!</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyUpdate}
              className="bg-slate-950 text-emerald-300 hover:text-white px-3 py-1 rounded-lg border border-emerald-400/50 shadow transition-all active:scale-95 text-xs font-black flex items-center gap-1"
            >
              <span>به‌روزرسانی آنی</span>
            </button>
            <button
              onClick={() => setIsPublicShareOpen(true)}
              className="bg-slate-900/60 hover:bg-slate-900 text-slate-200 px-2 py-1 rounded-lg border border-white/20 text-xs"
            >
              مشاهده تغییرات
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        
        {/* Company Header Notice */}
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-850 to-blue-950/40 border border-amber-600/30 p-3 sm:p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            <span className="text-slate-200 font-bold">
              پروفایل فعال: {sellerProfile.businessName}
            </span>
            <span className="text-slate-400 hidden md:inline">| {sellerProfile.address}</span>
          </div>

          <div className="flex items-center gap-2">
            <a 
              href={sellerProfile.website || 'https://zil.ink/rcg-group'} 
              target="_blank" 
              rel="noreferrer"
              className="text-amber-400 hover:text-amber-300 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1"
            >
              🌐 معرفی دپارتمان‌ها و خدمات RCG
            </a>
            <button 
              onClick={handleQuickSave}
              className="text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>ذخیره (Ctrl+S)</span>
            </button>
          </div>
        </div>

        {/* Connected Drive Directory Bar */}
        {connectedDirectory ? (
          <div className="bg-gradient-to-r from-blue-950/40 via-slate-850 to-indigo-950/40 border border-blue-500/40 p-3 sm:p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
                <HardDrive className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">پوشه درایو متصل: {connectedDirectory.name}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <p className="text-[11px] text-slate-400">
                  فولدر هر دستگاه در هارد دیسک فعال است. عکس‌های قرار داده شده در این پوشه‌ها با یک کلیک در برنامه همگام می‌شوند.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleQuickSyncDriveImages}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow text-xs"
                title="خواندن عکس‌های جدید از پوشه‌های درایو"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>بروزرسانی عکس‌ها از درایو</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDriveSyncOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 font-medium transition-all text-xs"
              >
                مدیریت دایرکتوری
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-850/60 border border-dashed border-slate-750 p-2.5 sm:p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <HardDrive className="w-4 h-4 text-amber-400" />
              <span>پوشه درایو متصل نیست: می‌توانید یک پوشه در درایو سیستم مشخص کنید تا فولدر هر دستگاه خودکار ساخته شود و عکس‌ها خوانده شوند.</span>
            </div>
            <button
              type="button"
              onClick={() => setIsDriveSyncOpen(true)}
              className="text-amber-400 hover:text-amber-300 font-bold bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1 rounded-xl border border-amber-500/30 transition-all text-xs whitespace-nowrap"
            >
              اتصال به دایرکتوری درایو ➔
            </button>
          </div>
        )}

        {/* Top Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          
          <div 
            onClick={() => setActiveFilter('ALL')}
            className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all ${
              activeFilter === 'ALL' 
                ? 'bg-blue-950/40 border-blue-500/60 ring-1 ring-blue-500' 
                : 'bg-slate-850 border-slate-750 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">کل ماشین‌آلات</p>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1">{totalCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 text-lg">
                🪵
              </div>
            </div>
          </div>

          <div 
            onClick={() => setActiveFilter('ACTIVE')}
            className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all ${
              activeFilter === 'ACTIVE' 
                ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500' 
                : 'bg-slate-850 border-slate-750 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">فعال برای فروش</p>
                <h3 className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">{activeCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-600/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div 
            onClick={() => setActiveFilter(activeFilter === 'INCOMPLETE' ? 'ALL' : 'INCOMPLETE')}
            className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all ${
              activeFilter === 'INCOMPLETE' 
                ? 'bg-rose-950/40 border-rose-500/60 ring-1 ring-rose-500' 
                : incompleteCount > 0 
                ? 'bg-rose-950/20 border-rose-800/40 hover:border-rose-700/60' 
                : 'bg-slate-850 border-slate-750'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">نیازمند تکمیل</p>
                <h3 className="text-xl sm:text-2xl font-black text-rose-400 mt-1">{incompleteCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div 
            onClick={() => setActiveFilter(activeFilter === 'EXCEL' ? 'ALL' : 'EXCEL')}
            className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all ${
              activeFilter === 'EXCEL' 
                ? 'bg-teal-950/40 border-teal-500/60 ring-1 ring-teal-500' 
                : 'bg-slate-850 border-slate-750 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">وارد شده از اکسل</p>
                <h3 className="text-xl sm:text-2xl font-black text-teal-400 mt-1">{excelCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-600/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
            </div>
          </div>

        </div>

        {/* Categories Filter Chips Bar (ویژه صنعت چوب و ماشین‌ابزار) */}
        <div className="bg-slate-850 border border-slate-750 p-3 sm:p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400" />
              دسته‌بندی‌های پرکاربرد ماشین‌آلات صنعت چوب و تجهیزات:
            </span>
            <button 
              onClick={() => setSelectedCategory('ALL')}
              className={`font-semibold ${selectedCategory === 'ALL' ? 'text-amber-400 underline' : 'text-slate-400 hover:text-slate-200'}`}
            >
              نمایش همه دسته‌ها ({totalCount})
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-1">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                selectedCategory === 'ALL'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-900/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
            >
              🌟 همه دسته‌ها
            </button>

            {WOOD_CATEGORIES.map(cat => {
              const catCount = devices.filter(d => d.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/30 font-bold'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === cat.id ? 'bg-black/30' : 'bg-slate-700 text-slate-400'}`}>
                    {catCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Tabs & Batch Action Toolbar */}
        <div className="bg-slate-850 border border-slate-750 p-4 rounded-2xl space-y-3">
          
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
              {[
                { id: 'ALL', label: `همه وضعیت‌ها (${totalCount})` },
                { id: 'ACTIVE', label: `فعال فروش (${activeCount})` },
                { id: 'INCOMPLETE', label: `نیازمند تکمیل (${incompleteCount})` },
                { id: 'EXCEL', label: `فقط اکسل (${excelCount})` },
                { id: 'SOLD', label: `فروخته شده (${soldCount})` },
                { id: 'ARCHIVED', label: `بایگانی (${archivedCount})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                    activeFilter === tab.id
                      ? tab.id === 'INCOMPLETE'
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-900/30'
                        : 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-400 border border-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCustomizerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-semibold transition-all"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>شخصی‌سازی فایل اکسل</span>
              </button>

              <button
                onClick={() => setIsBackupOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all"
              >
                <Database className="w-3.5 h-3.5" />
                <span>پشتیبان‌گیری و انتقال داده‌ها</span>
              </button>
            </div>
          </div>

          {/* Batch operations toolbar */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap text-xs">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
                <input 
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
                />
                <span className="font-medium">انتخاب همه دستگاه‌های این لیست</span>
              </label>

              {selectedIds.size > 0 && (
                <span className="font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {selectedIds.size} مورد انتخاب شده
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {selectedIds.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف {selectedIds.size} مورد انتخاب‌شده</span>
                </button>
              )}

              {excelCount > 0 && (
                <button
                  onClick={handleDeleteExcelOnly}
                  className="bg-amber-600/15 hover:bg-amber-600/25 text-amber-300 border border-amber-500/30 font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
                  title="حذف کلیه دستگاه‌هایی که از اکسل وارد شده‌اند"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف دستگاه‌های اکسل ({excelCount})</span>
                </button>
              )}

              <button
                onClick={handleClearAll}
                className="bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 border border-slate-700 font-medium px-2.5 py-1.5 rounded-xl transition-all"
                title="پاکسازی کامل همه دستگاه‌ها"
              >
                پاکسازی کل لیست
              </button>
            </div>
          </div>

        </div>

        {/* Devices Grid or Empty State */}
        {filteredDevices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredDevices.map(device => (
              <DeviceCard
                key={device.id}
                device={device}
                onCardClick={setSelectedDevice}
                onShareClick={(d) => handleOpenShare(d)}
                onCopyCaption={handleCopyCaption}
                onEditClick={setEditingDevice}
                onDeleteClick={handleDeleteDevice}
                isSelected={selectedIds.has(device.id)}
                onToggleSelect={toggleSelectDevice}
              />
            ))}
          </div>
        ) : (
          <div className="bg-slate-850 border border-slate-750 rounded-3xl p-10 text-center max-w-lg mx-auto my-12 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-600/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto text-2xl font-bold">
              🪵
            </div>

            <h3 className="text-base font-bold text-white">دستگاهی در این دسته‌بندی یافت نشد</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              {searchQuery ? 'هیچ دستگاهی با مشخصات جستجو شده یافت نشد.' : 'می‌توانید دستگاه جدید اضافه کنید یا فایل اکسل را آپلود نمایید.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
              <button
                onClick={() => setIsImportOpen(true)}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md shadow-blue-900/30"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>آپلود فایل اکسل</span>
              </button>

              <button
                onClick={() => setIsAddingNew(true)}
                className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-750 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>ثبت دستی دستگاه</span>
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Floating Action Bar on Mobile */}
      <div className="fixed bottom-4 left-4 z-30 sm:hidden">
        <button
          onClick={() => setIsAddingNew(true)}
          className="w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xl shadow-amber-900/60 border-2 border-amber-300 transition-transform active:scale-95"
          title="افزودن دستگاه دستی"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 inset-x-0 mx-auto max-w-md px-4 z-50 animate-bounce">
          <div className="bg-emerald-600 text-white font-bold text-xs py-3 px-4 rounded-2xl shadow-2xl flex items-center justify-between border border-emerald-400">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage('')} className="text-emerald-200 hover:text-white">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedDevice && (
        <DeviceDetailModal
          device={selectedDevice}
          profile={sellerProfile}
          onClose={() => setSelectedDevice(null)}
          onEdit={(d) => { setSelectedDevice(null); setEditingDevice(d); }}
          onDelete={handleDeleteDevice}
          onUpdateDevice={handleUpdateDevice}
          onOpenShare={handleOpenShare}
          connectedDirectory={connectedDirectory}
        />
      )}

      {(editingDevice || isAddingNew) && (
        <DeviceEditModal
          device={editingDevice}
          profile={sellerProfile}
          onClose={() => { setEditingDevice(null); setIsAddingNew(false); }}
          onSave={handleSaveDevice}
        />
      )}

      {isImportOpen && (
        <ExcelImportModal
          profile={sellerProfile}
          onClose={() => setIsImportOpen(false)}
          onImportSuccess={handleImportSuccess}
        />
      )}

      {isProfileOpen && (
        <SellerProfileModal
          profile={sellerProfile}
          onClose={() => setIsProfileOpen(false)}
          onSave={handleSaveProfile}
        />
      )}

      {isBackupOpen && (
        <BackupModal
          isOpen={isBackupOpen}
          onClose={() => setIsBackupOpen(false)}
          devices={devices}
          sellerProfile={sellerProfile}
          connectedDirectory={connectedDirectory}
          onRestoreBackup={handleRestoreBackup}
          showToast={showToast}
        />
      )}

      {isSaveAsOpen && (
        <SaveAsModal
          isOpen={isSaveAsOpen}
          onClose={() => setIsSaveAsOpen(false)}
          devices={devices}
          sellerProfile={sellerProfile}
          onExportJson={handleExportJsonForSaveAs}
          onExportCsv={handleExportCsvForSaveAs}
          showToast={showToast}
        />
      )}

      {isCustomizerOpen && (
        <ExcelCustomizerModal
          isOpen={isCustomizerOpen}
          onClose={() => setIsCustomizerOpen(false)}
          showToast={showToast}
        />
      )}

      {isDriveSyncOpen && (
        <DriveFolderSyncModal
          isOpen={isDriveSyncOpen}
          onClose={() => setIsDriveSyncOpen(false)}
          devices={devices}
          connectedDirectory={connectedDirectory}
          onDirectoryConnected={(dir) => setConnectedDirectory(dir)}
          onDirectoryDisconnected={() => setConnectedDirectory(null)}
          onDevicesUpdated={(updated) => setDevices(updated)}
          showToast={showToast}
        />
      )}

      {shareModalData && (
        <ShareMessengerModal
          device={shareModalData.device}
          caption={shareModalData.caption}
          onClose={() => setShareModalData(null)}
          onCopySuccess={() => showToast('کپشن دستگاه با موفقیت کپی شد ✓')}
        />
      )}

      {/* PWA Install Guide & Modal */}
      <PWAInstallModal
        isOpen={isPWAInstallOpen}
        onClose={() => setIsPWAInstallOpen(false)}
        deferredPrompt={deferredPrompt}
        isInstalled={isPWAInstalled}
        onInstallSuccess={() => showToast('درخواست نصب PWA با موفقیت ارسال شد ✓')}
      />

      {/* Public Share & Version Update Modal */}
      <SharePublicAppModal
        isOpen={isPublicShareOpen}
        onClose={() => setIsPublicShareOpen(false)}
        isUpdateAvailable={isUpdateAvailable}
        onApplyUpdate={handleApplyUpdate}
        showToast={showToast}
      />

    </div>
  );
}
