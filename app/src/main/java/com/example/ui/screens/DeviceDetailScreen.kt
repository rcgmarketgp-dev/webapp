package com.example.ui.screens

import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.example.data.model.Device
import com.example.ui.components.PhotoManager
import com.example.ui.components.ShareMessengerSheet
import com.example.ui.components.StatusBadge
import com.example.ui.theme.*
import com.example.ui.viewmodel.DeviceViewModel
import com.example.util.CaptionGenerator
import com.example.util.ShareHelper
import java.io.File

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DeviceDetailScreen(
    device: Device,
    viewModel: DeviceViewModel,
    onBack: () -> Unit,
    onNavigateToEdit: (Device) -> Unit
) {
    BackHandler { onBack() }
    val context = LocalContext.current
    val sellerProfile by viewModel.sellerProfile.collectAsState()

    var showShareSheet by remember { mutableStateOf(false) }
    var currentCaptionStyle by remember(device) { mutableStateOf(device.captionStyle) }

    // Caption state: can be edited in real-time
    var captionText by remember(device, currentCaptionStyle, sellerProfile) {
        val text = if (device.customCaption.isNotBlank()) {
            device.customCaption
        } else {
            CaptionGenerator.generateCaption(device, sellerProfile, currentCaptionStyle)
        }
        mutableStateOf(text)
    }

    var isEditingCaption by remember { mutableStateOf(false) }
    var showDeleteConfirm by remember { mutableStateOf(false) }

    val imageList = device.getImageList()
    val payment = remember(device.totalPrice, device.cashPercentage, device.installmentMonths) {
        CaptionGenerator.calculatePayment(device.totalPrice, device.cashPercentage, device.installmentMonths)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = device.name,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(imageVector = Icons.Default.ArrowForward, contentDescription = "بازگشت")
                    }
                },
                actions = {
                    IconButton(onClick = { onNavigateToEdit(device) }) {
                        Icon(imageVector = Icons.Default.Edit, contentDescription = "ویرایش")
                    }
                    IconButton(onClick = { showDeleteConfirm = true }) {
                        Icon(imageVector = Icons.Default.Delete, contentDescription = "حذف", tint = DangerRed)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        bottomBar = {
            Surface(
                color = MaterialTheme.colorScheme.surface,
                tonalElevation = 8.dp,
                shadowElevation = 8.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = { showShareSheet = true },
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryNavy),
                        modifier = Modifier
                            .weight(1.5f)
                            .testTag("share_messenger_button")
                    ) {
                        Icon(imageVector = Icons.Default.Share, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("ارسال به پیام‌رسان‌ها", fontWeight = FontWeight.Bold)
                    }

                    OutlinedButton(
                        onClick = {
                            ShareHelper.copyToClipboard(context, captionText)
                        },
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .weight(1f)
                            .testTag("copy_caption_button")
                    ) {
                        Icon(imageVector = Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("کپی متن")
                    }
                }
            }
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Photo Management Section
            item {
                Spacer(modifier = Modifier.height(4.dp))
                PhotoManager(
                    imagePaths = imageList,
                    onAddPhoto = { uri ->
                        viewModel.addPhotoToDevice(context, device, uri)
                    },
                    onRemovePhoto = { path ->
                        viewModel.removePhotoFromDevice(device, path)
                    },
                    onSetCover = { path ->
                        viewModel.setCoverPhoto(device, path)
                    }
                )
            }

            // Incomplete warning banner
            if (device.isIncomplete) {
                item {
                    Surface(
                        color = DangerContainer,
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(imageVector = Icons.Default.Warning, contentDescription = null, tint = DangerRed)
                            Spacer(modifier = Modifier.width(10.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text("اطلاعات این دستگاه ناقص است", fontWeight = FontWeight.Bold, color = DangerRed, fontSize = 13.sp)
                                Text("برخی اطلاعات مانند عکس، درصد اقساط، قیمت یا گارانتی تکمیل نشده‌اند.", fontSize = 11.sp, color = Color(0xFF7F1D1D))
                            }
                            FilledTonalButton(
                                onClick = { onNavigateToEdit(device) },
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.filledTonalButtonColors(containerColor = DangerRed, contentColor = Color.White)
                            ) {
                                Text("تکمیل اطلاعات", fontSize = 11.sp)
                            }
                        }
                    }
                }
            }

            // Specs Card
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "مشخصات دستگاه",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            StatusBadge(status = device.status)
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        DetailRow(label = "نام دستگاه", value = device.name)
                        if (device.model.isNotBlank()) DetailRow(label = "مدل / تیپ", value = device.model)
                        if (device.year.isNotBlank()) DetailRow(label = "سال ساخت", value = device.year)
                        if (device.condition.isNotBlank()) DetailRow(label = "وضعیت کارکرد", value = device.condition)
                        if (device.location.isNotBlank()) DetailRow(label = "محل استقرار / بازدید", value = device.location)
                        if (device.warranty.isNotBlank()) DetailRow(label = "میزان گارانتی و خدمات", value = device.warranty, highlight = true)

                        if (device.specifications.isNotBlank()) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "جزییات و ویژگی‌های فنی:",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = device.specifications,
                                fontSize = 13.sp,
                                color = MaterialTheme.colorScheme.onSurface,
                                lineHeight = 20.sp
                            )
                        }
                    }
                }
            }

            // Payment Breakdown Card
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "شرایط مالی و جدول پرداخت",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        Surface(
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                DetailRow(
                                    label = "💰 مبلغ کل دستگاه",
                                    value = if (device.totalPrice.isNotBlank()) device.totalPrice else "وارد نشده",
                                    highlight = true
                                )

                                if (device.cashPercentage > 0) {
                                    val downText = if (payment.downPaymentAmount != null)
                                        "${payment.formattedDownPayment} (${device.cashPercentage}٪)"
                                    else
                                        "${device.cashPercentage} درصد"
                                    DetailRow(label = "💵 پیش‌پرداخت نقدی", value = downText)
                                }

                                if (device.installmentMonths > 0) {
                                    val monthlyText = if (payment.monthlyAmount != null)
                                        "${device.installmentMonths} قسط ماهیانه هر کدام ${payment.formattedMonthly}"
                                    else
                                        "${device.installmentMonths} قسط ماهیانه"
                                    DetailRow(label = "🗓️ تسهیلات اقساط", value = monthlyText)
                                }

                                if (payment.remainingAmount != null) {
                                    DetailRow(
                                        label = "مابقی مبلغ به اقساط",
                                        value = String.format("%,d تومان", payment.remainingAmount)
                                    )
                                }

                                if (device.installmentNote.isNotBlank()) {
                                    DetailRow(label = "📝 شرایط تسویه و چک", value = device.installmentNote)
                                }
                            }
                        }
                    }
                }
            }

            // Caption Studio Card
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "کپشن آماده فروش",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )

                            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                TextButton(
                                    onClick = {
                                        val regenerated = CaptionGenerator.generateCaption(device, sellerProfile, currentCaptionStyle)
                                        captionText = regenerated
                                        viewModel.updateCustomCaption(device, "")
                                    }
                                ) {
                                    Icon(imageVector = Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("بازسازی خودکار", fontSize = 11.sp)
                                }
                            }
                        }

                        // Style selector chips
                        Text(
                            text = "سبک نگارش متن کپشن:",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            val styles = listOf(
                                Device.STYLE_ATTRACTIVE to "جذاب و ایموجی‌دار",
                                Device.STYLE_INDUSTRIAL to "رسمی و فنی B2B",
                                Device.STYLE_INSTALLMENT to "طرح ویژه اقساطی",
                                Device.STYLE_COMPACT to "کاتالوگی و کوتاه"
                            )
                            items(styles) { (styleKey, label) ->
                                FilterChip(
                                    selected = currentCaptionStyle == styleKey,
                                    onClick = {
                                        currentCaptionStyle = styleKey
                                        viewModel.updateCaptionStyle(device, styleKey)
                                        captionText = CaptionGenerator.generateCaption(device, sellerProfile, styleKey)
                                    },
                                    label = { Text(label, fontSize = 11.sp) }
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // Caption Text / Editor
                        OutlinedTextField(
                            value = captionText,
                            onValueChange = {
                                captionText = it
                                viewModel.updateCustomCaption(device, it)
                            },
                            label = { Text("متن کپشن (قابل ویرایش مستقیم)") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(min = 180.dp, max = 320.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = PrimaryNavy,
                                unfocusedBorderColor = MaterialTheme.colorScheme.outline
                            )
                        )
                    }
                }
            }

            // Quick Status Modifier Row
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "تغییر وضعیت دستگاه:",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedButton(
                                onClick = { viewModel.updateDeviceStatus(device, Device.STATUS_ACTIVE) },
                                modifier = Modifier.weight(1f),
                                colors = if (device.status == Device.STATUS_ACTIVE)
                                    ButtonDefaults.outlinedButtonColors(containerColor = SuccessGreenContainer)
                                else ButtonDefaults.outlinedButtonColors()
                            ) {
                                Text("فعال فروش", fontSize = 11.sp)
                            }
                            OutlinedButton(
                                onClick = { viewModel.updateDeviceStatus(device, Device.STATUS_SOLD) },
                                modifier = Modifier.weight(1f),
                                colors = if (device.status == Device.STATUS_SOLD)
                                    ButtonDefaults.outlinedButtonColors(containerColor = Color(0xFFE2E8F0))
                                else ButtonDefaults.outlinedButtonColors()
                            ) {
                                Text("فروخته شد", fontSize = 11.sp)
                            }
                            OutlinedButton(
                                onClick = { viewModel.updateDeviceStatus(device, Device.STATUS_ARCHIVED) },
                                modifier = Modifier.weight(1f),
                                colors = if (device.status == Device.STATUS_ARCHIVED)
                                    ButtonDefaults.outlinedButtonColors(containerColor = Color(0xFFFEF3C7))
                                else ButtonDefaults.outlinedButtonColors()
                            ) {
                                Text("بایگانی", fontSize = 11.sp)
                            }
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }

    // Share Sheet
    if (showShareSheet) {
        ShareMessengerSheet(
            device = device,
            caption = captionText,
            onDismiss = { showShareSheet = false }
        )
    }

    // Delete Confirmation Dialog
    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title = { Text("حذف دستگاه") },
            text = { Text("آیا از حذف «${device.name}» مطمئن هستید؟ این عملیات غیرقابل بازگشت است.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.deleteDevice(device)
                        showDeleteConfirm = false
                        onBack()
                    }
                ) {
                    Text("حذف شود", color = DangerRed, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = false }) {
                    Text("انصراف")
                }
            }
        )
    }
}

@Composable
private fun DetailRow(label: String, value: String, highlight: Boolean = false) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            fontSize = 12.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            fontSize = 13.sp,
            fontWeight = if (highlight) FontWeight.Bold else FontWeight.Medium,
            color = if (highlight) SuccessGreen else MaterialTheme.colorScheme.onSurface
        )
    }
}
