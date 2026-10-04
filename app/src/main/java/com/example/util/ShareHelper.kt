package com.example.util

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.widget.Toast
import androidx.core.content.FileProvider
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.util.UUID

object ShareHelper {

    enum class TargetMessenger(
        val title: String,
        val packageName: String?,
        val iconResId: Int? = null
    ) {
        ALL("اشتراک‌گذاری در همه برنامه‌ها", null),
        BALE("پیام‌رسان بله", "ir.nasim"),
        EITAA("پیام‌رسان ایتا", "ir.eitaa.messenger"),
        WHATSAPP("واتساپ", "com.whatsapp"),
        TELEGRAM("تلگرام", "org.telegram.messenger"),
        RUBIKA("روبیکا", "ir.resaneh1.iptv")
    }

    fun isAppInstalled(context: Context, packageName: String): Boolean {
        return try {
            context.packageManager.getPackageInfo(packageName, PackageManager.GET_ACTIVITIES)
            true
        } catch (_: Exception) {
            false
        }
    }

    /**
     * Copies a picked Uri into internal device_images storage and returns the local file path/Uri string
     */
    fun saveImageToInternalStorage(context: Context, sourceUri: Uri): String? {
        return try {
            val imagesDir = File(context.filesDir, "device_images")
            if (!imagesDir.exists()) imagesDir.mkdirs()

            val fileName = "img_${System.currentTimeMillis()}_${UUID.randomUUID().toString().take(6)}.jpg"
            val destFile = File(imagesDir, fileName)

            context.contentResolver.openInputStream(sourceUri)?.use { input ->
                FileOutputStream(destFile).use { output ->
                    input.copyTo(output)
                }
            }
            destFile.absolutePath
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Prepares FileProvider Uris from local file paths or content Uris
     */
    fun prepareShareableUris(context: Context, imagePaths: List<String>): ArrayList<Uri> {
        val uris = ArrayList<Uri>()
        val cacheDir = File(context.cacheDir, "shared_images")
        if (!cacheDir.exists()) cacheDir.mkdirs()

        for (path in imagePaths) {
            try {
                val file = if (path.startsWith("/")) {
                    File(path)
                } else if (path.startsWith("file://")) {
                    File(Uri.parse(path).path ?: "")
                } else if (path.startsWith("content://")) {
                    // Copy content uri to cache
                    val tempFile = File(cacheDir, "share_${System.currentTimeMillis()}_${UUID.randomUUID().toString().take(5)}.jpg")
                    context.contentResolver.openInputStream(Uri.parse(path))?.use { input ->
                        FileOutputStream(tempFile).use { output ->
                            input.copyTo(output)
                        }
                    }
                    tempFile
                } else {
                    File(path)
                }

                if (file.exists() && file.length() > 0) {
                    val uri = FileProvider.getUriForFile(
                        context,
                        "${context.packageName}.fileprovider",
                        file
                    )
                    uris.add(uri)
                }
            } catch (_: Exception) {}
        }
        return uris
    }

    /**
     * Shares caption and photos to a messenger or general chooser
     */
    fun shareDevice(
        context: Context,
        caption: String,
        imagePaths: List<String>,
        target: TargetMessenger = TargetMessenger.ALL
    ) {
        val uris = prepareShareableUris(context, imagePaths)

        val intent = when {
            uris.isEmpty() -> {
                Intent(Intent.ACTION_SEND).apply {
                    type = "text/plain"
                    putExtra(Intent.EXTRA_TEXT, caption)
                }
            }
            uris.size == 1 -> {
                Intent(Intent.ACTION_SEND).apply {
                    type = "image/*"
                    putExtra(Intent.EXTRA_STREAM, uris[0])
                    putExtra(Intent.EXTRA_TEXT, caption)
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }
            }
            else -> {
                Intent(Intent.ACTION_SEND_MULTIPLE).apply {
                    type = "image/*"
                    putParcelableArrayListExtra(Intent.EXTRA_STREAM, uris)
                    putExtra(Intent.EXTRA_TEXT, caption)
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }
            }
        }

        // Target specific package if chosen
        if (target.packageName != null) {
            if (isAppInstalled(context, target.packageName)) {
                intent.setPackage(target.packageName)
                try {
                    context.startActivity(intent)
                    return
                } catch (_: Exception) {
                    // Fallback to chooser if direct package launch failed
                }
            } else {
                Toast.makeText(context, "${target.title} روی دستگاه شما نصب نیست.", Toast.LENGTH_SHORT).show()
                return
            }
        }

        val chooser = Intent.createChooser(intent, "ارسال به کانال یا گروه...")
        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(chooser)
    }

    fun copyToClipboard(context: Context, text: String, label: String = "کپشن دستگاه") {
        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val clip = ClipData.newPlainText(label, text)
        clipboard.setPrimaryClip(clip)
        Toast.makeText(context, "متن کپشن با موفقیت کپی شد ✓", Toast.LENGTH_SHORT).show()
    }
}
