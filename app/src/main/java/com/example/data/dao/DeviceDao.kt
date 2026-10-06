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
    @Query("SELECT * FROM devices ORDER BY priorityStars DESC, updatedAt DESC")
    fun getAllDevices(): Flow<List<Device>>

    @Query("SELECT * FROM devices WHERE status = :status ORDER BY priorityStars DESC, updatedAt DESC")
    fun getDevicesByStatus(status: String): Flow<List<Device>>

    @Query("SELECT * FROM devices WHERE isIncomplete = 1 ORDER BY priorityStars DESC, updatedAt DESC")
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
        ORDER BY priorityStars DESC, updatedAt DESC
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

    @Query("UPDATE devices SET status = :status, updatedAt = :updatedAt WHERE id = :id")
    suspend fun updateStatus(id: Long, status: String, updatedAt: Long = System.currentTimeMillis())

    @Query("UPDATE devices SET priorityStars = :stars, updatedAt = :updatedAt WHERE id = :id")
    suspend fun updatePriority(id: Long, stars: Int, updatedAt: Long = System.currentTimeMillis())

    @Query("UPDATE devices SET customCaption = :caption, captionStyle = :style, updatedAt = :updatedAt WHERE id = :id")
    suspend fun updateCaption(id: Long, caption: String, style: String, updatedAt: Long = System.currentTimeMillis())

    @Query("DELETE FROM devices")
    suspend fun deleteAll()
}
