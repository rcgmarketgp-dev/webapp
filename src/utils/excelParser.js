import * as XLSX from 'xlsx';

/**
 * Normalizes Persian/Arabic digits to English digits
 */
export function normalizeDigits(str) {
  if (!str) return '';
  return String(str)
    .replace(/[۰٠]/g, '0')
    .replace(/[۱١]/g, '1')
    .replace(/[۲٢]/g, '2')
    .replace(/[۳٣]/g, '3')
    .replace(/[۴٤]/g, '4')
    .replace(/[۵٥]/g, '5')
    .replace(/[۶٦]/g, '6')
    .replace(/[۷٧]/g, '7')
    .replace(/[۸٨]/g, '8')
    .replace(/[۹٩]/g, '9')
    .trim();
}

/**
 * Parses uploaded Excel / CSV file (ArrayBuffer or File)
 */
export async function parseExcelFile(file) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('فایل اکسل خالی است یا ساختار نامعتبر دارد.');
  }

  // Find header row (search in first 3 rows)
  let headerIndex = 0;
  for (let i = 0; i < Math.min(3, rawRows.length); i++) {
    const row = rawRows[i] || [];
    const text = row.map(c => String(c).toLowerCase()).join(' ');
    if (text.includes('دستگاه') || text.includes('نام') || text.includes('مدل') || text.includes('device') || text.includes('name')) {
      headerIndex = i;
      break;
    }
  }

  const headers = (rawRows[headerIndex] || []).map(h => String(h || '').trim());
  const detectedColumns = [];

  // Map column index to field
  let colName = -1;
  let colModel = -1;
  let colYear = -1;
  let colPrice = -1;
  let colCash = -1;
  let colInstallment = -1;
  let colInstallmentNote = -1;
  let colWarranty = -1;
  let colSpecs = -1;
  let colCondition = -1;
  let colLocation = -1;

  headers.forEach((header, idx) => {
    const h = header.toLowerCase();
    detectedColumns.push(header);

    if (colName === -1 && (h.includes('نام دستگاه') || h.includes('دستگاه') || h.includes('عنوان') || h === 'نام' || h.includes('device') || h.includes('name') || h.includes('machine'))) {
      colName = idx;
    } else if (colModel === -1 && (h.includes('مدل') || h.includes('تیپ') || h.includes('model') || h.includes('type'))) {
      colModel = idx;
    } else if (colYear === -1 && (h.includes('سال') || h.includes('ساخت') || h.includes('تولید') || h.includes('year') || h.includes('built'))) {
      colYear = idx;
    } else if (colPrice === -1 && (h.includes('قیمت') || h.includes('مبلغ') || h.includes('ارزش') || h.includes('price') || h.includes('amount') || h.includes('cost'))) {
      colPrice = idx;
    } else if (colCash === -1 && (h.includes('نقدی') || h.includes('پیش پرداخت') || h.includes('درصد') || h.includes('cash') || h.includes('down'))) {
      colCash = idx;
    } else if (colInstallment === -1 && (h.includes('اقساط') || h.includes('قسط') || h.includes('ماه') || h.includes('installment') || h.includes('months'))) {
      colInstallment = idx;
    } else if (colInstallmentNote === -1 && (h.includes('شرایط اقساط') || h.includes('چک') || h.includes('شرایط پرداخت'))) {
      colInstallmentNote = idx;
    } else if (colWarranty === -1 && (h.includes('گارانتی') || h.includes('ضمانت') || h.includes('خدمات') || h.includes('warranty') || h.includes('guarantee'))) {
      colWarranty = idx;
    } else if (colSpecs === -1 && (h.includes('مشخصات') || h.includes('جزییات') || h.includes('جزئیات') || h.includes('توضیحات') || h.includes('spec') || h.includes('detail'))) {
      colSpecs = idx;
    } else if (colCondition === -1 && (h.includes('وضعیت') || h.includes('کارکرد') || h.includes('condition'))) {
      colCondition = idx;
    } else if (colLocation === -1 && (h.includes('شهر') || h.includes('محل') || h.includes('موقعیت') || h.includes('location') || h.includes('city'))) {
      colLocation = idx;
    }
  });

  if (colName === -1 && headers.length > 0) colName = 0;
  if (colModel === -1 && headers.length > 1) colModel = 1;

  const devices = [];

  for (let r = headerIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0 || row.every(c => c === undefined || c === null || String(c).trim() === '')) {
      continue;
    }

    const rawName = colName >= 0 && row[colName] != null ? String(row[colName]).trim() : '';
    const rawModel = colModel >= 0 && row[colModel] != null ? String(row[colModel]).trim() : '';
    const rawYear = colYear >= 0 && row[colYear] != null ? normalizeDigits(String(row[colYear])) : '';
    const rawPrice = colPrice >= 0 && row[colPrice] != null ? formatPrice(String(row[colPrice])) : '';
    const rawCash = colCash >= 0 && row[colCash] != null ? extractPercent(row[colCash]) : 0;
    const rawInstallment = colInstallment >= 0 && row[colInstallment] != null ? extractMonths(row[colInstallment]) : 0;
    const rawInstallmentNote = colInstallmentNote >= 0 && row[colInstallmentNote] != null ? String(row[colInstallmentNote]).trim() : '';
    const rawWarranty = colWarranty >= 0 && row[colWarranty] != null ? String(row[colWarranty]).trim() : '';
    const rawSpecs = colSpecs >= 0 && row[colSpecs] != null ? String(row[colSpecs]).trim() : '';
    const rawCondition = colCondition >= 0 && row[colCondition] != null ? String(row[colCondition]).trim() : 'کارکرده تمیز';
    const rawLocation = colLocation >= 0 && row[colLocation] != null ? String(row[colLocation]).trim() : '';

    const name = rawName || (rawModel ? `دستگاه ${rawModel}` : `دستگاه شماره ${r}`);

    const isIncomplete = !name ||
      !rawModel ||
      !rawYear ||
      !rawPrice ||
      (rawCash === 0 && rawInstallment === 0) ||
      !rawWarranty ||
      !rawSpecs;

    devices.push({
      id: Date.now() + Math.random(),
      name,
      model: rawModel,
      year: rawYear,
      totalPrice: rawPrice,
      cashPercentage: rawCash,
      installmentMonths: rawInstallment,
      installmentNote: rawInstallmentNote,
      warranty: rawWarranty,
      specifications: rawSpecs,
      condition: rawCondition,
      location: rawLocation,
      images: [],
      captionStyle: 'ATTRACTIVE',
      customCaption: '',
      status: 'ACTIVE',
      isIncomplete,
      createdAt: Date.now()
    });
  }

  return {
    devices,
    detectedColumns,
    totalRows: devices.length
  };
}

