package com.example.ui.screens

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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.example.data.model.Device
import com.example.ui.components.IncompleteBadge
import com.example.ui.components.InfoChip
import com.example.ui.components.ShareMessengerSheet
import com.example.ui.components.StatCard
import com.example.ui.components.StatusBadge
import com.example.ui.theme.*
import com.example.ui.viewmodel.DeviceViewModel
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import com.example.util.CaptionGenerator
import com.example.util.ShareHelper
import com.example.util.StoragePermissionHelper
import java.io.File

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DeviceListScreen(
    viewModel: DeviceViewModel,
    onNavigateToDetail: (Device) -> Unit,
    onNavigateToEdit: (Device?) -> Unit,
    onNavigateToImport: () -> Unit
) {
    val context = LocalContext.current
    val devices by viewModel.filteredDevices.collectAsState()
    val allDevices by viewModel.allDevices.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val selectedFilter by viewModel.selectedFilter.collectAsState()
    val sellerProfile by viewModel.sellerProfile.collectAsState()
    val selectedIds by viewModel.selectedDeviceIds.collectAsState()

    var showSearchBar by remember { mutableStateOf(false) }
    var deviceToShare by remember { mutableStateOf<Device?>(null) }
    var showFolderResultDialog by remember { mutableStateOf<StoragePermissionHelper.FolderCreationResult?>(null) }
    var showPermissionDeniedDialog by remember { mutableStateOf(false) }
    var showBulkDeleteConfirm by remember { mutableStateOf(false) }

    // Launcher for runtime Android storage permissions
    val storagePermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val anyGranted = permissions.values.any { it }
        if (anyGranted || StoragePermissionHelper.hasStoragePermission(context)) {
            val result = StoragePermissionHelper.createLocalDeviceFolders(context, allDevices)
            showFolderResultDialog = result
        } else {
            showPermissionDeniedDialog = true
        }
    }

    fun handleCreateFolders() {
        val result = StoragePermissionHelper.createLocalDeviceFolders(context, allDevices)
        showFolderResultDialog = result
    }

    val incompleteCount = remember(allDevices) { allDevices.count { it.isIncomplete } }
    val activeCount = remember(allDevices) { allDevices.count { it.status == Device.STATUS_ACTIVE } }
    val soldCount = remember(allDevices) { allDevices.count { it.status == Device.STATUS_SOLD } }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    if (showSearchBar) {
                        TextField(
                            value = searchQuery,
                            onValueChange = { viewModel.searchQuery.value = it },
                            placeholder = { Text("جستجوی نام دستگاه، مدل، سال...") },
                            singleLine = true,
                            colors = TextFieldDefaults.colors(
                                focusedContainerColor = Color.Transparent,
                                unfocusedContainerColor = Color.Transparent,
                                focusedIndicatorColor = Color.Transparent,
                                unfocusedIndicatorColor = Color.Transparent
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("search_input")
                        )
                    } else {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "دستگاه‌یار",
                                fontWeight = FontWeight.Black,
                                fontSize = 20.sp,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Surface(
                                color = PrimaryContainerLight,
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(
                                    text = "کپشن و فروش",
                                    fontSize = 11.sp,
                                    color = PrimaryNavy,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }
                },
                actions = {
                    IconButton(
                        onClick = {
                            showSearchBar = !showSearchBar
                            if (!showSearchBar) viewModel.searchQuery.value = ""
                        },
                        modifier = Modifier.testTag("toggle_search_button")
                    ) {
                        Icon(
                            imageVector = if (showSearchBar) Icons.Default.Close else Icons.Default.Search,
                            contentDescription = "جستجو"
                        )
                    }

                    IconButton(
                        onClick = { handleCreateFolders() },
                        modifier = Modifier.testTag("create_device_folders_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.CreateNewFolder,
                            contentDescription = "ایجاد پوشه‌های دستگاه‌ها در حافظه",
                            tint = MaterialTheme.colorScheme.secondary
                        )
                    }

                    IconButton(
                        onClick = onNavigateToImport,
                        modifier = Modifier.testTag("upload_excel_header_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.FileUpload,
                            contentDescription = "آپلود اکسل",
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { onNavigateToEdit(null) },
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text("افزودن دستگاه", fontWeight = FontWeight.Bold) },
                containerColor = PrimaryNavy,
                contentColor = Color.White,
                modifier = Modifier.testTag("add_device_fab")
            )
        },
        bottomBar = {
            if (selectedIds.isNotEmpty()) {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .navigationBarsPadding(),
                    shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant,
                    tonalElevation = 8.dp,
                    shadowElevation = 8.dp
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "${selectedIds.size} دستگاه انتخاب شده",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            TextButton(onClick = { viewModel.clearSelection() }) {
                                Text("لغو انتخاب", fontSize = 12.sp)
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedButton(
                                onClick = {
                                    val selectedList = allDevices.filter { selectedIds.contains(it.id) }
                                    val result = StoragePermissionHelper.createLocalDeviceFolders(context, selectedList)
                                    showFolderResultDialog = result
                                    viewModel.clearSelection()
                                },
                                modifier = Modifier.weight(1f),
                                contentPadding = PaddingValues(horizontal = 4.dp, vertical = 8.dp)
                            ) {
                                Icon(Icons.Default.FolderPlus, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("پوشه‌ها", fontSize = 11.sp)
                            }

                            OutlinedButton(
                                onClick = {
                                    viewModel.bulkUpdateStatus(selectedIds.toList(), Device.STATUS_ARCHIVED)
                                },
                                modifier = Modifier.weight(1f),
                                contentPadding = PaddingValues(horizontal = 4.dp, vertical = 8.dp)
                            ) {
                                Icon(Icons.Default.Archive, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("بایگانی", fontSize = 11.sp)
                            }

                            OutlinedButton(
                                onClick = {
                                    viewModel.bulkUpdateStatus(selectedIds.toList(), Device.STATUS_ACTIVE)
                                },
                                modifier = Modifier.weight(1f),
                                contentPadding = PaddingValues(horizontal = 4.dp, vertical = 8.dp)
                            ) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("فعال", fontSize = 11.sp)
                            }

                            Button(
                                onClick = { showBulkDeleteConfirm = true },
                                colors = ButtonDefaults.buttonColors(containerColor = DangerRed),
                                modifier = Modifier.weight(1f),
                                contentPadding = PaddingValues(horizontal = 4.dp, vertical = 8.dp)
                            ) {
                                Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(16.dp), tint = Color.White)
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("حذف", fontSize = 11.sp, color = Color.White)
                            }
                        }
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
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Stats summary row
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    StatCard(
                        title = "کل دستگاه‌ها",
                        value = "${allDevices.size}",
                        icon = Icons.Default.PrecisionManufacturing,
                        iconColor = PrimaryNavy,
                        modifier = Modifier.weight(1f)
                    )
                    StatCard(
                        title = "فعال فروش",
                        value = "$activeCount",
                        icon = Icons.Default.CheckCircle,
                        iconColor = SuccessGreen,
                        modifier = Modifier.weight(1f)
                    )
                    StatCard(
                        title = "نیازمند تکمیل",
                        value = "$incompleteCount",
                        icon = Icons.Default.Warning,
                        iconColor = if (incompleteCount > 0) DangerRed else Color.Gray,
                        modifier = Modifier
                            .weight(1f)
                            .clickable {
                                viewModel.selectedFilter.value =
                                    if (selectedFilter == "INCOMPLETE") "ALL" else "INCOMPLETE"
                            }
                    )
                }
            }

            // Filter Chips
            item {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    val filters = listOf(
                        "ALL" to "همه دستگاه‌ها (${allDevices.size})",
                        "ACTIVE" to "فعال برای فروش ($activeCount)",
                        "INCOMPLETE" to "اطلاعات ناقص ($incompleteCount)",
                        "SOLD" to "فروخته شده ($soldCount)",
                        "ARCHIVED" to "بایگانی"
                    )

                    items(filters) { (key, label) ->
                        FilterChip(
                            selected = selectedFilter == key,
                            onClick = { viewModel.selectedFilter.value = key },
                            label = { Text(label, fontSize = 12.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = if (key == "INCOMPLETE") DangerContainer else PrimaryNavy,
                                selectedLabelColor = if (key == "INCOMPLETE") DangerRed else Color.White
                            )
                        )
                    }
                }
            }

            // Incomplete Banner reminder if any
            if (incompleteCount > 0 && selectedFilter != "INCOMPLETE") {
                item {
                    Surface(
                        color = DangerContainer.copy(alpha = 0.7f),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { viewModel.selectedFilter.value = "INCOMPLETE" }
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.Warning,
                                contentDescription = null,
                                tint = DangerRed,
                                modifier = Modifier.size(22.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "$incompleteCount دستگاه اطلاعات ناقص دارند!",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp,
                                    color = DangerRed
                                )
                                Text(
                                    text = "جهت ثبت کامل مشخصات، قیمت، اقساط یا عکس کلیک کنید.",
                                    fontSize = 11.sp,
                                    color = Color(0xFF7F1D1D)
                                )
                            }
                            Icon(
                                imageVector = Icons.Default.ChevronLeft,
                                contentDescription = null,
                                tint = DangerRed
                            )
                        }
                    }
                }
            }

            // Empty state
            if (devices.isEmpty()) {
                item {
                    EmptyDevicesView(
                        onUploadClick = onNavigateToImport,
                        onAddManualClick = { onNavigateToEdit(null) },
                        onLoadSampleClick = { viewModel.loadSampleData() }
                    )
                }
            } else {
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "تعداد: ${devices.size} دستگاه",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        TextButton(
                            onClick = {
                                val allFilteredIds = devices.map { it.id }
                                if (selectedIds.containsAll(allFilteredIds)) {
                                    viewModel.clearSelection()
                                } else {
                                    viewModel.selectAllDevices(allFilteredIds)
                                }
                            }
                        ) {
                            Text(
                                text = if (selectedIds.containsAll(devices.map { it.id })) "لغو انتخاب همه" else "انتخاب همه (${devices.size})",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                // Device Items
                items(devices, key = { it.id }) { device ->
                    DeviceCardItem(
                        device = device,
                        isSelected = selectedIds.contains(device.id),
                        onSelectToggle = { viewModel.toggleDeviceSelection(device.id) },
                        onCardClick = { onNavigateToDetail(device) },
                        onEditClick = { onNavigateToEdit(device) },
                        onShareClick = { deviceToShare = device },
                        onCopyCaption = {
                            val caption = viewModel.getDeviceCaption(device)
                            ShareHelper.copyToClipboard(context, caption)
                        }
                    )
                }
            }

            item {
                Spacer(modifier = Modifier.height(80.dp)) // Fab clearance
            }
        }
    }

    // Messenger sharing bottom sheet
    deviceToShare?.let { device ->
        val caption = viewModel.getDeviceCaption(device)
        ShareMessengerSheet(
            device = device,
            caption = caption,
            onDismiss = { deviceToShare = null }
        )
    }

    // نتیجه ساخت پوشه‌های محلی دستگاه‌ها در حافظه
    showFolderResultDialog?.let { result ->
        AlertDialog(
            onDismissRequest = { showFolderResultDialog = null },
            title = {
                Text(
                    text = if (result.success) "ایجاد پوشه‌ها در حافظه" else "خطا در ایجاد پوشه‌ها",
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(result.message, fontSize = 13.sp)
                    if (result.basePath.isNotBlank()) {
                        Surface(
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = "مسیر ذخیره:\n${result.basePath}",
                                fontSize = 11.sp,
                                modifier = Modifier.padding(8.dp),
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showFolderResultDialog = null }) {
                    Text("متوجه شدم")
                }
            }
        )
    }

    // پیام عدم تأیید مجوز دسترسی به حافظه
    if (showPermissionDeniedDialog) {
        AlertDialog(
            onDismissRequest = { showPermissionDeniedDialog = false },
            title = {
                Text("نیاز به دسترسی به حافظه", fontWeight = FontWeight.Bold)
            },
            text = {
                Text(
                    "جهت ساخت خودکار پوشه برای هر دستگاه و انتقال تصاویر و مشخصات به حافظه دستگاه، لطفاً مجوز دسترسی به حافظه را تأیید فرمایید.",
                    fontSize = 13.sp
                )
            },
            confirmButton = {
                Button(onClick = {
                    showPermissionDeniedDialog = false
                    storagePermissionLauncher.launch(StoragePermissionHelper.getRequiredStoragePermissions())
                }) {
                    Text("درخواست مجدد مجوز")
                }
            },
            dismissButton = {
                TextButton(onClick = { showPermissionDeniedDialog = false }) {
                    Text("انصراف")
                }
            }
        )
    }

    // دیالوگ تأیید حذف دسته‌جمعی
    if (showBulkDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showBulkDeleteConfirm = false },
            title = { Text("حذف ${selectedIds.size} دستگاه", fontWeight = FontWeight.Bold) },
            text = { Text("آیا از حذف دستگاه‌های انتخاب‌شده اطمینان دارید؟ این عمل غیرقابل بازگشت است.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.bulkDeleteDevices(selectedIds.toList())
                        showBulkDeleteConfirm = false
                    },
                    colors = ButtonDefaults.textButtonColors(contentColor = DangerRed)
                ) {
                    Text("حذف نهایی")
                }
            },
            dismissButton = {
                TextButton(onClick = { showBulkDeleteConfirm = false }) {
                    Text("انصراف")
                }
            }
        )
    }
}

