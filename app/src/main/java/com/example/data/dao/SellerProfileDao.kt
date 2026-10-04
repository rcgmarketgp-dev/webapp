package com.example.data.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.example.data.model.SellerProfile
import kotlinx.coroutines.flow.Flow

@Dao
interface SellerProfileDao {
    @Query("SELECT * FROM seller_profile WHERE id = 1 LIMIT 1")
    fun getProfile(): Flow<SellerProfile?>

    @Query("SELECT * FROM seller_profile WHERE id = 1 LIMIT 1")
    suspend fun getProfileDirect(): SellerProfile?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveProfile(profile: SellerProfile)
}
