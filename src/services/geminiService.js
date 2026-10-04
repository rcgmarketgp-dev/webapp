// src/services/geminiService.js
// سرویس اختصاصی یکپارچه‌سازی هوش مصنوعی Google Gemini جهت نگارش هوشمند کپشن و معرفی دستگاه‌ها

export const GEMINI_MODEL = 'gemini-2.5-flash';
export const STORAGE_KEY_GEMINI = 'dastgah_yar_gemini_api_key';

/**
 * دریافت کلید فعال Gemini API از localStorage یا متغیرهای محیطی
 */
export function getGeminiApiKey() {
  try {
    const localKey = localStorage.getItem(STORAGE_KEY_GEMINI);
    if (localKey && localKey.trim()) {
      return localKey.trim();
    }
  } catch (e) {
    // localStorage may fail in private mode
  }

  // بررسی متغیر محیطی تزریق‌شده از طریق Vite Define
  if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
    const envKey = process.env.GEMINI_API_KEY.trim();
    if (envKey && envKey !== 'MY_GEMINI_API_KEY') {
      return envKey;
    }
  }

  // بررسی متغیر محیطی استاندارد Vite
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
    const viteKey = import.meta.env.VITE_GEMINI_API_KEY.trim();
    if (viteKey && viteKey !== 'MY_GEMINI_API_KEY') {
      return viteKey;
    }
  }

  return '';
}

/**
 * بررسی وجود کلید معتبر
 */
export function hasGeminiApiKey() {
  return Boolean(getGeminiApiKey());
}

/**
 * ذخیره یا حذف کلید در LocalStorage
 */
export function setGeminiApiKey(key) {
  try {
    const cleanKey = (key || '').trim();
    if (cleanKey) {
      localStorage.setItem(STORAGE_KEY_GEMINI, cleanKey);
    } else {
      localStorage.removeItem(STORAGE_KEY_GEMINI);
    }
  } catch (e) {
    console.error('Error saving Gemini API key to localStorage:', e);
  }
}

/**
 * تست اعتبار کلید Gemini با یک درخواست ساده
 */