@Composable
fun DeviceCardItem(
    device: Device,
    isSelected: Boolean,
    onSelectToggle: () -> Unit,
    onCardClick: () -> Unit,
    onEditClick: () -> Unit,
    onShareClick: () -> Unit,
    onCopyCaption: () -> Unit
) {
    val imageList = device.getImageList()
    val coverImage = imageList.firstOrNull()

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.35f) else MaterialTheme.colorScheme.surface
        ),
        border = if (isSelected) BorderStroke(2.dp, PrimaryNavy) else null,
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onCardClick)
            .testTag("device_card_${device.id}")
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            // Top Row: Checkbox, Badges & Status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(
                        checked = isSelected,
                        onCheckedChange = { onSelectToggle() },
                        modifier = Modifier.size(28.dp).testTag("checkbox_${device.id}")
                    )
                    StatusBadge(status = device.status)
                    if (device.isIncomplete) {
                        IncompleteBadge(onClick = onEditClick)
                    }
                }

                if (imageList.isNotEmpty()) {
                    Surface(
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.PhotoLibrary,
                                contentDescription = null,
                                modifier = Modifier.size(13.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "${imageList.size} عکس",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Main Content Row (Thumbnail + Details)
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.Top
            ) {
                // Image Thumbnail
                Box(
                    modifier = Modifier
                        .size(86.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant),
                    contentAlignment = Alignment.Center
                ) {
                    if (coverImage != null) {
                        val imgFile = if (coverImage.startsWith("/")) File(coverImage) else coverImage
                        AsyncImage(
                            model = ImageRequest.Builder(LocalContext.current)
                                .data(imgFile)
                                .crossfade(true)
                                .build(),
                            contentDescription = device.name,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                    } else {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                imageVector = Icons.Default.PrecisionManufacturing,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                                modifier = Modifier.size(32.dp)
                            )
                            Text(
                                text = "بدون عکس",
                                fontSize = 9.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.width(12.dp))

                // Info Column
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = device.name,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )

                    if (device.model.isNotBlank()) {
                        Text(
                            text = "مدل: ${device.model}",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    // Chips row
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        if (device.year.isNotBlank()) {
                            InfoChip(icon = Icons.Default.CalendarToday, text = "ساخت ${device.year}")
                        }
                        if (device.condition.isNotBlank()) {
                            InfoChip(icon = Icons.Default.Star, text = device.condition)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Pricing & Payment Box
            Surface(
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 10.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "قیمت کل",
                            fontSize = 10.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = if (device.totalPrice.isNotBlank()) device.totalPrice else "تعیین نشده (ناقص)",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (device.totalPrice.isNotBlank()) SuccessGreen else DangerRed
                        )
                    }

                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = "شرایط پرداخت",
                            fontSize = 10.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        val paymentStr = when {
                            device.cashPercentage > 0 && device.installmentMonths > 0 ->
                                "${device.cashPercentage}٪ نقد + ${device.installmentMonths} قسط"
                            device.cashPercentage > 0 -> "${device.cashPercentage}٪ نقدی"
                            device.installmentMonths > 0 -> "${device.installmentMonths} قسط ماهیانه"
                            else -> "شرایط وارد نشده"
                        }
                        Text(
                            text = paymentStr,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = AccentAmber
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Action Buttons Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Share to messengers
                Button(
                    onClick = onShareClick,
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryNavy),
                    modifier = Modifier.weight(1.3f)
                ) {
                    Icon(imageVector = Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("ارسال و کپشن", fontSize = 12.sp)
                }

                // Copy caption
                FilledTonalButton(
                    onClick = onCopyCaption,
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(imageVector = Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("کپی متن", fontSize = 12.sp)
                }

                // Edit
                IconButton(
                    onClick = onEditClick,
                    modifier = Modifier
                        .size(40.dp)
                        .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(10.dp))
                ) {
                    Icon(
                        imageVector = Icons.Default.Edit,
                        contentDescription = "ویرایش",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun EmptyDevicesView(
    onUploadClick: () -> Unit,
    onAddManualClick: () -> Unit,
    onLoadSampleClick: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 24.dp)
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
                    imageVector = Icons.Default.PrecisionManufacturing,
                    contentDescription = null,
                    tint = PrimaryNavy,
                    modifier = Modifier.size(36.dp)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "هنوز دستگاهی ثبت نشده است",
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "می‌توانید فایل اکسل دستگاه‌های خود را آپلود کنید تا کپشن‌های فروش به صورت خودکار تولید شوند، یا اطلاعات را دستی وارد کنید.",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                lineHeight = 18.sp
            )

            Spacer(modifier = Modifier.height(20.dp))

            Button(
                onClick = onUploadClick,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryNavy),
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(imageVector = Icons.Default.FileUpload, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("آپلود فایل اکسل دستگاه‌ها (.xlsx / .csv)", fontWeight = FontWeight.Bold)
            }

            Spacer(modifier = Modifier.height(10.dp))

            OutlinedButton(
                onClick = onAddManualClick,
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("ثبت دستی دستگاه جدید")
            }

            Spacer(modifier = Modifier.height(10.dp))

            TextButton(
                onClick = onLoadSampleClick,
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(imageVector = Icons.Default.Bolt, contentDescription = null, tint = AccentAmber)
                Spacer(modifier = Modifier.width(6.dp))
                Text("بارگذاری ۵ دستگاه نمونه برای تست سریع", color = AccentAmber, fontWeight = FontWeight.Bold)
            }
        }
    }
}
