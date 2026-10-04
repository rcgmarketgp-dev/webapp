package com.example.util

import com.example.data.model.Device
import com.example.data.model.SellerProfile

object CaptionGenerator {

    data class PaymentBreakdown(
        val totalPriceNum: Long?,
        val downPaymentAmount: Long?,
        val remainingAmount: Long?,
        val monthlyAmount: Long?,
        val formattedDownPayment: String,
        val formattedMonthly: String
    )

    fun calculatePayment(totalPriceStr: String, cashPercent: Int, months: Int): PaymentBreakdown {
        val digits = totalPriceStr.filter { it.isDigit() }
        val price = digits.toLongOrNull()

        if (price != null && price > 0 && cashPercent in 1..99 && months > 0) {
            val downPayment = (price * cashPercent) / 100
            val remaining = price - downPayment
            val monthly = remaining / months
            return PaymentBreakdown(
                totalPriceNum = price,
                downPaymentAmount = downPayment,
                remainingAmount = remaining,
                monthlyAmount = monthly,
                formattedDownPayment = String.format("%,d", downPayment) + " تومان",
                formattedMonthly = String.format("%,d", monthly) + " تومان"
            )
        }

        return PaymentBreakdown(
            totalPriceNum = price,
            downPaymentAmount = null,
            remainingAmount = null,
            monthlyAmount = null,
            formattedDownPayment = if (cashPercent > 0) "$cashPercent%" else "",
            formattedMonthly = if (months > 0) "$months قسط ماهیانه" else ""
        )
    }

    /**
     * Generates a complete persuasive sales caption for a device and seller profile
     */
    fun generateCaption(
        device: Device,
        profile: SellerProfile? = null,
        style: String = device.captionStyle
    ): String {
        val payment = calculatePayment(device.totalPrice, device.cashPercentage, device.installmentMonths)

        return when (style) {
            Device.STYLE_INDUSTRIAL -> buildIndustrialCaption(device, payment, profile)
            Device.STYLE_INSTALLMENT -> buildInstallmentCaption(device, payment, profile)
            Device.STYLE_COMPACT -> buildCompactCaption(device, payment, profile)
            else -> buildAttractiveCaption(device, payment, profile)
        }
    }

    private fun buildAttractiveCaption(
        device: Device,
        payment: PaymentBreakdown,
        profile: SellerProfile?
    ): String {
        return buildString {
            appendLine("📢 #فروش_ویژه_دستگاه")
            appendLine("⚙️ ${device.name.trim()}")
            if (device.model.isNotBlank()) {
                appendLine("🏷️ مدل / تیپ: ${device.model.trim()}")
            }
            if (device.year.isNotBlank()) {
                appendLine("📅 سال ساخت: ${device.year.trim()}")
            }
            if (device.condition.isNotBlank()) {
                appendLine("✨ وضعیت: ${device.condition.trim()}")
            }
            if (device.location.isNotBlank()) {
                appendLine("📍 محل بازدید: ${device.location.trim()}")
            }

            appendLine()
            appendLine("━━━━━━━━━━━━━━━━━━━")
            appendLine("📋 مشخصات فنی و امکانات:")
            if (device.specifications.isNotBlank()) {
                val specs = device.specifications.split("\n", "-", "•", ",")
                    .map { it.trim() }
                    .filter { it.isNotBlank() }
                if (specs.isNotEmpty()) {
                    specs.forEach { appendLine("🔹 $it") }
                } else {
                    appendLine("🔹 ${device.specifications}")
                }
            } else {
                appendLine("🔹 بسیار تمیز و با کارکرد کم، آماده به کار")
            }

            if (device.warranty.isNotBlank()) {
                appendLine("🛡️ گارانتی و خدمات: ${device.warranty.trim()}")
            }

            appendLine()
            appendLine("━━━━━━━━━━━━━━━━━━━")
            appendLine("💳 شرایط پرداخت و قیمت:")
            if (device.totalPrice.isNotBlank()) {
                appendLine("💰 قیمت کل: ${device.totalPrice.trim()}")
            }

            if (device.cashPercentage > 0 || device.installmentMonths > 0) {
                if (payment.downPaymentAmount != null) {
                    appendLine("💵 پیش‌پرداخت نقدی (${device.cashPercentage}٪): ${payment.formattedDownPayment}")
                } else if (device.cashPercentage > 0) {
                    appendLine("💵 پیش‌پرداخت نقدی: ${device.cashPercentage} درصد")
                }

                if (payment.monthlyAmount != null) {
                    appendLine("🗓️ شرایط اقساط: ${device.installmentMonths} قسط ماهیانه هر کدام ${payment.formattedMonthly}")
                } else if (device.installmentMonths > 0) {
                    appendLine("🗓️ شرایط اقساط: الباقی در ${device.installmentMonths} قسط ماهیانه")
                }

                if (device.installmentNote.isNotBlank()) {
                    appendLine("📝 شرایط چک: ${device.installmentNote.trim()}")
                }
            } else {
                appendLine("🤝 شرایط پرداخت: نقدی یا توافقی با مشتری")
            }

            appendProfileFooter(this, profile)
        }
    }

