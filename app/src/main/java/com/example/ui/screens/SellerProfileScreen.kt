package com.example.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import com.example.data.model.SellerProfile
import com.example.ui.theme.PrimaryNavy
import com.example.ui.viewmodel.DeviceViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SellerProfileScreen(
    viewModel: DeviceViewModel,
    onNavigateToList: () -> Unit
) {
    val context = LocalContext.current
    val currentProfile by viewModel.sellerProfile.collectAsState()

    var businessName by remember(currentProfile) { mutableStateOf(currentProfile.businessName) }
    var phone1 by remember(currentProfile) { mutableStateOf(currentProfile.phone1) }
    var phone2 by remember(currentProfile) { mutableStateOf(currentProfile.phone2) }
    var whatsappNumber by remember(currentProfile) { mutableStateOf(currentProfile.whatsappNumber) }
    var telegramId by remember(currentProfile) { mutableStateOf(currentProfile.telegramId) }
    var eitaaId by remember(currentProfile) { mutableStateOf(currentProfile.eitaaId) }
    var baleId by remember(currentProfile) { mutableStateOf(currentProfile.baleId) }
    var instagramId by remember(currentProfile) { mutableStateOf(currentProfile.instagramId) }
    var address by remember(currentProfile) { mutableStateOf(currentProfile.address) }
    var footerNote by remember(currentProfile) { mutableStateOf(currentProfile.footerNote) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "پروفایل و اطلاعات تماس فروشنده",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold
                    )
                },
                actions = {
                    TextButton(
                        onClick = {
                            val updated = SellerProfile(
                                id = 1,
                                businessName = businessName.trim(),
                                phone1 = phone1.trim(),
                                phone2 = phone2.trim(),
                                whatsappNumber = whatsappNumber.trim(),
                                telegramId = telegramId.trim(),
                                eitaaId = eitaaId.trim(),
                                baleId = baleId.trim(),
                                instagramId = instagramId.trim(),
                                address = address.trim(),
                                footerNote = footerNote.trim()
                            )
                            viewModel.saveSellerProfile(updated)
                            Toast.makeText(context, "اطلاعات پروفایل ذخیره شد و در انتهای کپشن‌ها اعمال می‌شود ✓", Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier.testTag("save_profile_button")
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
            // Explanatory Banner
            item {
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(imageVector = Icons.Default.ContactPhone, contentDescription = null, tint = PrimaryNavy)
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "این اطلاعات به صورت خودکار در انتهای تمام کپشن‌های دستگاه‌ها اضافه می‌شود و برای دفعات بعدی ذخیره می‌ماند.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                            lineHeight = 18.sp
                        )
                    }
                }
            }

            // Company & Phone Card
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = "مشخصات بازرگانی و شماره‌های تماس",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )

                        OutlinedTextField(
                            value = businessName,
                            onValueChange = { businessName = it },
                            label = { Text("نام مجموعه / شرکت / بازرگانی") },
                            placeholder = { Text("مثال: بازرگانی ماشین‌آلات صنعتی نوین") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            leadingIcon = { Icon(Icons.Default.Business, contentDescription = null) }
                        )

                        OutlinedTextField(
                            value = phone1,
                            onValueChange = { phone1 = it },
                            label = { Text("شماره همراه ۱ (مشاوره و خرید)") },
                            placeholder = { Text("0912xxxxxxx") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            leadingIcon = { Icon(Icons.Default.PhoneIphone, contentDescription = null) }
                        )

                        OutlinedTextField(
                            value = phone2,
                            onValueChange = { phone2 = it },
                            label = { Text("شماره تماس ۲ / تلفن دفتر") },
                            placeholder = { Text("021xxxxxxxx") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            leadingIcon = { Icon(Icons.Default.Call, contentDescription = null) }
                        )

                        OutlinedTextField(
                            value = address,
                            onValueChange = { address = it },
                            label = { Text("آدرس محل بازدید و دفتر") },
                            placeholder = { Text("مثال: تهران، جاده مخصوص کرج...") },
                            modifier = Modifier.fillMaxWidth(),
                            leadingIcon = { Icon(Icons.Default.Place, contentDescription = null) }
                        )
                    }
                }
            }

            // Messengers Card
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = "آیدی و کانال در پیام‌رسان‌ها",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )

                        OutlinedTextField(
                            value = baleId,
                            onValueChange = { baleId = it },
                            label = { Text("آیدی یا لینک کانال در پیام‌رسان بله") },
                            placeholder = { Text("@MyChannel_bale") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            leadingIcon = { Icon(Icons.Default.Send, contentDescription = null) }
                        )

                        OutlinedTextField(
                            value = eitaaId,
                            onValueChange = { eitaaId = it },
                            label = { Text("آیدی یا لینک کانال در پیام‌رسان ایتا") },
                            placeholder = { Text("@MyChannel_eitaa") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            leadingIcon = { Icon(Icons.Default.Send, contentDescription = null) }
                        )

                        OutlinedTextField(
                            value = telegramId,
                            onValueChange = { telegramId = it },
                            label = { Text("آیدی یا لینک کانال در تلگرام") },
                            placeholder = { Text("@MyChannel_telegram") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            leadingIcon = { Icon(Icons.Default.Send, contentDescription = null) }
                        )

                        OutlinedTextField(
                            value = whatsappNumber,
                            onValueChange = { whatsappNumber = it },
                            label = { Text("شماره یا لینک ارتباط در واتساپ") },
                            placeholder = { Text("0912xxxxxxx") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            leadingIcon = { Icon(Icons.Default.Chat, contentDescription = null) }
                        )

                        OutlinedTextField(
                            value = instagramId,
                            onValueChange = { instagramId = it },
                            label = { Text("پیج اینستاگرام") },
                            placeholder = { Text("my_page_id") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            leadingIcon = { Icon(Icons.Default.CameraAlt, contentDescription = null) }
                        )
                    }
                }
            }

            // Custom Footer Note Card
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text(
                            text = "یادداشت پایانی کپشن‌ها (سفارشی)",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )

                        OutlinedTextField(
                            value = footerNote,
                            onValueChange = { footerNote = it },
                            label = { Text("متن دلخواه انتهای کپشن") },
                            placeholder = { Text("مثال: امکان تست فنی حضوری، ضمانت بازگشت وجه، ارسال به سراسر کشور...") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(min = 90.dp, max = 150.dp)
                        )
                    }
                }
            }

            // Preview of the Footer
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = "پیش‌نمایش بخش پایانی کپشن:",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = PrimaryNavy
                        )

                        Divider(modifier = Modifier.padding(vertical = 4.dp))

                        if (businessName.isNotBlank()) Text("🏢 $businessName", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        Text("📞 جهت مشاوره، استعلام قیمت و خرید:", fontSize = 11.sp)
                        if (phone1.isNotBlank()) Text("📲 تماس: $phone1", fontSize = 11.sp)
                        if (phone2.isNotBlank()) Text("☎️ دفتر: $phone2", fontSize = 11.sp)
                        if (baleId.isNotBlank()) Text("🔸 بله: $baleId", fontSize = 11.sp)
                        if (eitaaId.isNotBlank()) Text("🔸 ایتا: $eitaaId", fontSize = 11.sp)
                        if (telegramId.isNotBlank()) Text("🔸 تلگرام: $telegramId", fontSize = 11.sp)
                        if (whatsappNumber.isNotBlank()) Text("🔸 واتساپ: $whatsappNumber", fontSize = 11.sp)
                        if (address.isNotBlank()) Text("📍 آدرس: $address", fontSize = 11.sp)
                        if (footerNote.isNotBlank()) Text("✨ $footerNote", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }

            // Save Button
            item {
                Button(
                    onClick = {
                        val updated = SellerProfile(
                            id = 1,
                            businessName = businessName.trim(),
                            phone1 = phone1.trim(),
                            phone2 = phone2.trim(),
                            whatsappNumber = whatsappNumber.trim(),
                            telegramId = telegramId.trim(),
                            eitaaId = eitaaId.trim(),
                            baleId = baleId.trim(),
                            instagramId = instagramId.trim(),
                            address = address.trim(),
                            footerNote = footerNote.trim()
                        )
                        viewModel.saveSellerProfile(updated)
                        Toast.makeText(context, "اطلاعات با موفقیت ذخیره شد ✓", Toast.LENGTH_SHORT).show()
                    },
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryNavy),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp)
                ) {
                    Icon(imageVector = Icons.Default.Save, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("ذخیره پروفایل برای همه کپشن‌ها", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}
