package com.example.ui.viewmodel

import android.app.Application
import android.content.Context
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.database.AppDatabase
import com.example.data.model.Device
import com.example.data.model.SellerProfile
import com.example.data.repository.DeviceRepository
import com.example.util.CaptionGenerator
import com.example.util.ExcelParser
import com.example.util.SampleData
import com.example.util.ShareHelper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

sealed class ImportState {
    object Idle : ImportState()
    object Loading : ImportState()
    data class Success(val count: Int, val detectedColumns: List<String>) : ImportState()
    data class Error(val message: String) : ImportState()
}

class DeviceViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: DeviceRepository

    val allDevices: StateFlow<List<Device>>
    val sellerProfile: StateFlow<SellerProfile>

    val searchQuery = MutableStateFlow("")
    val selectedFilter = MutableStateFlow("ALL") // ALL, ACTIVE, INCOMPLETE, ARCHIVED, SOLD

    private val _importState = MutableStateFlow<ImportState>(ImportState.Idle)
    val importState: StateFlow<ImportState> = _importState.asStateFlow()

    private val _selectedDevice = MutableStateFlow<Device?>(null)
    val selectedDevice: StateFlow<Device?> = _selectedDevice.asStateFlow()

    init {
        val database = AppDatabase.getDatabase(application)
        repository = DeviceRepository(database.deviceDao(), database.sellerProfileDao())

        allDevices = repository.allDevices.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

        sellerProfile = repository.sellerProfile.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = SampleData.defaultProfile
        )

        // Seed default profile if none exists
        viewModelScope.launch(Dispatchers.IO) {
            val existing = repository.getSellerProfileDirect()
            if (existing == null) {
                repository.saveSellerProfile(SampleData.defaultProfile)
            }
        }
    }

    val filteredDevices: StateFlow<List<Device>> = combine(
        allDevices,
        searchQuery,
        selectedFilter
    ) { devices, query, filter ->
        devices.filter { device ->
            val matchesFilter = when (filter) {
                "ACTIVE" -> device.status == Device.STATUS_ACTIVE
                "OVERHAUL" -> device.status == Device.STATUS_OVERHAUL
                "IN_SERVICE" -> device.status == Device.STATUS_IN_SERVICE
                "INCOMPLETE" -> device.isIncomplete
                "ARCHIVED" -> device.status == Device.STATUS_ARCHIVED
                "SOLD" -> device.status == Device.STATUS_SOLD
                else -> true // ALL
            }

            val q = query.trim().lowercase()
            val matchesQuery = if (q.isBlank()) true else {
                device.name.lowercase().contains(q) ||
                        device.model.lowercase().contains(q) ||
                        device.year.lowercase().contains(q) ||
                        device.specifications.lowercase().contains(q) ||
                        device.location.lowercase().contains(q)
            }

            matchesFilter && matchesQuery
        }.sortedWith(
            compareByDescending<Device> { it.priorityStars }
                .thenByDescending { it.updatedAt }
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    fun updateDevicePriority(device: Device, stars: Int) {
        viewModelScope.launch(Dispatchers.IO) {
            val updated = device.copy(priorityStars = stars.coerceIn(0, 5), updatedAt = System.currentTimeMillis())
            repository.updateDevice(updated)
            if (_selectedDevice.value?.id == device.id) {
                _selectedDevice.value = updated
            }
        }
    }

    fun selectDevice(device: Device?) {
        _selectedDevice.value = device
    }

    fun selectDeviceById(id: Long) {
        viewModelScope.launch(Dispatchers.IO) {
            val device = repository.getDeviceDirect(id)
            _selectedDevice.value = device
        }
    }

    fun importExcelFile(context: Context, uri: Uri) {
        viewModelScope.launch(Dispatchers.IO) {
            _importState.value = ImportState.Loading
            val parseResult = ExcelParser.parseFile(context, uri)
            if (parseResult.errorMessage != null) {
                _importState.value = ImportState.Error(parseResult.errorMessage)
            } else if (parseResult.devices.isEmpty()) {
                _importState.value = ImportState.Error("هیچ دستگاهی در فایل اکسل شناسایی نشد.")
            } else {
                repository.insertDevices(parseResult.devices)
                _importState.value = ImportState.Success(
                    count = parseResult.devices.size,
                    detectedColumns = parseResult.detectedColumns
                )
            }
        }
    }

    fun resetImportState() {
        _importState.value = ImportState.Idle
    }

    fun loadSampleData() {
        viewModelScope.launch(Dispatchers.IO) {
            repository.insertDevices(SampleData.sampleDevices)
        }
    }

    fun saveDevice(device: Device, onSaved: (Long) -> Unit = {}) {
        viewModelScope.launch(Dispatchers.IO) {
            val id = if (device.id == 0L) {
                repository.insertDevice(device)
            } else {
                repository.updateDevice(device)
                device.id
            }
            // Update selected device if matching
            val updated = repository.getDeviceDirect(id)
            _selectedDevice.value = updated
            onSaved(id)
        }
    }

    fun deleteDevice(device: Device) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.deleteDevice(device)
            if (_selectedDevice.value?.id == device.id) {
                _selectedDevice.value = null
            }
        }
    }

    fun updateDeviceStatus(device: Device, newStatus: String) {
        viewModelScope.launch(Dispatchers.IO) {
            val updated = device.copy(status = newStatus, updatedAt = System.currentTimeMillis())
            repository.updateDevice(updated)
            if (_selectedDevice.value?.id == device.id) {
                _selectedDevice.value = updated
            }
        }
    }

    fun addPhotoToDevice(context: Context, device: Device, photoUri: Uri) {
        viewModelScope.launch(Dispatchers.IO) {
            val savedPath = ShareHelper.saveImageToInternalStorage(context, photoUri)
            if (savedPath != null) {
                val currentList = device.getImageList().toMutableList()
                currentList.add(savedPath)
                val updated = device.withImageList(currentList)
                repository.updateDevice(updated)
                _selectedDevice.value = updated
            }
        }
    }

    fun removePhotoFromDevice(device: Device, photoPath: String) {
        viewModelScope.launch(Dispatchers.IO) {
            val currentList = device.getImageList().toMutableList()
            currentList.remove(photoPath)
            val updated = device.withImageList(currentList)
            repository.updateDevice(updated)
            _selectedDevice.value = updated
        }
    }

    fun setCoverPhoto(device: Device, photoPath: String) {
        viewModelScope.launch(Dispatchers.IO) {
            val currentList = device.getImageList().toMutableList()
            if (currentList.remove(photoPath)) {
                currentList.add(0, photoPath)
                val updated = device.withImageList(currentList)
                repository.updateDevice(updated)
                _selectedDevice.value = updated
            }
        }
    }

    fun updateCaptionStyle(device: Device, style: String) {
        viewModelScope.launch(Dispatchers.IO) {
            val updated = device.copy(captionStyle = style, customCaption = "")
            repository.updateDevice(updated)
            _selectedDevice.value = updated
        }
    }

    fun updateCustomCaption(device: Device, caption: String) {
        viewModelScope.launch(Dispatchers.IO) {
            val updated = device.copy(customCaption = caption)
            repository.updateDevice(updated)
            _selectedDevice.value = updated
        }
    }

    fun saveSellerProfile(profile: SellerProfile) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.saveSellerProfile(profile)
        }
    }

    val selectedDeviceIds = MutableStateFlow<Set<Long>>(emptySet())

    fun toggleDeviceSelection(id: Long) {
        val current = selectedDeviceIds.value.toMutableSet()
        if (current.contains(id)) {
            current.remove(id)
        } else {
            current.add(id)
        }
        selectedDeviceIds.value = current
    }

    fun selectAllDevices(ids: List<Long>) {
        selectedDeviceIds.value = ids.toSet()
    }

    fun clearSelection() {
        selectedDeviceIds.value = emptySet()
    }

    fun bulkUpdateStatus(ids: List<Long>, newStatus: String) {
        viewModelScope.launch(Dispatchers.IO) {
            val allList = allDevices.value
            val targetDevices = allList.filter { ids.contains(it.id) }
            for (device in targetDevices) {
                repository.updateDevice(device.copy(status = newStatus))
            }
            clearSelection()
        }
    }

    fun bulkDeleteDevices(ids: List<Long>) {
        viewModelScope.launch(Dispatchers.IO) {
            val allList = allDevices.value
            val targetDevices = allList.filter { ids.contains(it.id) }
            for (device in targetDevices) {
                repository.deleteDevice(device)
            }
            clearSelection()
        }
    }

    fun getDeviceCaption(device: Device): String {
        return if (device.customCaption.isNotBlank()) {
            device.customCaption
        } else {
            CaptionGenerator.generateCaption(device, sellerProfile.value, device.captionStyle)
        }
    }
}
