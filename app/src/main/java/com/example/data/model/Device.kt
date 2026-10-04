package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import org.json.JSONArray

@Entity(tableName = "devices")
data class Device(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val model: String = "",
    val year: String = "",
    val totalPrice: String = "",
    val cashPercentage: Int = 0,
    val installmentMonths: Int = 0,
    val installmentNote: String = "",
    val specifications: String = "",
    val warranty: String = "",
    val condition: String = "کارکرده تمیز",
    val location: String = "",
    val imageUrisJson: String = "[]",
    val captionStyle: String = "ATTRACTIVE",
    val customCaption: String = "",
    val status: String = STATUS_ACTIVE,
    val isIncomplete: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
) {
    companion object {
        const val STATUS_ACTIVE = "ACTIVE"
        const val STATUS_SOLD = "SOLD"
        const val STATUS_ARCHIVED = "ARCHIVED"

        const val STYLE_ATTRACTIVE = "ATTRACTIVE" // جذاب و ایموجی‌دار
        const val STYLE_INDUSTRIAL = "INDUSTRIAL" // رسمی و فنی صنعتی
        const val STYLE_INSTALLMENT = "INSTALLMENT" // تمرکز بر شرایط اقساطی
        const val STYLE_COMPACT = "COMPACT" // کاتالوگی و کوتاه
    }

    fun getImageList(): List<String> {
        return try {
            val jsonArray = JSONArray(imageUrisJson)
            val list = mutableListOf<String>()
            for (i in 0 until jsonArray.length()) {
                val item = jsonArray.optString(i)
                if (item.isNotBlank()) list.add(item)
            }
            list
        } catch (_: Exception) {
            emptyList()
        }
    }

    fun withImageList(list: List<String>): Device {
        val jsonArray = JSONArray()
        list.forEach { jsonArray.put(it) }
        return this.copy(imageUrisJson = jsonArray.toString())
    }

    /**
     * Checks if this device has incomplete fields
     */
    fun checkIncomplete(): Boolean {
        return name.isBlank() ||
                model.isBlank() ||
                year.isBlank() ||
                totalPrice.isBlank() ||
                (cashPercentage <= 0 && installmentMonths <= 0) ||
                warranty.isBlank() ||
                specifications.isBlank() ||
                getImageList().isEmpty()
    }
}
