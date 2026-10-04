export const WOOD_CATEGORIES = [
  { id: 'saw', name: 'دستگاه‌های برش و دورکن', icon: '🪚', color: 'from-amber-500 to-orange-600', description: 'انواع دورکن دستی، زاویه‌خور، خط‌زن‌دار و پانل‌بر صنعتی' },
  { id: 'edgebander', name: 'دستگاه‌های لبه‌چسبان', icon: '🪵', color: 'from-blue-500 to-indigo-600', description: 'لبه‌چسبان ۴ تا ۹ ایستگاه، پیش‌فرز، کرنر، شیارزن و پولیش' },
  { id: 'cnc', name: 'سی‌ان‌سی چوب و نستینگ', icon: '⚙️', color: 'from-purple-500 to-violet-600', description: 'انواع CNC سه محور، چهار محور، مته‌خور، روتاری و خطوط نستینگ اتوماتیک' },
  { id: 'drilling', name: 'سوراخ‌کاری و الیت زن', icon: '🕳️', color: 'from-emerald-500 to-teal-600', description: 'دستگاه‌های سوراخ‌زن افقی، عمودی، الیت و لولا زن پی‌وی‌سی' },
  { id: 'vacuum_press', name: 'پرس وکیوم، ممبران و پرس گرم', icon: '✨', color: 'from-rose-500 to-pink-600', description: 'وکیوم تک‌سینی، دوسینی، ممبران و پرس گرم روکش چوب' },
  { id: 'sanding', name: 'سنباده نواری، براش و گندگی', icon: '📐', color: 'from-yellow-500 to-amber-600', description: 'دستگاه‌های سنباده کالیبر، براشینگ، کف‌رند، گندگی و اورفرز' },
  { id: 'dust_collector', name: 'سیستم‌های مکنده و تصفیه هوا', icon: '🌀', color: 'from-cyan-500 to-blue-600', description: 'مکنده‌های دوقلو، چهارقلو، سیکلون و فیلتراسیون مرکزی کارگاهی' },
  { id: 'other', name: 'سایر ماشین‌آلات و خطوط تولید', icon: '🏭', color: 'from-slate-500 to-slate-750', description: 'انواع ماشین‌ابزار و تجهیزات جانبی کارخانجات صنایع چوب' }
];

export function getCategoryById(id) {
  return WOOD_CATEGORIES.find(c => c.id === id) || WOOD_CATEGORIES[WOOD_CATEGORIES.length - 1];
}
