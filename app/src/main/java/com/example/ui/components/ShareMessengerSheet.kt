package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.model.Device
import com.example.ui.theme.PrimaryNavy
import com.example.util.ShareHelper

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShareMessengerSheet(
    device: Device,
    caption: String,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val imageList = device.getImageList()

    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        val isDesktopOrTablet = maxWidth >= 600.dp

        if (isDesktopOrTablet) {
            Dialog(onDismissRequest = onDismiss) {
                Surface(
                    modifier = Modifier
                        .widthIn(max = 520.dp)
                        .fillMaxWidth(),
                    shape = RoundedCornerShape(24.dp),
                    color = MaterialTheme.colorScheme.surface,
                    tonalElevation = 8.dp
                ) {
                    ShareMessengerContent(
                        device = device,
                        caption = caption,
                        imageList = imageList,
                        onDismiss = onDismiss
                    )
                }
            }
        } else {
            ModalBottomSheet(
                onDismissRequest = onDismiss,
                sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
                containerColor = MaterialTheme.colorScheme.surface,
                shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
            ) {
                ShareMessengerContent(
                    device = device,
                    caption = caption,
                    imageList = imageList,
                    onDismiss = onDismiss
                )
            }
        }
    }
}

@Composable
private fun ShareMessengerContent(
    device: Device,
    caption: String,
    imageList: List<String>,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 20.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onDismiss) {
                Icon(imageVector = Icons.Default.Close, contentDescription = "بستن")
            }
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "ارسال به کانال و گروه‌ها",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "${device.name} (${if (imageList.isNotEmpty()) "${imageList.size} عکس" else "بدون عکس"})",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            IconButton(onClick = {
                ShareHelper.copyToClipboard(context, caption)
            }) {
                Icon(imageVector = Icons.Default.ContentCopy, contentDescription = "کپی کپشن", tint = PrimaryNavy)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Notice badge
        Surface(
            color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Info,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "متن کپشن به همراه ${imageList.size} تصویر انتخاب شده برای دستگاه به پیام‌رسان منتقل می‌شود.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Messengers Grid
        Text(
            text = "پیام‌رسان مورد نظر را انتخاب کنید:",
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.fillMaxWidth(),
            textAlign = TextAlign.Right
        )

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            MessengerItem(
                name = "بله (Bale)",
                color = Color(0xFF009688),
                icon = "🌿",
                onClick = {
                    ShareHelper.shareDevice(context, caption, imageList, ShareHelper.TargetMessenger.BALE)
                    onDismiss()
                }
            )
            MessengerItem(
                name = "ایتا (Eitaa)",
                color = Color(0xFFE65100),
                icon = "🟠",
                onClick = {
                    ShareHelper.shareDevice(context, caption, imageList, ShareHelper.TargetMessenger.EITAA)
                    onDismiss()
                }
            )
            MessengerItem(
                name = "واتساپ",
                color = Color(0xFF25D366),
                icon = "💬",
                onClick = {
                    ShareHelper.shareDevice(context, caption, imageList, ShareHelper.TargetMessenger.WHATSAPP)
                    onDismiss()
                }
            )
            MessengerItem(
                name = "تلگرام",
                color = Color(0xFF0088CC),
                icon = "✈️",
                onClick = {
                    ShareHelper.shareDevice(context, caption, imageList, ShareHelper.TargetMessenger.TELEGRAM)
                    onDismiss()
                }
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Button(
                onClick = {
                    ShareHelper.shareDevice(context, caption, imageList, ShareHelper.TargetMessenger.ALL)
                    onDismiss()
                },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryNavy)
            ) {
                Icon(imageVector = Icons.Default.Share, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("سایر برنامه‌ها")
            }

            OutlinedButton(
                onClick = {
                    ShareHelper.copyToClipboard(context, caption)
                },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(imageVector = Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("کپی متن")
            }
        }
    }
}

@Composable
private fun MessengerItem(
    name: String,
    color: Color,
    icon: String,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(8.dp)
    ) {
        Box(
            modifier = Modifier
                .size(54.dp)
                .clip(CircleShape)
                .background(color.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Text(text = icon, fontSize = 24.sp)
        }
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = name,
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.onSurface,
            textAlign = TextAlign.Center
        )
    }
}
