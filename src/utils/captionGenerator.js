/**
 * Calculates payment breakdown
 */
export function calculatePayment(totalPriceStr, cashPercent, months) {
  const digits = String(totalPriceStr || '').replace(/[^\d]/g, '');
  const price = parseInt(digits, 10);
  const cashP = parseInt(cashPercent, 10) || 0;
  const m = parseInt(months, 10) || 0;

  if (price && price > 0 && cashP > 0 && cashP < 100 && m > 0) {
    const downPayment = Math.round((price * cashP) / 100);
    const remaining = price - downPayment;
    const monthly = Math.round(remaining / m);
    return {
      price,
      downPayment,
      remaining,
      monthly,
      formattedDownPayment: downPayment.toLocaleString('fa-IR') + ' تومان',
      formattedRemaining: remaining.toLocaleString('fa-IR') + ' تومان',
      formattedMonthly: monthly.toLocaleString('fa-IR') + ' تومان',
      hasCalculated: true
    };
  }

  return {
    price: price || null,
    downPayment: null,
    remaining: null,
    monthly: null,
    formattedDownPayment: cashP > 0 ? `${cashP}٪ پیش‌پرداخت` : '',
    formattedMonthly: m > 0 ? `${m} قسط ماهیانه` : '',
    hasCalculated: false
  };
}

/**
 * Generates Persian sales caption for device
 */
export function generateCaption(device, profile, style = 'ATTRACTIVE') {
  const payment = calculatePayment(device.totalPrice, device.cashPercentage, device.installmentMonths);
  const activeStyle = style || device.captionStyle || 'ATTRACTIVE';

  switch (activeStyle) {
    case 'INDUSTRIAL':
      return buildIndustrialCaption(device, payment, profile);
    case 'INSTALLMENT':
      return buildInstallmentCaption(device, payment, profile);
    case 'COMPACT':
      return buildCompactCaption(device, payment, profile);
    case 'ATTRACTIVE':
    default:
      return buildAttractiveCaption(device, payment, profile);
  }
}

function buildAttractiveCaption(device, payment, profile) {
  const lines = [];
  lines.push('📢 #فروش_ویژه_دستگاه');
  lines.push(`⚙️ ${device.name || 'دستگاه صنعتی'}`);
  if (device.model) lines.push(`🏷️ مدل / تیپ: ${device.model}`);
  if (device.year) lines.push(`📅 سال ساخت: ${device.year}`);
  if (device.condition) lines.push(`✨ وضعیت کارکرد: ${device.condition}`);
  if (device.location) lines.push(`📍 محل بازدید: ${device.location}`);

  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━');
  lines.push('📋 مشخصات فنی و امکانات:');
  if (device.specifications) {
    const specs = device.specifications
      .split(/[\n•\-]+/)
      .map(s => s.trim())
      .filter(Boolean);
    if (specs.length > 0) {
      specs.forEach(s => lines.push(`🔹 ${s}`));
    } else {
      lines.push(`🔹 ${device.specifications}`);
    }
  } else {
    lines.push('🔹 کارکرد عالی، بسیار تمیز و آماده تست و راه‌اندازی');
  }

  if (device.warranty) {
    lines.push(`🛡️ گارانتی و خدمات: ${device.warranty}`);
  }

  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━');
  lines.push('💳 شرایط پرداخت و قیمت:');
  if (device.totalPrice) {
    lines.push(`💰 مبلغ کل: ${device.totalPrice}`);
  }

  if (device.cashPercentage > 0 || device.installmentMonths > 0) {
    if (payment.hasCalculated) {
      lines.push(`💵 پیش‌پرداخت نقدی (${device.cashPercentage}٪): ${payment.formattedDownPayment}`);
      lines.push(`🗓️ شرایط اقساط: ${device.installmentMonths} قسط ماهیانه هر کدام ${payment.formattedMonthly}`);
      lines.push(`▫️ مابقی مبلغ اقساط: ${payment.formattedRemaining}`);
    } else {
      if (device.cashPercentage > 0) lines.push(`💵 پیش‌پرداخت نقدی: ${device.cashPercentage} درصد`);
      if (device.installmentMonths > 0) lines.push(`🗓️ اقساط ماهیانه: طی ${device.installmentMonths} قسط`);
    }

    if (device.installmentNote) {
      lines.push(`📝 شرایط چک و تسویه: ${device.installmentNote}`);
    }
  } else {
    lines.push('🤝 نحوه تسویه: نقدی یا توافقی با مشتری');
  }

  appendProfile(lines, profile);
  return lines.join('\n');
}