    private fun buildIndustrialCaption(
        device: Device,
        payment: PaymentBreakdown,
        profile: SellerProfile?
    ): String {
        return buildString {
            appendLine("اطلاعیه فروش ماشین‌آلات و تجهیزات صنعتی")
            appendLine("---------------------------------------")
            appendLine("دستگاه: ${device.name}")
            if (device.model.isNotBlank()) appendLine("مدل: ${device.model}")
            if (device.year.isNotBlank()) appendLine("سال ساخت: ${device.year}")
            if (device.condition.isNotBlank()) appendLine("وضعیت کارکرد: ${device.condition}")
            if (device.location.isNotBlank()) appendLine("موقعیت استقرار: ${device.location}")
            appendLine("---------------------------------------")
            appendLine("مشخصات و ویژگی‌های فنی:")
            appendLine(device.specifications.ifBlank { "مشخصات استاندارد کارخانه، کارکرد سالم و بدون عیب" })
            if (device.warranty.isNotBlank()) {
                appendLine("تعهدات و گارانتی: ${device.warranty}")
            }
            appendLine("---------------------------------------")
            appendLine("شرایط واگذاری و تسویه:")
            if (device.totalPrice.isNotBlank()) appendLine("مبلغ کل: ${device.totalPrice}")
            if (device.cashPercentage > 0) {
                val downText = if (payment.downPaymentAmount != null) payment.formattedDownPayment else "${device.cashPercentage}%"
                appendLine("درصد پرداخت نقدی: $downText")
            }
            if (device.installmentMonths > 0) {
                val monthlyText = if (payment.monthlyAmount != null) " (هر قسط: ${payment.formattedMonthly})" else ""
                appendLine("تسهیلات اقساط: ${device.installmentMonths} ماهه$monthlyText")
            }
            if (device.installmentNote.isNotBlank()) {
                appendLine("توضیحات مالی: ${device.installmentNote}")
            }
            appendProfileFooter(this, profile)
        }
    }

