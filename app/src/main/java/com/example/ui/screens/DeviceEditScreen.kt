package com.example.ui.screens

import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.Device
import com.example.ui.components.PhotoManager
import com.example.ui.theme.*
import com.example.ui.viewmodel.DeviceViewModel
import com.example.util.CaptionGenerator
import com.example.util.ShareHelper

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DeviceEditScreen(
    device: Device?,
    viewModel: DeviceViewModel,
    onBack: () -> Unit,
    onSaved: (Device) -> Unit
) {
    BackHandler { onBack() }
    val context = LocalContext.current
    val sellerProfile by viewModel.sellerProfile.collectAsState()

    val isNew = device == null
    val isCompleting = device?.isIncomplete == true

    var name by remember(device) { mutableStateOf(device?.name ?: "") }
    var model by remember(device) { mutableStateOf(device?.model ?: "") }
    var year by remember(device) { mutableStateOf(device?.year ?: "") }
    var totalPrice by remember(device) { mutableStateOf(device?.totalPrice ?: "") }
    var cashPercentage by remember(device) { mutableStateOf(device?.cashPercentage?.toString() ?: "40") }
    var installmentMonths by remember(device) { mutableStateOf(device?.installmentMonths?.toString() ?: "10") }
    var installmentNote by remember(device) { mutableStateOf(device?.installmentNote ?: "اقساط ماهیانه با چک صیادی") }
    var warranty by remember(device) { mutableStateOf(device?.warranty ?: "") }
    var specifications by remember(device) { mutableStateOf(device?.specifications ?: "") }
    var condition by remember(device) { mutableStateOf(device?.condition ?: "در حد نو") }
    var location by remember(device) { mutableStateOf(device?.location ?: "تهران") }
    var status by remember(device) { mutableStateOf(device?.status ?: Device.STATUS_ACTIVE) }
    var captionStyle by remember(device) { mutableStateOf(device?.captionStyle ?: Device.STYLE_ATTRACTIVE) }

    var imagePaths by remember(device) { mutableStateOf(device?.getImageList() ?: emptyList()) }

    var showLivePreview by remember { mutableStateOf(true) }

    // Real-time payment calculation
    val cashInt = cashPercentage.toIntOrNull() ?: 0
    val monthsInt = installmentMonths.toIntOrNull() ?: 0
    val payment = remember(totalPrice, cashInt, monthsInt) {
        CaptionGenerator.calculatePayment(totalPrice, cashInt, monthsInt)
    }

    // Temporary preview device
    val previewDevice = Device(
        id = device?.id ?: 0,
        name = name.ifBlank { "نام دستگاه" },
        model = model,
        year = year,
        totalPrice = totalPrice,
        cashPercentage = cashInt,
        installmentMonths = monthsInt,
        installmentNote = installmentNote,
        warranty = warranty,
        specifications = specifications,
        condition = condition,
        location = location,
        status = status,
        captionStyle = captionStyle
    )
    val liveCaption = remember(previewDevice, sellerProfile) {
        CaptionGenerator.generateCaption(previewDevice, sellerProfile, captionStyle)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = when {
                            isNew -> "ثبت دستی دستگاه جدید"
                            isCompleting -> "تکمیل اطلاعات دستگاه"
                            else -> "ویرایش دستگاه"
                        },
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(imageVector = Icons.Default.ArrowForward, contentDescription = "بازگشت")
                    }
                },
                actions = {
                    TextButton(
                        onClick = {
                            if (name.isBlank()) {
                                Toast.makeText(context, "لطفاً نام دستگاه را وارد کنید.", Toast.LENGTH_SHORT).show()
                                return@TextButton
                            }
                            val updated = (device ?: Device(name = name)).copy(
                                name = name.trim(),
                                model = model.trim(),
                                year = year.trim(),
                                totalPrice = totalPrice.trim(),
                                cashPercentage = cashInt,
                                installmentMonths = monthsInt,
                                installmentNote = installmentNote.trim(),
                                warranty = warranty.trim(),
                                specifications = specifications.trim(),
                                condition = condition.trim(),
                                location = location.trim(),
                                status = status,
                                captionStyle = captionStyle
                            ).withImageList(imagePaths)

                            viewModel.saveDevice(updated) { savedId ->
                                Toast.makeText(context, "اطلاعات دستگاه با موفقیت ذخیره شد ✓", Toast.LENGTH_SHORT).show()
                                onSaved(updated.copy(id = savedId))
                            }
                        },
                        modifier = Modifier.testTag("save_device_button")
                    ) {
                        Text("ذخیره", fontWeight = FontWeight.Black, fontSize = 15.sp, color = PrimaryNavy)
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
            // Helper banner
            if (isCompleting) {
                item {
                    Surface(
                        color = AccentAmberContainer,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(imageVector = Icons.Default.Info, contentDescription = null, tint = AccentAmber)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "این دستگاه از اکسل وارد شده اما برخی فیلدها ناقص هستند. لطفاً موارد خالی را تکمیل فرمایید.",
                                fontSize = 12.sp,
                                color = Color(0xFF78350F)
                            )
                        }
                    }
                }
            }

            // Photos section
            item {
                PhotoManager(
                    imagePaths = imagePaths,
                    onAddPhoto = { uri ->
                        val savedPath = ShareHelper.saveImageToInternalStorage(context, uri)
                        if (savedPath != null) {
                            imagePaths = imagePaths + savedPath
                        }
                    },
                    onRemovePhoto = { path ->
                        imagePaths = imagePaths.filter { it != path }
                    },
                    onSetCover = { path ->
                        val list = imagePaths.toMutableList()
                        if (list.remove(path)) {
                            list.add(0, path)
                            imagePaths = list
                        }
                    }
                )
            }

            // Machine Identity Card
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(
                            text = "مشخصات پایه دستگاه",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        OutlinedTextField(
                            value = name,
                            onValueChange = { name = it },
                            label = { Text("نام دستگاه (الزامی) *") },
                            placeholder = { Text("مثال: دستگاه تراش CNC سه محور") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            isError = name.isBlank(),
                            leadingIcon = { Icon(Icons.Default.PrecisionManufacturing, contentDescription = null) }
                        )

                        OutlinedTextField(
                            value = model,
                            onValueChange = { model = it },
                            label = { Text("مدل / تیپ / کنترلر") },
                            placeholder = { Text("مثال: CK6140 / زیمنس 808D") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            leadingIcon = { Icon(Icons.Default.Label, contentDescription = null) }
                        )

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            OutlinedTextField(
                                value = year,
                                onValueChange = { year = it },
                                label = { Text("سال ساخت") },
                                placeholder = { Text("مثال: ۱۴۰۲ یا 2023") },
                                singleLine = true,
                                modifier = Modifier.weight(1f),
                                leadingIcon = { Icon(Icons.Default.CalendarToday, contentDescription = null) }
                            )

                            OutlinedTextField(
                                value = location,
                                onValueChange = { location = it },
                                label = { Text("شهر و محل بازدید") },
                                placeholder = { Text("مثال: تهران، شمس‌آباد") },
                                singleLine = true,
                                modifier = Modifier.weight(1f),
                                leadingIcon = { Icon(Icons.Default.Place, contentDescription = null) }
                            )
                        }

                        // Condition selector chips
                        Text("وضعیت کارکرد دستگاه:", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            val conditions = listOf("صفر / آکبند", "در حد نو", "کارکرده تمیز", "اورهال شده")
                            items(conditions) { cond ->
                                FilterChip(
                                    selected = condition == cond,
                                    onClick = { condition = cond },
                                    label = { Text(cond, fontSize = 11.sp) }
                                )
                            }
                        }
                    }
                }
            }

            // Financial & Installment Terms Card
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(
                            text = "قیمت و نحوه پرداخت (نقدی و اقساط)",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        OutlinedTextField(
                            value = totalPrice,
                            onValueChange = { totalPrice = it },
                            label = { Text("قیمت کل دستگاه") },
                            placeholder = { Text("مثال: 850,000,000 تومان یا توافقی") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            leadingIcon = { Icon(Icons.Default.AttachMoney, contentDescription = null) }
                        )

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            OutlinedTextField(
                                value = cashPercentage,
                                onValueChange = { cashPercentage = it.filter { ch -> ch.isDigit() } },
                                label = { Text("درصد پیش‌پرداخت (٪)") },
                                placeholder = { Text("مثلاً 40") },
                                singleLine = true,
                                modifier = Modifier.weight(1f),
                                leadingIcon = { Icon(Icons.Default.Percent, contentDescription = null) }
                            )

                            OutlinedTextField(
                                value = installmentMonths,
                                onValueChange = { installmentMonths = it.filter { ch -> ch.isDigit() } },
                                label = { Text("تعداد اقساط ماهیانه") },
                                placeholder = { Text("مثلاً 10") },
                                singleLine = true,
                                modifier = Modifier.weight(1f),
                                leadingIcon = { Icon(Icons.Default.Schedule, contentDescription = null) }
                            )
                        }

                        // Live calculated payment pill
                        if (payment.downPaymentAmount != null && payment.monthlyAmount != null) {
                            Surface(
                                color = SuccessGreenContainer,
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(10.dp)) {
                                    Text(
                                        text = "محاسبه خودکار اقساط در کپشن:",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = SuccessGreen
                                    )
                                    Text(
                                        text = "پیش‌پرداخت: ${payment.formattedDownPayment} | هر قسط: ${payment.formattedMonthly} (طی $monthsInt ماه)",
                                        fontSize = 12.sp,
                                        color = Color(0xFF064E3B)
                                    )
                                }
                            }
                        }

                        OutlinedTextField(
                            value = installmentNote,
                            onValueChange = { installmentNote = it },
                            label = { Text("توضیحات نحوه پرداخت و چک") },
                            placeholder = { Text("مثال: اقساط با چک صیادی بنفش ماه به ماه بدون بهره") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            leadingIcon = { Icon(Icons.Default.CreditCard, contentDescription = null) }
                        )
                    }
                }
            }

            // Technical Specs & Warranty Card
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(
                            text = "جزییات فنی و گارانتی",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        OutlinedTextField(
                            value = warranty,
                            onValueChange = { warranty = it },
                            label = { Text("میزان گارانتی و خدمات پس از فروش") },
                            placeholder = { Text("مثال: ۱۲ ماه گارانتی قطعات و ۱۰ سال پشتیبانی") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            leadingIcon = { Icon(Icons.Default.VerifiedUser, contentDescription = null) }
                        )

                        OutlinedTextField(
                            value = specifications,
                            onValueChange = { specifications = it },
                            label = { Text("مشخصات فنی و جزییات دستگاه") },
                            placeholder = { Text("ابعاد کارگیر، قدرت موتور، سیستم کنترلر، ابزارها و امکانات...") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(min = 100.dp, max = 200.dp)
                        )
                    }
                }
            }

            // Status Selector Card
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("وضعیت نگهداری در برنامه:", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            FilterChip(
                                selected = status == Device.STATUS_ACTIVE,
                                onClick = { status = Device.STATUS_ACTIVE },
                                label = { Text("فعال برای فروش") }
                            )
                            FilterChip(
                                selected = status == Device.STATUS_SOLD,
                                onClick = { status = Device.STATUS_SOLD },
                                label = { Text("فروخته شد") }
                            )
                            FilterChip(
                                selected = status == Device.STATUS_ARCHIVED,
                                onClick = { status = Device.STATUS_ARCHIVED },
                                label = { Text("بایگانی شده") }
                            )
                        }
                    }
                }
            }

            // Live Caption Preview Section
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { showLivePreview = !showLivePreview },
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "پیش‌نمایش خودکار کپشن برای فروش",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Icon(
                                imageVector = if (showLivePreview) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                contentDescription = null
                            )
                        }

                        AnimatedVisibility(visible = showLivePreview) {
                            Column {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = liveCaption,
                                    fontSize = 11.sp,
                                    lineHeight = 18.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }

            // Bottom Save Button
            item {
                Button(
                    onClick = {
                        if (name.isBlank()) {
                            Toast.makeText(context, "لطفاً نام دستگاه را وارد کنید.", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        val updated = (device ?: Device(name = name)).copy(
                            name = name.trim(),
                            model = model.trim(),
                            year = year.trim(),
                            totalPrice = totalPrice.trim(),
                            cashPercentage = cashInt,
                            installmentMonths = monthsInt,
                            installmentNote = installmentNote.trim(),
                            warranty = warranty.trim(),
                            specifications = specifications.trim(),
                            condition = condition.trim(),
                            location = location.trim(),
                            status = status,
                            captionStyle = captionStyle
                        ).withImageList(imagePaths)

                        viewModel.saveDevice(updated) { savedId ->
                            Toast.makeText(context, "اطلاعات با موفقیت ذخیره شد ✓", Toast.LENGTH_SHORT).show()
                            onSaved(updated.copy(id = savedId))
                        }
                    },
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryNavy),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 12.dp)
                ) {
                    Icon(imageVector = Icons.Default.Save, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("ذخیره و ثبت نهایی اطلاعات", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
            }
        }
    }
}