function extractPercent(val) {
  const cleaned = normalizeDigits(String(val)).replace(/[%درصد]/g, '').trim();
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  if (num > 0 && num <= 1) return Math.round(num * 100);
  return Math.min(100, Math.max(0, Math.round(num)));
}

function extractMonths(val) {
  const cleaned = normalizeDigits(String(val)).replace(/[ماهقسط]/g, '').trim();
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

function formatPrice(val) {
  const trimmed = String(val).trim();
  const digits = normalizeDigits(trimmed).replace(/[^\d]/g, '');
  if (digits.length >= 4) {
    const num = parseInt(digits, 10);
    return trimmed.includes('میلیون') ? trimmed : `${num.toLocaleString('fa-IR')} تومان`;
  }
  return trimmed;
}

export function generateSampleCsvContent() {
  const rows = [
    ['نام دستگاه', 'مدل', 'سال ساخت', 'قیمت کل', 'درصد نقدی', 'تعداد اقساط', 'میزان گارانتی', 'مشخصات فنی', 'وضعیت', 'شهر'],
    ['تراش CNC سه محور', 'CK6140 / Siemens 808D', '1402', '850000000 تومان', '40%', '10 ماه', '12 ماه گارانتی قطعات و 10 سال خدمات', 'کارگیر 400 میلی‌متر - سنتر 1000 - تارت 6 تایی برقی سفارشی', 'صفر / آکبند', 'تهران'],
    ['فرز CNC عمودی', 'VMC 850 / Fanuc 0i-MF', '1401', '1650000000 تومان', '50%', '12 ماه', '6 ماه گارانتی مکانیکال', 'کورس محورها 800x500x500 - اسپیندل 10000 دور BT40 - چتری 24 تایی', 'در حد نو', 'اصفهان'],
    ['دستگاه تزریق پلاستیک', 'HAIXING 160T', '2022', '920000000 تومان', '35%', '8 ماه', '1 سال ضمانت هیدرولیک', 'تناژ 160 تن - سروو موتور کم‌مصرف - پی ال سی Techmation', 'کارکرده تمیز', 'تبریز'],
    ['برش لیزر فایبر فلزات', 'Fiber Laser 3000W Raycus', '1402', '1450000000 تومان', '45%', '12 ماه', '2 سال گارانتی رسمی سورس و چیلر', 'میز 3x1.5 متر تعویض‌شو - هد Boci اتوفوکوس - چیلر دو مداره صنعتی', 'صفر / آکبند', 'کرج'],
    ['پرس برک CNC هیدرولیک', 'Delem DA53T 100T', '2021', '780000000 تومان', '30%', '6 ماه', '9 ماه گارانتی هیدرولیک و آب‌بندی جک‌ها', 'طول کارگیر 3100 میلی‌متر - تناژ 100 تن - فوتوسل ایمنی اپتیکال', 'در حد نو', 'مشهد']
  ];

  return rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
}
