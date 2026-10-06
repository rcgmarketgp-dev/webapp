package com.example.ui.screens

import android.net.Uri
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.TableChart
import androidx.compose.material.icons.outlined.ViewAgenda
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.example.data.model.Device
import com.example.ui.components.PhotoManager
import com.example.ui.components.ShareMessengerSheet
import com.example.ui.components.StarRatingBar
import com.example.ui.components.StatusDropdownSelector
import com.example.ui.theme.*
import com.example.util.CaptionGenerator
import com.example.util.ShareHelper
import com.example.ui.viewmodel.DeviceViewModel
import java.io.File

enum class ManagementViewMode {
    TABLE, CARD
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DeviceManagementScreen(
    viewModel: DeviceViewModel,
    onNavigateToEdit: (Device?) -> Unit,
    onNavigateToDetail: (Device) -> Unit
) {
    val context = LocalContext.current
    val allDevices by viewModel.allDevices.collectAsState()
    val sellerProfile by viewModel.sellerProfile.collectAsState()

    var searchQuery by remember { mutableStateOf("") }
    var selectedStatusFilter by remember { mutableStateOf("ALL") }
    var viewMode by remember { mutableStateOf(ManagementViewMode.TABLE) }

    var deviceToDelete by remember { mutableStateOf<Device?>(null) }
    var quickEditDevice by remember { mutableStateOf<Device?>(null) }
    var deviceToShare by remember { mutableStateOf<Device?>(null) }

    // Counts
    val activeCount = remember(allDevices) { allDevices.count { it.status == Device.STATUS_ACTIVE } }
    val overhaulCount = remember(allDevices) { allDevices.count { it.status == Device.STATUS_OVERHAUL } }
    val inServiceCount = remember(allDevices) { allDevices.count { it.status == Device.STATUS_IN_SERVICE } }
    val soldCount = remember(allDevices) { allDevices.count { it.status == Device.STATUS_SOLD } }

    val filteredList = remember(allDevices, searchQuery, selectedStatusFilter) {
        val q = searchQuery.trim().lowercase()
        val list = allDevices.filter { dev ->
            val matchesSearch = if (q.isBlank()) true else {
                dev.name.lowercase().contains(q) ||
                        dev.model.lowercase().contains(q) ||
                        dev.specifications.lowercase().contains(q) ||
                        dev.year.lowercase().contains(q)
            }
            val matchesStatus = when (selectedStatusFilter) {
                "ACTIVE" -> dev.status == Device.STATUS_ACTIVE
                "OVERHAUL" -> dev.status == Device.STATUS_OVERHAUL
                "IN_SERVICE" -> dev.status == Device.STATUS_IN_SERVICE
                "SOLD" -> dev.status == Device.STATUS_SOLD
                "ARCHIVED" -> dev.status == Device.STATUS_ARCHIVED
                else -> true
            }
            matchesSearch && matchesStatus
        }
        // Always sort primarily by priority stars descending, then by updatedAt descending
        list.sortedWith(
            compareByDescending<Device> { it.priorityStars }
                .thenByDescending { it.updatedAt }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "جدول و لیست دستگاه‌ها",
                                fontWeight = FontWeight.Bold,
                                fontSize = 17.sp
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Surface(
                                color = PrimaryNavy.copy(alpha = 0.1f),
                                shape = RoundedCornerShape(6.dp)
                            ) {
                                Text(
                                    text = "${allDevices.size} مورد",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = PrimaryNavy,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                        Text(
                            text = "ویرایش سریع، تعیین وضعیت، انتخاب عکس‌ها و اولویت ستاره‌ای",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                actions = {
                    // View Mode Switcher
                    IconButton(
                        onClick = {
                            viewMode = if (viewMode == ManagementViewMode.TABLE) ManagementViewMode.CARD else ManagementViewMode.TABLE
                        }
                    ) {
                        Icon(
                            imageVector = if (viewMode == ManagementViewMode.TABLE) Icons.Outlined.ViewAgenda else Icons.Outlined.TableChart,
                            contentDescription = if (viewMode == ManagementViewMode.TABLE) "نمای کارتی" else "نمای جدول",
                            tint = PrimaryNavy
                        )
                    }

                    FilledTonalButton(
                        onClick = { onNavigateToEdit(null) },
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("دستگاه جدید", fontSize = 12.sp)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface)
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { onNavigateToEdit(null) },
                containerColor = PrimaryNavy,
                contentColor = Color.White
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = "افزودن دستگاه")
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 12.dp, vertical = 8.dp)
        ) {
            // Search Input
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("جستجو در جدول (نام، مدل، سال، مشخصات)...") },
                leadingIcon = { Icon(imageVector = Icons.Default.Search, contentDescription = null) },
                trailingIcon = {
                    if (searchQuery.isNotBlank()) {
                        IconButton(onClick = { searchQuery = "" }) {
                            Icon(imageVector = Icons.Default.Close, contentDescription = "پاک کردن")
                        }
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Quick Filter Chips by Status
            ScrollableTabRow(
                selectedTabIndex = when (selectedStatusFilter) {
                    "ACTIVE" -> 1
                    "OVERHAUL" -> 2
                    "IN_SERVICE" -> 3
                    "SOLD" -> 4
                    else -> 0
                },
                edgePadding = 0.dp,
                divider = {},
                containerColor = Color.Transparent,
                indicator = {},
                modifier = Modifier.fillMaxWidth()
            ) {
                val filters = listOf(
                    "ALL" to "همه (${allDevices.size})",
                    "ACTIVE" to "فعال برای فروش ($activeCount)",
                    "OVERHAUL" to "اورهال ($overhaulCount)",
                    "IN_SERVICE" to "درحال سرویس ($inServiceCount)",
                    "SOLD" to "فروخته شد ($soldCount)"
                )
                filters.forEach { (key, title) ->
                    FilterChip(
                        selected = selectedStatusFilter == key,
                        onClick = { selectedStatusFilter = key },
                        label = { Text(title, fontSize = 11.sp, fontWeight = if (selectedStatusFilter == key) FontWeight.Bold else FontWeight.Normal) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PrimaryNavy,
                            selectedLabelColor = Color.White
                        ),
                        modifier = Modifier.padding(end = 6.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Status Bar & Sort Indicator
            Surface(
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Sort,
                            contentDescription = null,
                            tint = Color(0xFFD97706),
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "مرتب‌سازی: بر اساس بیشترین ستاره‌ها (⭐⭐⭐⭐⭐)",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFB45309)
                        )
                    }

                    Text(
                        text = "${filteredList.size} دستگاه",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            if (filteredList.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Default.Inventory2,
                            contentDescription = null,
                            modifier = Modifier.size(52.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "هیچ موردی مطابق این فیلتر یافت نشد",
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else {
                when (viewMode) {
                    ManagementViewMode.TABLE -> {
                        // Real Spreadsheet / Table View with Horizontal Scroll
                        DeviceTableView(
                            devices = filteredList,
                            onStatusChange = { dev, newStatus ->
                                viewModel.updateDeviceStatus(dev, newStatus)
                            },
                            onPriorityChange = { dev, newStars ->
                                viewModel.updateDevicePriority(dev, newStars)
                            },
                            onQuickEdit = { quickEditDevice = it },
                            onFullEdit = { onNavigateToEdit(it) },
                            onDelete = { deviceToDelete = it },
                            onShare = { deviceToShare = it },
                            onClick = { onNavigateToDetail(it) },
                            modifier = Modifier.weight(1f)
                        )
                    }
                    ManagementViewMode.CARD -> {
                        // Detailed Cards View
                        LazyColumn(
                            modifier = Modifier.weight(1f),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            items(filteredList, key = { it.id }) { device ->
                                ManagementDeviceRow(
                                    device = device,
                                    onStatusChange = { newStatus ->
                                        viewModel.updateDeviceStatus(device, newStatus)
                                    },
                                    onPriorityChange = { newStars ->
                                        viewModel.updateDevicePriority(device, newStars)
                                    },
                                    onQuickEdit = { quickEditDevice = device },
                                    onFullEdit = { onNavigateToEdit(device) },
                                    onDelete = { deviceToDelete = device },
                                    onShare = { deviceToShare = device },
                                    onClick = { onNavigateToDetail(device) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Comprehensive Quick Edit Dialog with Photos, Live Caption & Direct Share
    quickEditDevice?.let { dev ->
        ComprehensiveEditDeviceDialog(
            device = dev,
            sellerProfile = sellerProfile,
            onDismiss = { quickEditDevice = null },
            onSave = { updated ->
                viewModel.saveDevice(updated) {
                    Toast.makeText(context, "تغییرات در جدول و لیست اصلی با موفقیت ذخیره شد ✓", Toast.LENGTH_SHORT).show()
                }
                quickEditDevice = null
            },
            onDirectShare = { updated ->
                viewModel.saveDevice(updated)
                quickEditDevice = null
                deviceToShare = updated
            }
        )
    }

    // Share messenger sheet (caption + photos to any messenger)
    deviceToShare?.let { device ->
        val caption = viewModel.getDeviceCaption(device)
        ShareMessengerSheet(
            device = device,
            caption = caption,
            onDismiss = { deviceToShare = null }
        )
    }

    // Delete Confirmation Dialog
    deviceToDelete?.let { device ->
        AlertDialog(
            onDismissRequest = { deviceToDelete = null },
            title = { Text("حذف دستگاه", fontWeight = FontWeight.Bold) },
            text = { Text("آیا از حذف دستگاه «${device.name}» اطمینان دارید؟ تغییر بلافاصله از جدول و لیست اصلی حذف و ذخیره خواهد شد.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.deleteDevice(device)
                        deviceToDelete = null
                        Toast.makeText(context, "دستگاه حذف شد", Toast.LENGTH_SHORT).show()
                    },
                    colors = ButtonDefaults.textButtonColors(contentColor = DangerRed)
                ) {
                    Text("حذف")
                }
            },
            dismissButton = {
                TextButton(onClick = { deviceToDelete = null }) {
                    Text("انصراف")
                }
            }
        )
    }
}

/**
 * Interactive Spreadsheet / Table Layout for Devices
 */
@Composable
private fun DeviceTableView(
    devices: List<Device>,
    onStatusChange: (Device, String) -> Unit,
    onPriorityChange: (Device, Int) -> Unit,
    onQuickEdit: (Device) -> Unit,
    onFullEdit: (Device) -> Unit,
    onDelete: (Device) -> Unit,
    onShare: (Device) -> Unit,
    onClick: (Device) -> Unit,
    modifier: Modifier = Modifier
) {
    val horizontalScrollState = rememberScrollState()

    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)),
        modifier = modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .horizontalScroll(horizontalScrollState)
        ) {
            // Table Header Row
            Surface(
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.7f),
                modifier = Modifier.width(760.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("عکس", fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.width(60.dp), textAlign = TextAlign.Center)
                    Text("نام و مدل دستگاه", fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.width(200.dp))
                    Text("قیمت کل", fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.width(110.dp))
                    Text("وضعیت جاری", fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.width(130.dp), textAlign = TextAlign.Center)
                    Text("اولویت (ستاره ⭐)", fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.width(130.dp), textAlign = TextAlign.Center)
                    Text("عملیات", fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.width(120.dp), textAlign = TextAlign.Center)
                }
            }

            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

            // Table Body
            LazyColumn(modifier = Modifier.width(760.dp)) {
                items(devices, key = { it.id }) { device ->
                    val imageList = device.getImageList()
                    val cover = imageList.firstOrNull()

                    Surface(
                        color = MaterialTheme.colorScheme.surface,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onClick(device) }
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 8.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Column 1: Photo & Count badge
                            Box(
                                modifier = Modifier
                                    .width(60.dp)
                                    .height(48.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(46.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(MaterialTheme.colorScheme.surfaceVariant)
                                        .clickable { onQuickEdit(device) },
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (cover != null) {
                                        val file = if (cover.startsWith("/")) File(cover) else cover
                                        AsyncImage(
                                            model = ImageRequest.Builder(LocalContext.current).data(file).crossfade(true).build(),
                                            contentDescription = null,
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier.fillMaxSize()
                                        )
                                    } else {
                                        Icon(
                                            imageVector = Icons.Default.AddPhotoAlternate,
                                            contentDescription = "بدون عکس",
                                            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                                            modifier = Modifier.size(20.dp)
                                        )
                                    }
                                }
                                if (imageList.size > 1) {
                                    Surface(
                                        color = PrimaryNavy,
                                        shape = CircleShape,
                                        modifier = Modifier
                                            .align(Alignment.BottomEnd)
                                            .size(16.dp)
                                    ) {
                                        Text(
                                            text = "${imageList.size}",
                                            color = Color.White,
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Bold,
                                            textAlign = TextAlign.Center,
                                            modifier = Modifier.fillMaxSize()
                                        )
                                    }
                                }
                            }

                            // Column 2: Name & Model
                            Column(modifier = Modifier.width(200.dp).padding(horizontal = 6.dp)) {
                                Text(
                                    text = device.name,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                val subText = listOfNotNull(
                                    device.model.ifBlank { null }?.let { "مدل: $it" },
                                    device.year.ifBlank { null }?.let { "سال: $it" }
                                ).joinToString(" | ")
                                if (subText.isNotBlank()) {
                                    Text(
                                        text = subText,
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }

                            // Column 3: Price
                            Column(modifier = Modifier.width(110.dp).padding(horizontal = 4.dp)) {
                                Text(
                                    text = if (device.totalPrice.isNotBlank()) device.totalPrice else "نامشخص",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (device.totalPrice.isNotBlank()) SuccessGreen else DangerRed,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                if (device.cashPercentage > 0 || device.installmentMonths > 0) {
                                    Text(
                                        text = "${device.cashPercentage}٪ نقد - ${device.installmentMonths} قسط",
                                        fontSize = 10.sp,
                                        color = AccentAmber,
                                        maxLines = 1
                                    )
                                }
                            }

                            // Column 4: Status Selector (Inline dropdown)
                            Box(
                                modifier = Modifier.width(130.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                StatusDropdownSelector(
                                    currentStatus = device.status,
                                    onStatusSelected = { newStatus -> onStatusChange(device, newStatus) }
                                )
                            }

                            // Column 5: Priority Stars (Inline star rating)
                            Box(
                                modifier = Modifier.width(130.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                StarRatingBar(
                                    rating = device.priorityStars,
                                    onRatingChanged = { newStars -> onPriorityChange(device, newStars) },
                                    starSize = 16.dp
                                )
                            }

                            // Column 6: Action buttons (Share, Edit, Delete)
                            Row(
                                modifier = Modifier.width(120.dp),
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                IconButton(
                                    onClick = { onShare(device) },
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Share,
                                        contentDescription = "ارسال پیام‌رسان",
                                        tint = PrimaryNavy,
                                        modifier = Modifier.size(17.dp)
                                    )
                                }

                                IconButton(
                                    onClick = { onQuickEdit(device) },
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.EditNote,
                                        contentDescription = "ویرایش سریع",
                                        tint = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.size(19.dp)
                                    )
                                }

                                IconButton(
                                    onClick = { onDelete(device) },
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Delete,
                                        contentDescription = "حذف",
                                        tint = DangerRed.copy(alpha = 0.8f),
                                        modifier = Modifier.size(17.dp)
                                    )
                                }
                            }
                        }
                    }
                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f))
                }
            }
        }
    }
}

/**
 * Detailed Card Row View for Devices
 */
@Composable
private fun ManagementDeviceRow(
    device: Device,
    onStatusChange: (String) -> Unit,
    onPriorityChange: (Int) -> Unit,
    onQuickEdit: () -> Unit,
    onFullEdit: () -> Unit,
    onDelete: () -> Unit,
    onShare: () -> Unit,
    onClick: () -> Unit
) {
    val imageList = device.getImageList()
    val cover = imageList.firstOrNull()

    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Thumbnail with photo count
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant),
                    contentAlignment = Alignment.Center
                ) {
                    if (cover != null) {
                        val file = if (cover.startsWith("/")) File(cover) else cover
                        AsyncImage(
                            model = ImageRequest.Builder(LocalContext.current).data(file).crossfade(true).build(),
                            contentDescription = null,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                    } else {
                        Icon(
                            imageVector = Icons.Default.PrecisionManufacturing,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                        )
                    }

                    if (imageList.isNotEmpty()) {
                        Surface(
                            color = PrimaryNavy.copy(alpha = 0.85f),
                            shape = RoundedCornerShape(topStart = 6.dp),
                            modifier = Modifier.align(Alignment.BottomEnd)
                        ) {
                            Text(
                                text = "${imageList.size} عکس",
                                fontSize = 9.sp,
                                color = Color.White,
                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.width(10.dp))

                // Info
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = device.name,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "مدل: ${if (device.model.isNotBlank()) device.model else "—"} | سال: ${if (device.year.isNotBlank()) device.year else "—"}",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "قیمت: ${if (device.totalPrice.isNotBlank()) device.totalPrice else "تعیین نشده"}",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (device.totalPrice.isNotBlank()) SuccessGreen else DangerRed,
                        maxLines = 1
                    )
                }

                // Actions: Share, Edit & Delete
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    IconButton(
                        onClick = onShare,
                        modifier = Modifier
                            .size(34.dp)
                            .background(PrimaryNavy.copy(alpha = 0.1f), CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Share,
                            contentDescription = "ارسال پیام‌رسان",
                            modifier = Modifier.size(16.dp),
                            tint = PrimaryNavy
                        )
                    }

                    IconButton(
                        onClick = onQuickEdit,
                        modifier = Modifier
                            .size(34.dp)
                            .background(MaterialTheme.colorScheme.surfaceVariant, CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Default.EditNote,
                            contentDescription = "ویرایش سریع و عکس‌ها",
                            modifier = Modifier.size(18.dp),
                            tint = PrimaryNavy
                        )
                    }

                    IconButton(
                        onClick = onDelete,
                        modifier = Modifier
                            .size(34.dp)
                            .background(DangerRed.copy(alpha = 0.1f), CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Delete,
                            contentDescription = "حذف دستگاه",
                            modifier = Modifier.size(16.dp),
                            tint = DangerRed
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f))
            Spacer(modifier = Modifier.height(8.dp))

            // Inline Controls Row: Status and Priority Stars
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Status selector
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(text = "وضعیت:", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.width(4.dp))
                    StatusDropdownSelector(
                        currentStatus = device.status,
                        onStatusSelected = onStatusChange
                    )
                }

                // Priority Stars
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(text = "اولویت:", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.width(4.dp))
                    StarRatingBar(
                        rating = device.priorityStars,
                        onRatingChanged = onPriorityChange,
                        starSize = 16.dp
                    )
                }
            }
        }
    }
}

/**
 * Comprehensive Quick Edit Dialog:
 * - Specifications (Name, Model, Year, Price, Installment)
 * - Status & Priority Stars
 * - Photo Selection / Management (Multi-photo picker, Camera)
 * - Real-time Live Caption Preview
 * - Direct Messenger Sharing (photos + caption in one message)
 * - Direct Database Save
 */
@Composable
private fun ComprehensiveEditDeviceDialog(
    device: Device,
    sellerProfile: com.example.data.model.SellerProfile,
    onDismiss: () -> Unit,
    onSave: (Device) -> Unit,
    onDirectShare: (Device) -> Unit
) {
    val context = LocalContext.current

    var name by remember { mutableStateOf(device.name) }
    var model by remember { mutableStateOf(device.model) }
    var year by remember { mutableStateOf(device.year) }
    var totalPrice by remember { mutableStateOf(device.totalPrice) }
    var cashPercentage by remember { mutableStateOf(if (device.cashPercentage > 0) device.cashPercentage.toString() else "") }
    var installmentMonths by remember { mutableStateOf(if (device.installmentMonths > 0) device.installmentMonths.toString() else "") }
    var status by remember { mutableStateOf(device.status) }
    var priorityStars by remember { mutableStateOf(device.priorityStars) }
    var imagePaths by remember { mutableStateOf(device.getImageList()) }

    var showCaptionPreview by remember { mutableStateOf(true) }

    // Live preview device and caption
    val cashInt = cashPercentage.toIntOrNull() ?: 0
    val monthsInt = installmentMonths.toIntOrNull() ?: 0

    val previewDevice = remember(name, model, year, totalPrice, cashInt, monthsInt, status, priorityStars, imagePaths) {
        device.copy(
            name = name.ifBlank { "نام دستگاه" },
            model = model,
            year = year,
            totalPrice = totalPrice,
            cashPercentage = cashInt,
            installmentMonths = monthsInt,
            status = status,
            priorityStars = priorityStars
        ).withImageList(imagePaths)
    }

    val liveCaption = remember(previewDevice, sellerProfile) {
        CaptionGenerator.generateCaption(previewDevice, sellerProfile, device.captionStyle)
    }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 8.dp,
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.92f)
                .padding(vertical = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "ویرایش مشخصات، عکس‌ها و کپشن",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "اعمال مستقیم در جدول و لیست اصلی",
                            fontSize = 10.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    IconButton(onClick = onDismiss, modifier = Modifier.size(28.dp)) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "بستن")
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                Spacer(modifier = Modifier.height(10.dp))

                // Scrollable Form Content
                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // 1. Photo Management Section
                    item {
                        Text(
                            text = "تصاویر دستگاه (${imagePaths.size} عکس):",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(6.dp))

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

                    // 2. Identity fields
                    item {
                        OutlinedTextField(
                            value = name,
                            onValueChange = { name = it },
                            label = { Text("نام دستگاه *") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp)
                        )
                    }

                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedTextField(
                                value = model,
                                onValueChange = { model = it },
                                label = { Text("مدل / مشخصه") },
                                singleLine = true,
                                modifier = Modifier.weight(1.2f),
                                shape = RoundedCornerShape(10.dp)
                            )
                            OutlinedTextField(
                                value = year,
                                onValueChange = { year = it },
                                label = { Text("سال ساخت") },
                                singleLine = true,
                                modifier = Modifier.weight(0.8f),
                                shape = RoundedCornerShape(10.dp)
                            )
                        }
                    }

                    // 3. Price & Payment
                    item {
                        OutlinedTextField(
                            value = totalPrice,
                            onValueChange = { totalPrice = it },
                            label = { Text("قیمت کل") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp)
                        )
                    }

                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedTextField(
                                value = cashPercentage,
                                onValueChange = { cashPercentage = it.filter { char -> char.isDigit() } },
                                label = { Text("درصد نقد (٪)") },
                                singleLine = true,
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp)
                            )
                            OutlinedTextField(
                                value = installmentMonths,
                                onValueChange = { installmentMonths = it.filter { char -> char.isDigit() } },
                                label = { Text("تعداد اقساط") },
                                singleLine = true,
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp)
                            )
                        }
                    }

                    // 4. Status & Priority Stars
                    item {
                        Surface(
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(10.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(text = "وضعیت دستگاه:", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    StatusDropdownSelector(
                                        currentStatus = status,
                                        onStatusSelected = { status = it }
                                    )
                                }

                                Column(horizontalAlignment = Alignment.End) {
                                    Text(text = "اولویت نمایش (ستاره):", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    StarRatingBar(
                                        rating = priorityStars,
                                        onRatingChanged = { priorityStars = it },
                                        starSize = 20.dp
                                    )
                                }
                            }
                        }
                    }

                    // 5. Dynamic Sales Caption Preview
                    item {
                        Surface(
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { showCaptionPreview = !showCaptionPreview },
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Default.Description,
                                            contentDescription = null,
                                            modifier = Modifier.size(16.dp),
                                            tint = PrimaryNavy
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = "پیش‌نمایش زنده متن کپشن فروش",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.sp,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                    }
                                    IconButton(
                                        onClick = { ShareHelper.copyToClipboard(context, liveCaption) },
                                        modifier = Modifier.size(26.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.ContentCopy,
                                            contentDescription = "کپی کپشن",
                                            tint = PrimaryNavy,
                                            modifier = Modifier.size(14.dp)
                                        )
                                    }
                                }

                                AnimatedVisibility(visible = showCaptionPreview) {
                                    Column {
                                        Spacer(modifier = Modifier.height(6.dp))
                                        Text(
                                            text = liveCaption,
                                            fontSize = 11.sp,
                                            lineHeight = 17.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Bottom Action Buttons: Direct Share & Save
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    // Send to messengers directly
                    Button(
                        onClick = {
                            val updated = previewDevice.copy(updatedAt = System.currentTimeMillis())
                            onDirectShare(updated)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0D9488)),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(imageVector = Icons.Default.Send, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "ارسال عکس‌ها و کپشن به پیام‌رسان‌ها (واتساپ، تلگرام و...)",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = {
                                val updated = previewDevice.copy(
                                    name = name.trim().ifBlank { device.name },
                                    model = model.trim(),
                                    year = year.trim(),
                                    totalPrice = totalPrice.trim(),
                                    cashPercentage = cashInt,
                                    installmentMonths = monthsInt,
                                    status = status,
                                    priorityStars = priorityStars,
                                    updatedAt = System.currentTimeMillis()
                                ).withImageList(imagePaths)
                                onSave(updated)
                            },
                            modifier = Modifier.weight(1.2f),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryNavy)
                        ) {
                            Icon(imageVector = Icons.Default.Check, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("اعمال و ذخیره در جدول", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }

                        OutlinedButton(
                            onClick = onDismiss,
                            modifier = Modifier.weight(0.8f),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("انصراف", fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}
