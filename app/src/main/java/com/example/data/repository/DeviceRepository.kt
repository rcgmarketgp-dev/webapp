package com.example.data.repository

import com.example.data.dao.DeviceDao
import com.example.data.dao.SellerProfileDao
import com.example.data.model.Device
import com.example.data.model.SellerProfile
import kotlinx.coroutines.flow.Flow

class DeviceRepository(
    private val deviceDao: DeviceDao,
    private val sellerProfileDao: SellerProfileDao
) {
    val allDevices: Flow<List<Device>> = deviceDao.getAllDevices()
    val activeDevices: Flow<List<Device>> = deviceDao.getDevicesByStatus(Device.STATUS_ACTIVE)
    val incompleteDevices: Flow<List<Device>> = deviceDao.getIncompleteDevices()
    val sellerProfile: Flow<SellerProfile?> = sellerProfileDao.getProfile()

    fun getDevicesByStatus(status: String): Flow<List<Device>> =
        deviceDao.getDevicesByStatus(status)

    fun getDevice(id: Long): Flow<Device?> =
        deviceDao.getDeviceById(id)

    suspend fun getDeviceDirect(id: Long): Device? =
        deviceDao.getDeviceByIdDirect(id)

    fun searchDevices(query: String): Flow<List<Device>> =
        deviceDao.searchDevices(query)

    suspend fun insertDevice(device: Device): Long {
        val isIncomplete = device.checkIncomplete()
        return deviceDao.insertDevice(device.copy(isIncomplete = isIncomplete))
    }

    suspend fun insertDevices(devices: List<Device>): List<Long> {
        val updatedDevices = devices.map { it.copy(isIncomplete = it.checkIncomplete()) }
        return deviceDao.insertDevices(updatedDevices)
    }

    suspend fun updateDevice(device: Device) {
        val isIncomplete = device.checkIncomplete()
        deviceDao.updateDevice(
            device.copy(
                isIncomplete = isIncomplete,
                updatedAt = System.currentTimeMillis()
            )
        )
    }

    suspend fun deleteDevice(device: Device) =
        deviceDao.deleteDevice(device)

    suspend fun deleteDeviceById(id: Long) =
        deviceDao.deleteDeviceById(id)

    suspend fun deleteAll() =
        deviceDao.deleteAll()

    suspend fun getSellerProfileDirect(): SellerProfile? =
        sellerProfileDao.getProfileDirect()

    suspend fun saveSellerProfile(profile: SellerProfile) =
        sellerProfileDao.saveProfile(profile)
}
