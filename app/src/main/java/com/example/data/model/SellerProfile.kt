package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "seller_profile")
data class SellerProfile(
    @PrimaryKey
    val id: Int = 1,
    val businessName: String = "ماشین‌آلات و تجهیزات صنعتی",
    val phone1: String = "",
    val phone2: String = "",
    val whatsappNumber: String = "",
    val telegramId: String = "",
    val eitaaId: String = "",
    val baleId: String = "",
    val instagramId: String = "",
    val address: String = "",
    val footerNote: String = "امکان تست سلامت و بازدید فنی حضوری با هماهنگی قبلی | ارسال و راه‌اندازی در سراسر کشور"
)
