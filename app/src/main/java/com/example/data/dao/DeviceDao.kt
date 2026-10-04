package com.example.data.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.data.model.Device
import kotlinx.coroutines.flow.Flow

@Dao
interface DeviceDao {
    @Query("SELECT * FROM devices ORDER BY id DESC")
    fun getAllDevices(): Flow<List<Device>>

    @Query("SELECT * FROM devices WHERE status = :status ORDER BY id DESC")
    fun getDevicesByStatus(status: String): Flow<List<Device>>

    @Query("SELECT * FROM devices WHERE isIncomplete = 1 ORDER BY id DESC")
    fun getIncompleteDevices(): Flow<List<Device>>

    @Query("SELECT * FROM devices WHERE id = :id LIMIT 1")
    fun getDeviceById(id: Long): Flow<Device?>

    @Query("SELECT * FROM devices WHERE id = :id LIMIT 1")
    suspend fun getDeviceByIdDirect(id: Long): Device?

    @Query("""
        SELECT * FROM devices 
        WHERE name LIKE '%' || :query || '%' 
           OR model LIKE '%' || :query || '%' 
           OR specifications LIKE '%' || :query || '%'
        ORDER BY id DESC
    """)
    fun searchDevices(query: String): Flow<List<Device>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDevice(device: Device): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDevices(devices: List<Device>): List<Long>

    @Update
    suspend fun updateDevice(device: Device)

    @Delete
    suspend fun deleteDevice(device: Device)

    @Query("DELETE FROM devices WHERE id = :id")
    suspend fun deleteDeviceById(id: Long)

    @Query("DELETE FROM devices")
    suspend fun deleteAll()
}