export async function testGeminiApiKey(keyToTest) {
  const apiKey = (keyToTest || getGeminiApiKey()).trim();
  if (!apiKey) {
    throw new Error('لطفاً ابتدا کلید API را وارد فرمایید.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'سلام، تست اتصال به هوش مصنوعی گوگل جمینای. لطفاً فقط یک کلمه پاسخ دهید: تایید' }] }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `خطای اتصال به سرور گوگل (${response.status})`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return text?.trim() || 'تایید شد';
}

/**
 * راهنمای لحن‌های نگارش کپشن
 */
export const TONE_GUIDELINES = {
  ATTRACTIVE: 'لحن بسیار جذاب، پرانرژی و ترغیب‌کننده همراه با ایموجی‌های مناسب صنعت، خطوط تفکیک‌کننده، برجسته‌سازی مزایای رقابتی دستگاه و آماده‌سازی برای کانال‌های تلگرام، اینستاگرام، بله، ایتا و واتساپ.',
  INDUSTRIAL: 'لحن رسمی، شرکتی، فنی و B2B متناسب با ارتباط با کارخانجات بزرگ، مدیران تولید و سرمایه‌گذاران صنعتی با تکیه بر استانداردهای تولید و قابلیت‌های فنی دستگاه.',
  INSTALLMENT: 'تمرکز ویژه بر شرایط پرداخت اقساطی، درصد پیش‌پرداخت، نحوه تسویه با چک صیادی بنفش بدون کارمزد، و فرصت خرید آسان بدون فشار نقدینگی برای کارگاه‌ها.',
  COMPACT: 'متن کوتاه، تمیز، گلوله‌ای و خلاصه کاتالوگی، مناسب برای پیامک، استوری یا استعلام سریع قیمت.'
};

/**
 * فراخوانی مستقیم Google Gemini API جهت تولید کپشن یک دستگاه
 */
export async function callGeminiApi({
  device,
  profile,
  tone = 'ATTRACTIVE',
  customInstructions = '',
  keyOverride = null
}) {
  const apiKey = keyOverride || getGeminiApiKey();
  if (!apiKey) {
    throw new Error('کلید اختصاصی Gemini API وارد نشده است. لطفاً ابتدا کلید خود را تنظیم کنید.');
  }

  const systemInstruction = `شما یک کارشناس ارشد و کپی‌رایتر حرفه‌ای فروش ماشین‌آلات صنعتی و صنایع چوب در ایران هستید که برای «شرکت گروه صنعتی آرسی (RCG) | نمایندگی پایون» کپشن‌های تبلیغاتی و فروش تولید می‌کنید.
وظیفه شما:
۱. مشخصات فنی، مشخصات مالی (قیمت، پیش‌پرداخت، اقساط، چک) و وضعیت دستگاه‌های استخراج‌شده از اکسل را به یک متن کپشن فروش بی‌نقص، جذاب، روان و کاملاً فارسی تبدیل کنید.
۲. مشخصات فنی را به صورت بولت‌پوینت‌های تمیز، مهندسی و جذاب دسته‌بندی و نگارش کنید.
۳. در انتهای کپشن اطلاعات شرکت فروشنده را درج کنید:
   - نام: ${profile?.businessName || 'شرکت گروه صنعتی آرسی (RCG) | راه‌حل یکپارچه ماشین‌ابزار صنعت چوب'}
   - آدرس: ${profile?.address || 'گیلان | رشت | بلوار امام رضا | نمایندگی پایون'}
   - وبسایت / لینک خدمات: ${profile?.website || 'https://zil.ink/rcg-group'}
   ${profile?.phone1 ? `- تلفن تماس: ${profile.phone1}` : ''}
   ${profile?.phone2 ? `- تلفن دفتر: ${profile.phone2}` : ''}
   ${profile?.whatsappNumber ? `- واتساپ: ${profile.whatsappNumber}` : ''}
   ${profile?.eitaaId ? `- ایتا: ${profile.eitaaId}` : ''}
   ${profile?.telegramId ? `- تلگرام: ${profile.telegramId}` : ''}
   ${profile?.baleId ? `- بله: ${profile.baleId}` : ''}
   ${profile?.footerNote ? `- یادداشت: ${profile.footerNote}` : ''}
۴. کپشن باید آماده انتشار در کانال‌های پیام‌رسان (ایتا، بله، تلگرام، واتساپ) باشد. هیچ توضیح اضافه یا مقدمه انگلیسی ننویسید؛ فقط متن نهایی کپشن را ارائه دهید.`;

  const userPrompt = `لطفاً برای دستگاه زیر یک متن کپشن فروش بنویس:

مشخصات دستگاه:
- نام دستگاه: ${device.name || 'ماشین‌آلات صنعتی'}
- برند و مدل: ${device.model || 'نامشخص'}
- دسته‌بندی: ${device.category || 'صنعتی'}
- سال ساخت: ${device.year || 'نامشخص'}
- وضعیت دستگاه: ${device.condition || 'سالم و آماده به کار'}
- محل استقرار / شهر: ${device.location || 'گیلان، رشت'}
- قیمت کل: ${device.totalPrice || 'توافقی / استعلام تماس'}
- درصد پیش‌پرداخت نقدی: ${device.cashPercentage ? `${device.cashPercentage}٪` : 'توافقی'}
- تعداد اقساط: ${device.installmentMonths ? `${device.installmentMonths} ماهه` : 'توافقی'}
- توضیحات پرداخت و چک: ${device.installmentNote || 'اقساط با چک صیادی'}
- میزان گارانتی: ${device.warranty || 'گارانتی و خدمات پس از فروش'}
- مشخصات فنی کامل: ${device.specifications || 'کارکرد استاندارد، آماده تست و تحویل'}

سبک و لحن نگارش درخواستی:
${TONE_GUIDELINES[tone] || TONE_GUIDELINES.ATTRACTIVE}
${customInstructions ? `دستورات اختصاصی: ${customInstructions}` : ''}`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: 0.7,
        topP: 0.95
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `خطای هوش مصنوعی گوگل (${response.status})`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('پاسخ متنی از هوش مصنوعی دریافت نشد.');
  }

  return text.trim();
}

/**
 * تولید دسته‌ای کپشن‌ها با هوش مصنوعی برای لیستی از دستگاه‌ها
 */
export async function batchGenerateGeminiCaptions({
  devices,
  profile,
  tone = 'ATTRACTIVE',
  customInstructions = '',
  keyOverride = null,
  onProgress = null
}) {
  if (!devices || devices.length === 0) return [];
  const apiKey = keyOverride || getGeminiApiKey();
  if (!apiKey) {
    throw new Error('کلید API برای تولید دسته‌ای کپشن‌ها یافت نشد.');
  }

  const updatedDevices = [...devices];
  const total = updatedDevices.length;

  for (let i = 0; i < total; i++) {
    const dev = updatedDevices[i];
    if (onProgress) {
      onProgress({
        current: i + 1,
        total,
        currentDeviceName: dev.name || `دستگاه شماره ${i + 1}`,
        percentage: Math.round(((i + 1) / total) * 100)
      });
    }

    try {
      const caption = await callGeminiApi({
        device: dev,
        profile,
        tone,
        customInstructions,
        keyOverride: apiKey
      });

      updatedDevices[i] = {
        ...dev,
        customCaption: caption,
        isAiGenerated: true
      };
    } catch (err) {
      console.warn(`Error generating AI caption for ${dev.name || i}:`, err);
      // Keep original device if AI call fails for one item
    }

    // وقفه کوتاه بین درخواست‌ها جهت رعایت محدودیت نرخ درخواست API
    if (i < total - 1) {
      await new Promise(r => setTimeout(r, 350));
    }
  }

  return updatedDevices;
}
