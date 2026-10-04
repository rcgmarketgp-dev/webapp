package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.FileProvider
import com.example.ui.theme.*
import com.example.ui.viewmodel.DeviceViewModel
import com.example.ui.viewmodel.ImportState
import com.example.util.ExcelParser
import java.io.File
import java.io.FileOutputStream

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExcelImportScreen(
    viewModel: DeviceViewModel,
    onNavigateToList: () -> Unit
) {
    val context = LocalContext.current
    val importState by viewModel.importState.collectAsState()

    // File picker launcher
    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            viewModel.importExcelFile(context, uri)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "آپلود و ورود فایل اکسل",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateToList) {
                        Icon(imageVector = Icons.Default.ArrowForward, contentDescription = "بازگشت")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Import Result Card (if any)
            when (val state = importState) {
                is ImportState.Loading -> {
                    item {
                        Card(
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                CircularProgressIndicator(color = PrimaryNavy)
                                Spacer(modifier = Modifier.height(16.dp))
                                Text(
                                    text = "در حال پردازش فایل اکسل...",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp
                                )
                                Text(
                                    text = "استخراج سطرها و ساخت هوشمند کپشن‌های فروش دستگاه‌ها",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
                is ImportState.Success -> {
                    item {
                        Card(
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = SuccessGreenContainer),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(20.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Icon(
                                    imageVector = Icons.Default.CheckCircle,
                                    contentDescription = null,
                                    tint = SuccessGreen,
                                    modifier = Modifier.size(48.dp)
                                )
                                Spacer(modifier = Modifier.height(10.dp))
                                Text(
                                    text = "عملیات ورود با موفقیت انجام شد!",
                                    fontWeight = FontWeight.Black,
                                    fontSize = 16.sp,
                                    color = Color(0xFF064E3B)
                                )
                                Text(
                                    text = "${state.count} دستگاه از فایل شناسایی و با کپشن اختصاصی ذخیره شدند.",
                                    fontSize = 13.sp,
                                    color = Color(0xFF065F46)
                                )

                                if (state.detectedColumns.isNotEmpty()) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "ستون‌های شناسایی شده: ${state.detectedColumns.take(5).joinToString("، ")}...",
                                        fontSize = 11.sp,
                                        color = Color(0xFF047857)
                                    )
                                }

                                Spacer(modifier = Modifier.height(16.dp))
                                Button(
                                    onClick = {
                                        viewModel.resetImportState()
                                        onNavigateToList()
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen),
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Text("مشاهده لیست دستگاه‌ها")
                                }
                            }
                        }
                    }
                }
                is ImportState.Error -> {
                    item {
                        Card(
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = DangerContainer),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(imageVector = Icons.Default.Error, contentDescription = null, tint = DangerRed)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("خطا در پردازش فایل", fontWeight = FontWeight.Bold, color = DangerRed)
                                }
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(state.message, fontSize = 12.sp, color = Color(0xFF7F1D1D))
                                Spacer(modifier = Modifier.height(10.dp))
                                TextButton(onClick = { viewModel.resetImportState() }) {
                                    Text("بستن پیام خطا")
                                }
                            }
                        }
                    }
                }
                is ImportState.Idle -> {}
            }

            // Main Upload Action Card
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .size(72.dp)
                                .clip(CircleShape)
                                .background(PrimaryContainerLight),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.CloudUpload,
                                contentDescription = null,
                                tint = PrimaryNavy,
                                modifier = Modifier.size(36.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Text(
                            text = "انتخاب فایل اکسل دستگاه‌ها",
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = "فرمت‌های قابل قبول: فایل اکسل (.xlsx یا .xls) یا فایل (.csv)",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Spacer(modifier = Modifier.height(20.dp))

                        Button(
                            onClick = {
                                filePickerLauncher.launch("*/*")
                            },
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryNavy),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp)
                                .testTag("select_excel_file_button")
                        ) {
                            Icon(imageVector = Icons.Default.FolderOpen, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("انتخاب فایل از حافظه گوشی", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                    }
                }
            }

            // Quick Demo & Sample File Actions Card
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text(
                            text = "ابزارهای کمکی و تست سریع:",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )

                        // Load 5 sample demo machines
                        FilledTonalButton(
                            onClick = {
                                viewModel.loadSampleData()
                                Toast.makeText(context, "۵ دستگاه نمونه با موفقیت بارگذاری شد!", Toast.LENGTH_SHORT).show()
                                onNavigateToList()
                            },
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(imageVector = Icons.Default.Bolt, contentDescription = null, tint = AccentAmber)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("بارگذاری ۵ دستگاه نمونه برای تست آنی برنامه", fontWeight = FontWeight.Bold)
                        }

                        // Share / Download Sample CSV Template
                        OutlinedButton(
                            onClick = {
                                try {
                                    val csvContent = ExcelParser.generateSampleCsv()
                                    val cacheFile = File(context.cacheDir, "sample_machines.csv")
                                    FileOutputStream(cacheFile).use { it.write(csvContent.toByteArray(Charsets.UTF_8)) }

                                    val uri = FileProvider.getUriForFile(
                                        context,
                                        "${context.packageName}.fileprovider",
                                        cacheFile
                                    )
                                    val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                        type = "text/csv"
                                        putExtra(Intent.EXTRA_STREAM, uri)
                                        putExtra(Intent.EXTRA_SUBJECT, "فایل اکسل نمونه دستگاه‌یار")
                                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                                    }
                                    context.startActivity(Intent.createChooser(shareIntent, "اشتراک یا باز کردن فایل نمونه اکسل..."))
                                } catch (e: Exception) {
                                    Toast.makeText(context, "خطا در ایجاد فایل: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
                                }
                            },
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(imageVector = Icons.Default.Download, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("دریافت فایل نمونه اکسل (CSV Template)")
                        }
                    }
                }
            }

            // Excel Column Mapping Guide Card
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(imageVector = Icons.Default.TableChart, contentDescription = null, tint = PrimaryNavy)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "راهنمای ستون‌های فایل اکسل:",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                        }

                        Text(
                            text = "سیستم به صورت خودکار سرستون‌های زیر را با هر ترتیبی تشخیص داده و نگاشت می‌کند:",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        val expectedCols = listOf(
                            "نام دستگاه" to "دستگاه، عنوان یا Machine Name",
                            "مدل" to "مدل دستگاه، تیپ یا Model",
                            "سال ساخت" to "سال تولید (مثلاً ۱۴۰۲ یا 2023)",
                            "مبلغ کل" to "قیمت کل دستگاه (مثلاً 850,000,000 تومان)",
                            "درصد نقدی" to "درصد پیش‌پرداخت نقدی (مثلاً 40%)",
                            "تعداد اقساط" to "تعداد ماه‌های اقساط (مثلاً 10 ماه)",
                            "میزان گارانتی" to "مدت گارانتی و خدمات پس از فروش",
                            "مشخصات فنی" to "جزییات ابعاد کارگیر، کنترلر، قدرت و..."
                        )

                        expectedCols.forEach { (colName, desc) ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 3.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "• $colName",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = PrimaryNavy
                                )
                                Text(
                                    text = desc,
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(4.dp))
                        Surface(
                            color = MaterialTheme.colorScheme.surface,
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = "💡 نکته: در صورتی که در فایل اکسل اطلاعات هر کدام از دستگاه‌ها کامل نباشد، برنامه آن را به صورت «ناقص» نشان می‌دهد و می‌توانید با یک کلیک عکس و اطلاعات باقیمانده را دستی وارد کنید.",
                                fontSize = 11.sp,
                                lineHeight = 16.sp,
                                color = AccentAmber,
                                modifier = Modifier.padding(10.dp)
                            )
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}
