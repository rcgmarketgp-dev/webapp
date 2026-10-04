package com.example.util

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Environment
import androidx.core.content.ContextCompat
import com.example.data.model.Device
import java.io.File
import java.io.FileOutputStream

object StoragePermissionHelper {

    data class FolderCreationResult(
        val success: Boolean,
        val folderCount: Int,
        val basePath: String,
        val message: String
    )

    /**
     * Determines which storage permissions are required based on the Android API version
     */
    fun getRequiredStoragePermissions(): Array<String> {
        return when {
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU -> {
                arrayOf(Manifest.permission.READ_MEDIA_IMAGES)
            }
            Build.VERSION.SDK_INT <= Build.VERSION_CODES.P -> {
                arrayOf(
                    Manifest.permission.READ_EXTERNAL_STORAGE,
                    Manifest.permission.WRITE_EXTERNAL_STORAGE
                )
            }
            else -> {
                arrayOf(
                    Manifest.permission.READ_EXTERNAL_STORAGE,
                    Manifest.permission.WRITE_EXTERNAL_STORAGE
                )
            }
        }
    }

    /**
     * Checks if all required storage permissions have been granted by the user
     */
    fun hasStoragePermission(context: Context): Boolean {
        val permissions = getRequiredStoragePermissions()
        return permissions.all { perm ->
            ContextCompat.checkSelfPermission(context, perm) == PackageManager.PERMISSION_GRANTED
        }
    }

    /**
     * Resolves the best available directory for storing local device folders
     */
    fun getBaseStorageDirectory(context: Context): File {
        return try {
            val extFiles = context.getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS) ?: context.filesDir
            File(extFiles, "MachineryFolders").apply {
                if (!exists()) {
                    mkdirs()
                }
            }
        } catch (e: Exception) {
            File(context.filesDir, "MachineryFolders").apply {
                if (!exists()) {
                    mkdirs()
                }
            }
        }
    }

    /**
     * Creates a clean sanitized folder name for a device
     */
    fun getDeviceFolderName(device: Device): String {
        val cleanName = device.name.replace("[\\\\/:*?\"<>|]".toRegex(), "-").trim()
        val cleanModel = device.model.replace("[\\\\/:*?\"<>|]".toRegex(), "-").trim()
        return if (cleanModel.isNotBlank() && cleanModel != "-") {
            "$cleanName - $cleanModel"
        } else {
            cleanName
        }.take(70)
    }

    /**
     * Creates local folders for all given devices in device storage
     */
    fun createLocalDeviceFolders(context: Context, devices: List<Device>): FolderCreationResult {
        if (devices.isEmpty()) {
            return FolderCreationResult(
                success = false,
                folderCount = 0,
                basePath = "",
                message = "هیچ دستگاهی در لیست جهت ساخت پوشه وجود ندارد."
            )
        }

        return try {
            val baseDir = getBaseStorageDirectory(context)
            if (!baseDir.exists()) {
                baseDir.mkdirs()
            }

            var createdCount = 0

            for (dev in devices) {
                val folderName = getDeviceFolderName(dev)
                val deviceDir = File(baseDir, folderName)
                if (!deviceDir.exists()) {
                    deviceDir.mkdirs()
                }

                // نوشتن فایل مشخصات دستگاه درون پوشه
                try {
                    val specsFile = File(deviceDir, "مشخصات_دستگاه.txt")
                    var specs = "=========================================\r\n"
                    specs += "مشخصات دستگاه - گروه صنعتی آرسی\r\n"
                    specs += "=========================================\r\n"
                    specs += "نام دستگاه: ${dev.name}\r\n"
                    specs += "مدل و تیپ: ${dev.model}\r\n"
                    specs += "دسته بندی: ${dev.category}\r\n"
                    specs += "سال ساخت: ${dev.year}\r\n"
                    specs += "قیمت کل: ${dev.totalPrice}\r\n"
                    specs += "پیش پرداخت: ${dev.cashPercentage}٪\r\n"
                    specs += "اقساط: ${dev.installmentMonths} ماهه\r\n"
                    specs += "شرایط چک: ${dev.installmentNote}\r\n"
                    specs += "وضعیت: ${dev.condition}\r\n"
                    specs += "محل: ${dev.location}\r\n\r\n"
                    specs += "مشخصات فنی:\r\n${dev.specifications}\r\n\r\n"
                    if (dev.customCaption.isNotBlank()) {
                        specs += "کپشن فروش:\r\n${dev.customCaption}\r\n"
                    }

                    specsFile.writeText(specs, Charsets.UTF_8)
                } catch (_: Exception) {}

                // کپی کردن عکس‌های ذخیره‌شده دستگاه در این پوشه
                val images = dev.getImageList()
                images.forEachIndexed { index, path ->
                    try {
                        val srcFile = File(path)
                        if (srcFile.exists()) {
                            val destImage = File(deviceDir, "عکس_${index + 1}.jpg")
                            srcFile.copyTo(destImage, overwrite = true)
                        } else if (path.startsWith("content://")) {
                            val destImage = File(deviceDir, "عکس_${index + 1}.jpg")
                            context.contentResolver.openInputStream(Uri.parse(path))?.use { input ->
                                FileOutputStream(destImage).use { output ->
                                    input.copyTo(output)
                                }
                            }
                        }
                    } catch (_: Exception) {}
                }

                createdCount++
            }

            FolderCreationResult(
                success = true,
                folderCount = createdCount,
                basePath = baseDir.absolutePath,
                message = "تعداد $createdCount پوشه به نام دستگاه‌ها در مسیر ${baseDir.name} با موفقیت ایجاد شد."
            )
        } catch (e: Exception) {
            FolderCreationResult(
                success = false,
                folderCount = 0,
                basePath = "",
                message = "خطا در ایجاد پوشه‌ها: ${e.message}"
            )
        }
    }

    /**
     * Creates a folder for a single device
     */
    fun createSingleDeviceFolder(context: Context, device: Device): File? {
        return try {
            val baseDir = getBaseStorageDirectory(context)
            val folderName = getDeviceFolderName(device)
            val deviceDir = File(baseDir, folderName)
            if (!deviceDir.exists()) {
                deviceDir.mkdirs()
            }
            deviceDir
        } catch (_: Exception) {
            null
        }
    }
}
