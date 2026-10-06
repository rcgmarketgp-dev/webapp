package com.example.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.data.model.Device
import com.example.ui.screens.*
import com.example.ui.theme.PrimaryNavy
import com.example.ui.viewmodel.DeviceViewModel

sealed class AppScreen {
    object DeviceList : AppScreen()
    object DeviceManagement : AppScreen()
    data class DeviceDetail(val deviceId: Long) : AppScreen()
    data class DeviceEdit(val deviceId: Long?) : AppScreen()
    object ExcelImport : AppScreen()
    object SellerProfile : AppScreen()
}

@Composable
fun MainApp(
    viewModel: DeviceViewModel = viewModel()
) {
    // Force RTL for Persian language
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        var currentScreen by remember { mutableStateOf<AppScreen>(AppScreen.DeviceList) }
        val allDevices by viewModel.allDevices.collectAsState()

        // Selected device state
        val selectedDevice by viewModel.selectedDevice.collectAsState()

        val isMainDestination = when (currentScreen) {
            is AppScreen.DeviceList,
            is AppScreen.DeviceManagement,
            is AppScreen.ExcelImport,
            is AppScreen.SellerProfile -> true
            else -> false
        }

        Scaffold(
            bottomBar = {
                if (isMainDestination) {
                    NavigationBar(
                        containerColor = MaterialTheme.colorScheme.surface,
                        tonalElevation = 8.dp,
                        modifier = Modifier.testTag("main_navigation_bar")
                    ) {
                        // 1. Devices Tab
                        NavigationBarItem(
                            selected = currentScreen is AppScreen.DeviceList,
                            onClick = { currentScreen = AppScreen.DeviceList },
                            icon = {
                                Icon(
                                    imageVector = if (currentScreen is AppScreen.DeviceList)
                                        Icons.Filled.PrecisionManufacturing
                                    else
                                        Icons.Outlined.PrecisionManufacturing,
                                    contentDescription = "دستگاه‌ها"
                                )
                            },
                            label = { Text("دستگاه‌ها", fontSize = 11.sp) },
                            modifier = Modifier.testTag("nav_devices")
                        )

                        // 2. Management Screen Tab
                        NavigationBarItem(
                            selected = currentScreen is AppScreen.DeviceManagement,
                            onClick = { currentScreen = AppScreen.DeviceManagement },
                            icon = {
                                Icon(
                                    imageVector = if (currentScreen is AppScreen.DeviceManagement)
                                        Icons.Filled.ListAlt
                                    else
                                        Icons.Outlined.ListAlt,
                                    contentDescription = "مدیریت لیست"
                                )
                            },
                            label = { Text("جدول دستگاه‌ها", fontSize = 11.sp) },
                            modifier = Modifier.testTag("nav_management")
                        )

                        // 3. Excel Import Tab
                        NavigationBarItem(
                            selected = currentScreen is AppScreen.ExcelImport,
                            onClick = { currentScreen = AppScreen.ExcelImport },
                            icon = {
                                Icon(
                                    imageVector = if (currentScreen is AppScreen.ExcelImport)
                                        Icons.Filled.FileUpload
                                    else
                                        Icons.Outlined.FileUpload,
                                    contentDescription = "آپلود اکسل"
                                )
                            },
                            label = { Text("ورود اکسل", fontSize = 11.sp) },
                            modifier = Modifier.testTag("nav_import")
                        )

                        // 4. Add Device Tab
                        NavigationBarItem(
                            selected = currentScreen is AppScreen.DeviceEdit && (currentScreen as AppScreen.DeviceEdit).deviceId == null,
                            onClick = {
                                viewModel.selectDevice(null)
                                currentScreen = AppScreen.DeviceEdit(null)
                            },
                            icon = {
                                Icon(
                                    imageVector = Icons.Default.AddCircle,
                                    contentDescription = "افزودن دستی"
                                )
                            },
                            label = { Text("افزودن دستی", fontSize = 11.sp) },
                            modifier = Modifier.testTag("nav_add")
                        )

                        // 5. Seller Profile Tab
                        NavigationBarItem(
                            selected = currentScreen is AppScreen.SellerProfile,
                            onClick = { currentScreen = AppScreen.SellerProfile },
                            icon = {
                                Icon(
                                    imageVector = if (currentScreen is AppScreen.SellerProfile)
                                        Icons.Filled.Store
                                    else
                                        Icons.Outlined.Store,
                                    contentDescription = "پروفایل فروشنده"
                                )
                            },
                            label = { Text("اطلاعات تماس", fontSize = 11.sp) },
                            modifier = Modifier.testTag("nav_profile")
                        )
                    }
                }
            }
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                when (val screen = currentScreen) {
                    is AppScreen.DeviceList -> {
                        DeviceListScreen(
                            viewModel = viewModel,
                            onNavigateToDetail = { device ->
                                viewModel.selectDevice(device)
                                currentScreen = AppScreen.DeviceDetail(device.id)
                            },
                            onNavigateToEdit = { device ->
                                viewModel.selectDevice(device)
                                currentScreen = AppScreen.DeviceEdit(device?.id)
                            },
                            onNavigateToImport = {
                                currentScreen = AppScreen.ExcelImport
                            }
                        )
                    }

                    is AppScreen.DeviceManagement -> {
                        DeviceManagementScreen(
                            viewModel = viewModel,
                            onNavigateToEdit = { device ->
                                viewModel.selectDevice(device)
                                currentScreen = AppScreen.DeviceEdit(device?.id)
                            },
                            onNavigateToDetail = { device ->
                                viewModel.selectDevice(device)
                                currentScreen = AppScreen.DeviceDetail(device.id)
                            }
                        )
                    }

                    is AppScreen.DeviceDetail -> {
                        val device = allDevices.firstOrNull { it.id == screen.deviceId } ?: selectedDevice
                        if (device != null) {
                            DeviceDetailScreen(
                                device = device,
                                viewModel = viewModel,
                                onBack = { currentScreen = AppScreen.DeviceList },
                                onNavigateToEdit = { dev ->
                                    viewModel.selectDevice(dev)
                                    currentScreen = AppScreen.DeviceEdit(dev.id)
                                }
                            )
                        } else {
                            LaunchedEffect(Unit) {
                                currentScreen = AppScreen.DeviceList
                            }
                        }
                    }

                    is AppScreen.DeviceEdit -> {
                        val device = if (screen.deviceId != null) {
                            allDevices.firstOrNull { it.id == screen.deviceId } ?: selectedDevice
                        } else null

                        DeviceEditScreen(
                            device = device,
                            viewModel = viewModel,
                            onBack = {
                                currentScreen = if (device != null) {
                                    AppScreen.DeviceDetail(device.id)
                                } else {
                                    AppScreen.DeviceList
                                }
                            },
                            onSaved = { savedDevice ->
                                viewModel.selectDevice(savedDevice)
                                currentScreen = AppScreen.DeviceDetail(savedDevice.id)
                            }
                        )
                    }

                    is AppScreen.ExcelImport -> {
                        ExcelImportScreen(
                            viewModel = viewModel,
                            onNavigateToList = { currentScreen = AppScreen.DeviceList }
                        )
                    }

                    is AppScreen.SellerProfile -> {
                        SellerProfileScreen(
                            viewModel = viewModel,
                            onNavigateToList = { currentScreen = AppScreen.DeviceList }
                        )
                    }
                }
            }
        }
    }
}
