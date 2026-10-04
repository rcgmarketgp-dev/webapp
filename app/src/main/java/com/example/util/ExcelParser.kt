package com.example.util

import android.content.Context
import android.net.Uri
import com.example.data.model.Device
import org.xmlpull.v1.XmlPullParser
import org.xmlpull.v1.XmlPullParserFactory
import java.io.BufferedReader
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.InputStream
import java.io.InputStreamReader
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream

object ExcelParser {

    data class ParseResult(
        val devices: List<Device>,
        val totalRows: Int,
        val detectedColumns: List<String>,
        val errorMessage: String? = null
    )

    /**
     * Parses an uploaded file (either .xlsx, .xls, or .csv) from Uri
     */
    fun parseFile(context: Context, uri: Uri): ParseResult {
        return try {
            val contentResolver = context.contentResolver
            val mimeType = contentResolver.getType(uri) ?: ""
            val fileName = getFileName(context, uri).lowercase()

            val bytes = contentResolver.openInputStream(uri)?.use { it.readBytes() }
                ?: return ParseResult(emptyList(), 0, emptyList(), "امکان خواندن فایل وجود ندارد.")

            if (fileName.endsWith(".csv") || mimeType.contains("csv") || mimeType.contains("text")) {
                parseCsv(bytes)
            } else {
                // Try XLSX first
                try {
                    parseXlsx(bytes)
                } catch (e: Exception) {
                    // Fallback to CSV if zip extraction failed (e.g. file is mislabeled or CSV)
                    try {
                        parseCsv(bytes)
                    } catch (_: Exception) {
                        ParseResult(emptyList(), 0, emptyList(), "خطا در خواندن فایل اکسل: ${e.localizedMessage ?: "فرمت نامعتبر"}")
                    }
                }
            }
        } catch (e: Exception) {
            ParseResult(emptyList(), 0, emptyList(), "خطا در پردازش فایل: ${e.localizedMessage ?: "نامشخص"}")
        }
    }

