package com.example.util

import com.example.data.model.Device
import com.example.data.model.SellerProfile

object SampleData {

    val sampleDevices = listOf(
        Device(
            name = "دستگاه تراش CNC سه محور",
            model = "CK6140 / Siemens 808D",
            year = "۱۴۰۲",
            totalPrice = "۸۵۰,۰۰۰,۰۰۰ تومان",
            cashPercentage = 40,
            installmentMonths = 10,
            installmentNote = "اقساط ماهیانه با چک صیادی بنفش بدون کارمزد",
            warranty = "۱۲ ماه گارانتی بی قید و شرط قطعات + ۱۰ سال پشتیبانی فنی",
            specifications = "حداکثر قطر چرخش روی بستر: ۴۰۰ میلی‌متر\nطول کارگیر: ۱۰۰۰ میلی‌متر\nسیستم کنترل: زیمنس 808D Advance\nتارت هیدرولیک ۶ ابزار، مجهز به مرغک هیدرولیک و کانوایر براده",
            condition = "صفر / آکبند",
            location = "تهران، شهرک صنعتی شمس‌آباد",
            captionStyle = Device.STYLE_ATTRACTIVE
        ),
        Device(
            name = "فرز CNC عمودی چهاره محور",
            model = "VMC 850 / Fanuc 0i-MF",
            year = "۱۴۰۱",
            totalPrice = "۱,۶۵۰,۰۰۰,۰۰۰ تومان",
            cashPercentage = 50,
            installmentMonths = 12,
            installmentNote = "۵۰ درصد نقد، الباقی ۱۲ قسط ماهیانه با چک صیاد",
            warranty = "۶ ماه گارانتی مکانیکال و تست دقت در محل خریدار",
            specifications = "کورس محور X: ۸۵۰ میلی‌متر | Y: ۵۰۰ میلی‌متر | Z: ۵۵۰ میلی‌متر\nاسپیندل: ۱۰,۰۰۰ دور تسمه‌ای تایوان BT40\nتعویض ابزار: چتری ۲۴ تایی برند شیندا\nلاینر ریل تایوان محورهای X و Y و باکس ریل Z",
            condition = "در حد نو (کم‌کارکرد)",
            location = "اصفهان، شهرک صنعتی محمودآباد",
            captionStyle = Device.STYLE_ATTRACTIVE
        ),
        Device(
            name = "دستگاه تزریق پلاستیک ۱۶۰ تن",
            model = "HAIXING 160T Servo",
            year = "۲۰۲۲",
            totalPrice = "۹۲۰,۰۰۰,۰۰۰ تومان",
            cashPercentage = 35,
            installmentMonths = 8,
            installmentNote = "۳۵ درصد نقد، الباقی ۸ فقره چک ماه به ماه",
            warranty = "۱ سال ضمانت پمپ و سیستم هیدرولیک و سروو درایو",
            specifications = "قدرت گیره: ۱۶۰ تن\nفاصله بین میل راهنماها: ۴۶۰×۴۶۰ میلی‌متر\nوزن تزریق: ۳۲۰ گرم (PS)\nسیستم کنترل کامپیوتری Techmation تایوان با موتور سروو کم‌مصرف",
            condition = "کارکرده بسیار تمیز",
            location = "تبریز، شهرک صنعتی رجایی",
            captionStyle = Device.STYLE_INSTALLMENT
        ),
        Device(
            name = "دستگاه برش لیزر فایبر فلزات ۳ کیلووات",
            model = "Fiber Laser 3000W Raycus",
            year = "۱۴۰۲",
            totalPrice = "۱,۴۵۰,۰۰۰,۰۰۰ تومان",
            cashPercentage = 45,
            installmentMonths = 12,
            installmentNote = "پیش‌پرداخت ۴۵ درصد، الباقی تا ۱۲ ماه اقساط",
            warranty = "۲ سال گارانتی رسمی منبع لیزر (سورس) و چیلر خنک‌کننده",
            specifications = "سورس فایبر: Raycus 3000W اورجینال\nابعاد میز برش: ۱۵۰۰×۳۰۰۰ میلی‌متر با میز تعویض سریع (پالت)\nهد برش اتوفوکوس Boci با محافظ دما\nچیلر دو مداره صنعتی S&A\nسروو موتورهای یاسکاوا ژاپن",
            condition = "صفر / آماده تحویل",
            location = "البرز، شهرک صنعتی کمالشهر",
            captionStyle = Device.STYLE_ATTRACTIVE
        ),
        Device(
            name = "پرس برک CNC هیدرولیک ۱۰۰ تن",
            model = "Delem DA53T 100T 3200mm",
            year = "۲۰۲۱",
            totalPrice = "۷۸۰,۰۰۰,۰۰۰ تومان",
            cashPercentage = 30,
            installmentMonths = 6,
            installmentNote = "۳۰ درصد نقدی الباقی طی ۶ ماه چک صیادی",
            warranty = "۹ ماه گارانتی هیدرولیک و آب‌بندی جک‌ها",
            specifications = "طول میز خم: ۳۲۰۰ میلی‌متر\nنیروی اسمی خمکاری: ۱۰۰ تن\nکنترلر لمسی دیلم هلند مدل DA53T گرافیکی ۴ محور\nفوتوسل ایمنی اپتیکال جلو و عقب اپراتور",
            condition = "در حد نو",
            location = "مشهد، شهرک صنعتی توس",
            captionStyle = Device.STYLE_INDUSTRIAL
        ),
        // An incomplete device to demonstrate the incomplete warning & manual completion feature
        Device(
            name = "دستگاه وکیوم فرمینگ حرارتی",
            model = "VF-1200",
            year = "۱۴۰۰",
            totalPrice = "", // Incomplete
            cashPercentage = 0,
            installmentMonths = 0,
            installmentNote = "",
            warranty = "", // Incomplete
            specifications = "ابعاد المنت ۱۲۰ در ۱۲۰، پمپ وکیوم روغنی",
            condition = "کارکرده",
            location = "تهران",
            isIncomplete = true,
            captionStyle = Device.STYLE_ATTRACTIVE
        )
    )

    val defaultProfile = SellerProfile(
        id = 1,
        businessName = "بازرگانی ماشین‌آلات و تجهیزات صنعتی نوین",
        phone1 = "09121234567",
        phone2 = "02155667788",
        whatsappNumber = "09121234567",
        telegramId = "@NovinMachinery",
        eitaaId = "@NovinMachinery_ir",
        baleId = "@NovinMachinery",
        instagramId = "novin_machinery",
        address = "تهران، کیلومتر ۲۰ جاده مخصوص کرج، روبروی شهرک صنعتی",
        footerNote = "⚡ تمامی دستگاه‌ها قبل از تحویل با حضور خریدار محترم تست و راه‌اندازی می‌شوند."
    )
}