function buildIndustrialCaption(device, payment, profile) {
  const lines = [];
  lines.push('اطلاعیه واگذاری ماشین‌آلات و تجهیزات صنعتی');
  lines.push('-------------------------------------------');
  lines.push(`نام دستگاه: ${device.name}`);
  if (device.model) lines.push(`مدل / برند: ${device.model}`);
  if (device.year) lines.push(`سال ساخت: ${device.year}`);
  if (device.condition) lines.push(`وضعیت کارکرد: ${device.condition}`);
  if (device.location) lines.push(`محل استقرار: ${device.location}`);
  lines.push('-------------------------------------------');
  lines.push('مشخصات فنی و توانمندی‌ها:');
  lines.push(device.specifications || 'مشخصات استاندارد خط تولید، کارکرد سالم و بدون عیب');
  if (device.warranty) lines.push(`تعهدات گارانتی: ${device.warranty}`);
  lines.push('-------------------------------------------');
  lines.push('شرایط مالی و واگذاری:');
  if (device.totalPrice) lines.push(`مبلغ کل: ${device.totalPrice}`);
  if (device.cashPercentage > 0) {
    lines.push(`درصد پرداخت نقدی: ${payment.hasCalculated ? payment.formattedDownPayment : device.cashPercentage + '%'}`);
  }
  if (device.installmentMonths > 0) {
    const monthlyText = payment.hasCalculated ? ` (ماهیانه ${payment.formattedMonthly})` : '';
    lines.push(`تسهیلات اقساط: ${device.installmentMonths} ماهه${monthlyText}`);
  }
  if (device.installmentNote) lines.push(`توضیحات تسویه: ${device.installmentNote}`);

  appendProfile(lines, profile);
  return lines.join('\n');
}

function buildInstallmentCaption(device, payment, profile) {
  const lines = [];
  lines.push('🔥 فرصت استثنایی خرید اقساطی تجهیزات صنعتی');
  lines.push('⚡ با کمترین پیش‌پرداخت، بدون بهره و ضامن!');
  lines.push('');
  lines.push(`💎 ${device.name} ${device.model ? `| ${device.model}` : ''}`);
  if (device.year) lines.push(`▫️ سال ساخت: ${device.year}`);
  lines.push('');
  lines.push('🎯 جدول اقساط و تسویه آسان:');
  if (device.totalPrice) lines.push(`▫️ قیمت کل: ${device.totalPrice}`);
  if (device.cashPercentage > 0) {
    const down = payment.hasCalculated ? `${payment.formattedDownPayment} (${device.cashPercentage}٪)` : `${device.cashPercentage}٪`;
    lines.push(`▫️ پیش‌پرداخت: فقط ${down}`);
  }
  if (device.installmentMonths > 0) {
    const monthly = payment.hasCalculated ? `${payment.formattedMonthly} در ماه` : `طی ${device.installmentMonths} قسط`;
    lines.push(`▫️ اقساط ماهیانه: ${device.installmentMonths} قسط (${monthly})`);
  }
  if (device.installmentNote) lines.push(`▫️ نحوه چک: ${device.installmentNote}`);
  if (device.warranty) lines.push(`🛡️ ضمانت همراه دستگاه: ${device.warranty}`);
  lines.push('');
  lines.push(`📌 مشخصات فنی: ${device.specifications || 'کارکرد عالی، آماده تحویل فوری'}`);
  if (device.location) lines.push(`📍 محل بازدید: ${device.location}`);

  appendProfile(lines, profile);
  return lines.join('\n');
}

function buildCompactCaption(device, payment, profile) {
  const lines = [];
  lines.push(`📌 ${device.name} ${device.model ? `| مدل ${device.model}` : ''}`);
  if (device.year) lines.push(`▫️ ساخت: ${device.year}`);
  if (device.condition) lines.push(`▫️ وضعیت: ${device.condition}`);
  if (device.totalPrice) lines.push(`▫️ قیمت: ${device.totalPrice}`);
  if (device.cashPercentage > 0 || device.installmentMonths > 0) {
    const down = payment.hasCalculated ? payment.formattedDownPayment : `${device.cashPercentage}٪`;
    lines.push(`▫️ شرایط: ${down} نقدی + ${device.installmentMonths} قسط`);
  }
  if (device.warranty) lines.push(`▫️ گارانتی: ${device.warranty}`);
  if (device.specifications) lines.push(`▫️ مشخصات: ${device.specifications.slice(0, 100)}...`);

  appendProfile(lines, profile, true);
  return lines.join('\n');
}

function appendProfile(lines, profile, compact = false) {
  if (!profile) return;

  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━');
  if (profile.businessName) lines.push(`🏢 ${profile.businessName}`);
  lines.push('📞 جهت مشاوره فنی، استعلام قیمت و خرید:');
  if (profile.phone1) lines.push(`📲 تماس: ${profile.phone1}`);
  if (profile.phone2) lines.push(`☎️ دفتر: ${profile.phone2}`);

  const messengers = [];
  if (profile.baleId) messengers.push(`پیام‌رسان بله: ${profile.baleId}`);
  if (profile.eitaaId) messengers.push(`پیام‌رسان ایتا: ${profile.eitaaId}`);
  if (profile.telegramId) messengers.push(`تلگرام: ${profile.telegramId}`);
  if (profile.whatsappNumber) messengers.push(`واتساپ: ${profile.whatsappNumber}`);
  if (profile.instagramId) messengers.push(`اینستاگرام: ${profile.instagramId}`);

  if (messengers.length > 0) {
    lines.push('💬 ارتباط در پیام‌رسان‌ها:');
    messengers.forEach(m => lines.push(`🔸 ${m}`));
  }

  if (profile.address) lines.push(`📍 آدرس: ${profile.address}`);
  if (profile.website) lines.push(`🌐 لینک معرفی دپارتمان‌ها و خدمات: ${profile.website}`);
  if (!compact && profile.footerNote) {
    lines.push('');
    lines.push(`✨ ${profile.footerNote}`);
  }
}