    private fun getFileName(context: Context, uri: Uri): String {
        var name = "file.xlsx"
        context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val nameIndex = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
            if (nameIndex != -1 && cursor.moveToFirst()) {
                name = cursor.getString(nameIndex) ?: name
            }
        }
        return name
    }

    /**
     * Parse OpenXML Excel (.xlsx) file using standard ZipInputStream and XmlPullParser
     */
    fun parseXlsx(bytes: ByteArray): ParseResult {
        var sharedStrings = listOf<String>()
        var sheetBytes: ByteArray? = null

        // 1. Read ZIP entries
        ZipInputStream(ByteArrayInputStream(bytes)).use { zis ->
            var entry: ZipEntry? = zis.nextEntry
            while (entry != null) {
                when {
                    entry.name.equals("xl/sharedStrings.xml", ignoreCase = true) -> {
                        val buffer = ByteArrayOutputStream()
                        zis.copyTo(buffer)
                        sharedStrings = parseSharedStrings(buffer.toByteArray())
                    }
                    entry.name.equals("xl/worksheets/sheet1.xml", ignoreCase = true) ||
                            (entry.name.startsWith("xl/worksheets/sheet", ignoreCase = true) && sheetBytes == null) -> {
                        val buffer = ByteArrayOutputStream()
                        zis.copyTo(buffer)
                        sheetBytes = buffer.toByteArray()
                    }
                }
                zis.closeEntry()
                entry = zis.nextEntry
            }
        }

        if (sheetBytes == null) {
            return ParseResult(emptyList(), 0, emptyList(), "برگه اکسل (Sheet) در فایل یافت نشد.")
        }

        // 2. Parse sheet XML into raw rows
        val rawRows = parseSheetXml(sheetBytes, sharedStrings)
        if (rawRows.isEmpty()) {
            return ParseResult(emptyList(), 0, emptyList(), "فایل اکسل خالی است.")
        }

        // 3. Map rows to Devices
        return mapRowsToDevices(rawRows)
    }

    private fun parseSharedStrings(xmlBytes: ByteArray): List<String> {
        val strings = mutableListOf<String>()
        val factory = XmlPullParserFactory.newInstance()
        val parser = factory.newPullParser()
        parser.setInput(ByteArrayInputStream(xmlBytes), "UTF-8")

        var eventType = parser.eventType
        var currentText = StringBuilder()
        var insideSi = false
        var insideT = false

        while (eventType != XmlPullParser.END_DOCUMENT) {
            when (eventType) {
                XmlPullParser.START_TAG -> {
                    when (parser.name) {
                        "si" -> {
                            insideSi = true
                            currentText = StringBuilder()
                        }
                        "t" -> insideT = true
                    }
                }
                XmlPullParser.TEXT -> {
                    if (insideSi && insideT) {
                        currentText.append(parser.text)
                    }
                }
                XmlPullParser.END_TAG -> {
                    when (parser.name) {
                        "t" -> insideT = false
                        "si" -> {
                            insideSi = false
                            strings.add(currentText.toString())
                        }
                    }
                }
            }
            eventType = parser.next()
        }
        return strings
    }

    private fun parseSheetXml(xmlBytes: ByteArray, sharedStrings: List<String>): List<Map<Int, String>> {
        val rows = mutableListOf<Map<Int, String>>()
        val factory = XmlPullParserFactory.newInstance()
        val parser = factory.newPullParser()
        parser.setInput(ByteArrayInputStream(xmlBytes), "UTF-8")

        var eventType = parser.eventType
        var currentRowMap = mutableMapOf<Int, String>()
        var currentCellCol = -1
        var currentCellType = ""
        var cellText = StringBuilder()
        var insideV = false
        var insideT = false

        while (eventType != XmlPullParser.END_DOCUMENT) {
            when (eventType) {
                XmlPullParser.START_TAG -> {
                    when (parser.name) {
                        "row" -> {
                            currentRowMap = mutableMapOf()
                        }
                        "c" -> {
                            currentCellType = parser.getAttributeValue(null, "t") ?: ""
                            val cellRef = parser.getAttributeValue(null, "r") ?: ""
                            currentCellCol = columnRefToIndex(cellRef)
                            cellText = StringBuilder()
                        }
                        "v" -> insideV = true
                        "t" -> insideT = true
                    }
                }
                XmlPullParser.TEXT -> {
                    if (insideV || insideT) {
                        cellText.append(parser.text)
                    }
                }
                XmlPullParser.END_TAG -> {
                    when (parser.name) {
                        "v" -> insideV = false
                        "t" -> insideT = false
                        "c" -> {
                            val rawVal = cellText.toString().trim()
                            val resolvedVal = when (currentCellType) {
                                "s" -> {
                                    val idx = rawVal.toIntOrNull()
                                    if (idx != null && idx in sharedStrings.indices) sharedStrings[idx] else rawVal
                                }
                                else -> rawVal
                            }
                            if (currentCellCol >= 0 && resolvedVal.isNotBlank()) {
                                currentRowMap[currentCellCol] = resolvedVal
                            }
                        }
                        "row" -> {
                            if (currentRowMap.isNotEmpty()) {
                                rows.add(currentRowMap)
                            }
                        }
                    }
                }
            }
            eventType = parser.next()
        }
        return rows
    }

    private fun columnRefToIndex(cellRef: String): Int {
        val colLetters = cellRef.takeWhile { it.isLetter() }.uppercase()
        if (colLetters.isEmpty()) return -1
        var result = 0
        for (char in colLetters) {
            result = result * 26 + (char - 'A' + 1)
        }
        return result - 1
    }

    /**
     * Parses CSV or TSV bytes with separator detection
     */
    fun parseCsv(bytes: ByteArray): ParseResult {
        val reader = BufferedReader(InputStreamReader(ByteArrayInputStream(bytes), Charsets.UTF_8))
        val lines = reader.readLines().filter { it.isNotBlank() }

        if (lines.isEmpty()) {
            return ParseResult(emptyList(), 0, emptyList(), "فایل CSV خالی است.")
        }

        // Detect separator: comma, semicolon, or tab
        val firstLine = lines.first()
        val commaCount = firstLine.count { it == ',' }
        val semiCount = firstLine.count { it == ';' }
        val tabCount = firstLine.count { it == '\t' }
        val separator = when {
            semiCount > commaCount && semiCount > tabCount -> ';'
            tabCount > commaCount && tabCount > semiCount -> '\t'
            else -> ','
        }

        val rawRows = lines.map { line ->
            parseCsvLine(line, separator).mapIndexed { index, value -> index to value }.toMap()
        }

        return mapRowsToDevices(rawRows)
    }

    private fun parseCsvLine(line: String, separator: Char): List<String> {
        val tokens = mutableListOf<String>()
        var inQuotes = false
        val sb = StringBuilder()

        for (ch in line) {
            when {
                ch == '\"' -> inQuotes = !inQuotes
                ch == separator && !inQuotes -> {
                    tokens.add(sb.toString().trim())
                    sb.clear()
                }
                else -> sb.append(ch)
            }
        }
        tokens.add(sb.toString().trim())
        return tokens
    }

    /**
     * Maps parsed rows (Map of colIndex -> String) to Device entities
     */
    private fun mapRowsToDevices(rows: List<Map<Int, String>>): ParseResult {
        if (rows.isEmpty()) {
            return ParseResult(emptyList(), 0, emptyList(), "سطری برای پردازش وجود ندارد.")
        }

        // Find header row: typically row 0 or 1 with column names
        var headerRowIndex = 0
        var headerMap: Map<Int, String> = emptyMap()

        for (i in 0 until minOf(3, rows.size)) {
            val row = rows[i]
            val values = row.values.map { it.lowercase() }
            if (values.any { it.contains("دستگاه") || it.contains("مدل") || it.contains("نام") || it.contains("model") || it.contains("name") }) {
                headerRowIndex = i
                headerMap = row
                break
            }
        }

        if (headerMap.isEmpty()) {
            headerMap = rows.first()
            headerRowIndex = 0
        }

        // Detect column positions
        var colName = -1
        var colModel = -1
        var colYear = -1
        var colPrice = -1
        var colCash = -1
        var colInstallment = -1
        var colInstallmentNote = -1
        var colWarranty = -1
        var colSpecs = -1
        var colCondition = -1
        var colLocation = -1

        val detectedColumnsList = mutableListOf<String>()

        headerMap.forEach { (colIdx, header) ->
            val h = header.trim().lowercase()
            detectedColumnsList.add(header.trim())
            when {
                colName == -1 && (h.contains("نام دستگاه") || h.contains("دستگاه") || h.contains("عنوان") || h == "نام" || h.contains("machine") || h.contains("equipment") || h == "name") -> {
                    colName = colIdx
                }
                colModel == -1 && (h.contains("مدل") || h.contains("تیپ") || h.contains("model") || h.contains("type")) -> {
                    colModel = colIdx
                }
                colYear == -1 && (h.contains("سال") || h.contains("ساخت") || h.contains("year") || h.contains("built")) -> {
                    colYear = colIdx
                }
                colPrice == -1 && (h.contains("قیمت") || h.contains("مبلغ") || h.contains("ارزش") || h.contains("price") || h.contains("amount")) -> {
                    colPrice = colIdx
                }
                colCash == -1 && (h.contains("نقدی") || h.contains("پیش پرداخت") || h.contains("درصد") || h.contains("cash") || h.contains("down")) -> {
                    colCash = colIdx
                }
                colInstallment == -1 && (h.contains("اقساط") || h.contains("قسط") || h.contains("ماه") || h.contains("installment") || h.contains("months")) -> {
                    colInstallment = colIdx
                }
                colInstallmentNote == -1 && (h.contains("شرایط اقساط") || h.contains("چک") || h.contains("شرایط پرداخت")) -> {
                    colInstallmentNote = colIdx
                }
                colWarranty == -1 && (h.contains("گارانتی") || h.contains("ضمانت") || h.contains("خدمات") || h.contains("warranty") || h.contains("guarantee")) -> {
                    colWarranty = colIdx
                }
                colSpecs == -1 && (h.contains("مشخصات") || h.contains("جزییات") || h.contains("جزئیات") || h.contains("توضیحات") || h.contains("مشخصات فنی") || h.contains("spec") || h.contains("detail") || h.contains("description")) -> {
                    colSpecs = colIdx
                }
                colCondition == -1 && (h.contains("وضعیت") || h.contains("کارکرد") || h.contains("condition")) -> {
                    colCondition = colIdx
                }
                colLocation == -1 && (h.contains("شهر") || h.contains("محل") || h.contains("موقعیت") || h.contains("location") || h.contains("city")) -> {
                    colLocation = colIdx
                }
            }
        }

        // If name column wasn't detected by header keyword, fallback to first non-empty column
        if (colName == -1 && headerMap.isNotEmpty()) {
            colName = headerMap.keys.sorted().first()
        }
        if (colModel == -1 && headerMap.size > 1) {
            colModel = headerMap.keys.sorted().getOrNull(1) ?: -1
        }

        val devices = mutableListOf<Device>()

        for (i in (headerRowIndex + 1) until rows.size) {
            val row = rows[i]
            if (row.isEmpty() || row.values.all { it.isBlank() }) continue

            val rawName = row[colName] ?: ""
            val rawModel = if (colModel >= 0) row[colModel] ?: "" else ""
            val rawYear = if (colYear >= 0) cleanNumberString(row[colYear] ?: "") else ""
            val rawPrice = if (colPrice >= 0) row[colPrice] ?: "" else ""
            val rawCashStr = if (colCash >= 0) cleanNumberString(row[colCash] ?: "") else ""
            val rawInstallmentStr = if (colInstallment >= 0) cleanNumberString(row[colInstallment] ?: "") else ""
            val rawInstallmentNote = if (colInstallmentNote >= 0) row[colInstallmentNote] ?: "" else ""
            val rawWarranty = if (colWarranty >= 0) row[colWarranty] ?: "" else ""
            val rawSpecs = if (colSpecs >= 0) row[colSpecs] ?: "" else ""
            val rawCondition = if (colCondition >= 0 && !row[colCondition].isNullOrBlank()) row[colCondition]!! else "کارکرده تمیز"
            val rawLocation = if (colLocation >= 0) row[colLocation] ?: "" else ""

            val cashPercent = extractPercentage(rawCashStr)
            val installmentMonths = extractMonths(rawInstallmentStr)

            // If name is blank, we can synthesize from model or skip
            val finalName = if (rawName.isNotBlank()) rawName else if (rawModel.isNotBlank()) "دستگاه $rawModel" else "دستگاه صنعتی"

            val device = Device(
                name = finalName,
                model = rawModel,
                year = rawYear,
                totalPrice = formatPriceString(rawPrice),
                cashPercentage = cashPercent,
                installmentMonths = installmentMonths,
                installmentNote = rawInstallmentNote,
                warranty = rawWarranty,
                specifications = rawSpecs,
                condition = rawCondition,
                location = rawLocation
            )
            devices.add(device)
        }

        return ParseResult(
            devices = devices,
            totalRows = devices.size,
            detectedColumns = detectedColumnsList,
            errorMessage = if (devices.isEmpty()) "هیچ داده‌ای در ردیف‌های فایل یافت نشد." else null
        )
    }

    private fun cleanNumberString(str: String): String {
        // Convert Persian/Arabic digits to English digits
        return str
            .replace('۰', '0').replace('۱', '1').replace('۲', '2').replace('۳', '3').replace('۴', '4')
            .replace('۵', '5').replace('۶', '6').replace('۷', '7').replace('۸', '8').replace('۹', '9')
            .replace('٠', '0').replace('١', '1').replace('٢', '2').replace('٣', '3').replace('٤', '4')
            .replace('٥', '5').replace('٦', '6').replace('٧', '7').replace('٨', '8').replace('٩', '9')
            .trim()
    }

    private fun extractPercentage(str: String): Int {
        val cleaned = cleanNumberString(str).replace("%", "").replace("درصد", "").trim()
        val num = cleaned.filter { it.isDigit() || it == '.' }
        val parsedDouble = num.toDoubleOrNull() ?: 0.0
        return when {
            parsedDouble in 0.01..1.0 -> (parsedDouble * 100).toInt()
            parsedDouble > 0 -> parsedDouble.toInt().coerceIn(0, 100)
            else -> 0
        }
    }

    private fun extractMonths(str: String): Int {
        val cleaned = cleanNumberString(str).replace("ماه", "").replace("قسط", "").trim()
        val num = cleaned.filter { it.isDigit() }
        return num.toIntOrNull() ?: 0
    }

    private fun formatPriceString(priceStr: String): String {
        val trimmed = priceStr.trim()
        if (trimmed.isBlank()) return ""
        val cleaned = cleanNumberString(trimmed).replace(",", "").replace("،", "").replace(" ", "")
        val digits = cleaned.filter { it.isDigit() }
        return if (digits.length >= 4) {
            // Format with thousand separators
            try {
                val num = digits.toLong()
                val formatted = String.format("%,d", num)
                if (trimmed.contains("میلیون")) "$trimmed" else "$formatted تومان"
            } catch (_: Exception) {
                trimmed
            }
        } else {
            trimmed
        }
    }

    /**
     * Generates a ready-to-use Sample CSV content in Persian that matches the expected columns
     */
    fun generateSampleCsv(): String {
        return buildString {
            appendLine("نام دستگاه,مدل,سال ساخت,قیمت کل,درصد نقدی,تعداد اقساط,میزان گارانتی,مشخصات فنی,وضعیت,شهر")
            appendLine("تراش CNC سه محور,CK6140 / Siemens 808D,2023,850000000 تومان,40%,10 ماه,12 ماه گارانتی قطعات و 10 سال خدمات,کارگیر 400 میلی‌متر - سنتر 1000 - تارت 6 تایی برقی - سفارشی,صفر / آکبند,تهران")
            appendLine("فرز CNC عمودی,VMC 850 / Fanuc 0i-MF,1401,1650000000 تومان,50%,12 ماه,6 ماه گارانتی مکانیکال,کورس محورها 800x500x500 - اسپیندل 10000 دور BT40 - تعویض ابزار 24 تایی,در حد نو,اصفهان")
            appendLine("دستگاه تزریق پلاستیک,HAIXING 160T,2022,920000000 تومان,35%,8 ماه,1 سال ضمانت هیدرولیک,تناژ 160 تن - سروو موتور کم‌مصرف - پی ال سی Techmation - فاصله ستون‌ها 460x460,کارکرده تمیز,تبریز")
            appendLine("برش لیزر فایبر فلزات,Fiber Laser 3000W Raycus,1402,1450000000 تومان,45%,12 ماه,2 سال گارانتی کامل سورس و چیلر,میز 3x1.5 متر تعویض‌شو - هد Boci اتوفوکوس - چیلر صنعتی S&A - مکنده قدرتمند,صفر / آکبند,کرج")
            appendLine("پرس برک CNC هیدرولیک,Delem DA53T 100T,2021,780000000 تومان,30%,6 ماه,9 ماه گارانتی جک و هیدرولیک,طول کارگیر 3100 میلی‌متر - تناژ 100 تن - فک بالا و پایین سریع - فوتوسل ایمنی,در حد نو,مشهد")
        }
    }
}