    private fun buildInstallmentCaption(
        device: Device,
        payment: PaymentBreakdown,
        profile: SellerProfile?
    ): String {
        return buildString {
            appendLine("🔥 فرصت ویژه خرید اقساطی ماشین‌آلات")
            appendLine("⚡ بدون بهره، با کمترین پیش‌پرداخت!")
            appendLine()
            appendLine("💎 ${device.name}")
            if (device.model.isNotBlank()) appendLine("🔹 مدل: ${device.model}")
            if (device.year.isNotBlank()) appendLine("🔹 سال ساخت: ${device.year}")
            appendLine()
            appendLine("🎯 جدول اقساط و پرداخت آسان:")
            if (device.totalPrice.isNotBlank()) {
                appendLine("▫️ ارزش دستگاه: ${device.totalPrice}")
            }
            if (device.cashPercentage > 0) {
                val down = if (payment.downPaymentAmount != null) "${payment.formattedDownPayment} (${device.cashPercentage}٪)" else "${device.cashPercentage}٪"
                appendLine("▫️ پیش‌پرداخت: فقط $down")
            }
            if (device.installmentMonths > 0) {
                val installment = if (payment.monthlyAmount != null) "${payment.formattedMonthly} در ماه" else "طی ${device.installmentMonths} ماه"
                appendLine("▫️ مابقی مبلغ: طی ${device.installmentMonths} قسط ماهیانه ($installment)")
            }
            if (device.installmentNote.isNotBlank()) {
                appendLine("▫️ نحوه تسویه: ${device.installmentNote}")
            }
            if (device.warranty.isNotBlank()) {
                appendLine("🛡️ همراه با: ${device.warranty}")
            }
            appendLine()
            appendLine("📌 مشخصات فنی: ${device.specifications.ifBlank { "کارکرد عالی، آماده تحویل و تست" }}")
            if (device.location.isNotBlank()) appendLine("📍 محل بازدید: ${device.location}")

            appendProfileFooter(this, profile)
        }
    }

    private fun buildCompactCaption(
        device: Device,
        payment: PaymentBreakdown,
        profile: SellerProfile?
    ): String {
        return buildString {
            appendLine("📌 ${device.name} ${if (device.model.isNotBlank()) "| مدل ${device.model}" else ""}")
            if (device.year.isNotBlank()) appendLine("▫️ سال ساخت: ${device.year}")
            if (device.condition.isNotBlank()) appendLine("▫️ وضعیت: ${device.condition}")
            if (device.totalPrice.isNotBlank()) appendLine("▫️ قیمت: ${device.totalPrice}")
            if (device.cashPercentage > 0 || device.installmentMonths > 0) {
                val down = if (payment.downPaymentAmount != null) payment.formattedDownPayment else "${device.cashPercentage}%"
                appendLine("▫️ شرایط: $down نقدی + ${device.installmentMonths} قسط")
            }
            if (device.warranty.isNotBlank()) appendLine("▫️ گارانتی: ${device.warranty}")
            if (device.specifications.isNotBlank()) appendLine("▫️ جزییات: ${device.specifications.take(120)}...")
            appendProfileFooter(this, profile, compact = true)
        }
    }

    private fun appendProfileFooter(sb: StringBuilder, profile: SellerProfile?, compact: Boolean = false) {
        if (profile == null) return

        sb.appendLine()
        sb.appendLine("━━━━━━━━━━━━━━━━━━━")
        if (profile.businessName.isNotBlank()) {
            sb.appendLine("🏢 ${profile.businessName}")
        }
        sb.appendLine("📞 جهت مشاوره، استعلام قیمت و خرید:")
        if (profile.phone1.isNotBlank()) sb.appendLine("📲 تماس: ${profile.phone1}")
        if (profile.phone2.isNotBlank()) sb.appendLine("☎️ دفتر: ${profile.phone2}")

        val messengers = mutableListOf<String>()
        if (profile.eitaaId.isNotBlank()) messengers.add("ایتا: ${profile.eitaaId}")
        if (profile.baleId.isNotBlank()) messengers.add("بله: ${profile.baleId}")
        if (profile.telegramId.isNotBlank()) messengers.add("تلگرام: ${profile.telegramId}")
        if (profile.whatsappNumber.isNotBlank()) messengers.add("واتساپ: ${profile.whatsappNumber}")
        if (profile.instagramId.isNotBlank()) messengers.add("اینستاگرام: ${profile.instagramId}")

        if (messengers.isNotEmpty()) {
            sb.appendLine("💬 ارتباط در پیام‌رسان‌ها:")
            messengers.forEach { sb.appendLine("🔸 $it") }
        }

        if (profile.address.isNotBlank()) {
            sb.appendLine("📍 آدرس: ${profile.address}")
        }

        if (!compact && profile.footerNote.isNotBlank()) {
            sb.appendLine()
            sb.appendLine("✨ ${profile.footerNote}")
        }
    }
}
