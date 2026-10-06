package com.example

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import com.example.data.database.AppDatabase
import com.example.data.model.Device
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class ExampleRobolectricTest {

    private lateinit var database: AppDatabase

    @Before
    fun setup() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        database = Room.inMemoryDatabaseBuilder(context, AppDatabase::class.java)
            .allowMainThreadQueries()
            .build()
    }

    @After
    fun teardown() {
        database.close()
    }

    @Test
    fun `read string from context`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val appName = context.getString(R.string.app_name)
        assertEquals("دستگاه‌یار", appName)
    }

    @Test
    fun `test room database stores device inventory, status and caption`() = runBlocking {
        val deviceDao = database.deviceDao()

        val device = Device(
            name = "تراش CNC سه محور",
            model = "CK6140",
            year = "1402",
            totalPrice = "650,000,000 تومان",
            cashPercentage = 40,
            installmentMonths = 10,
            status = Device.STATUS_ACTIVE,
            priorityStars = 5,
            captionStyle = Device.STYLE_ATTRACTIVE,
            customCaption = "دستگاه تراش در حد نو آماده تحویل فوری"
        )

        val id = deviceDao.insertDevice(device)
        assertNotNull(id)

        val devices = deviceDao.getAllDevices().first()
        assertEquals(1, devices.size)
        val loaded = devices[0]
        assertEquals("تراش CNC سه محور", loaded.name)
        assertEquals("CK6140", loaded.model)
        assertEquals(Device.STATUS_ACTIVE, loaded.status)
        assertEquals(5, loaded.priorityStars)
        assertEquals("دستگاه تراش در حد نو آماده تحویل فوری", loaded.customCaption)

        // Test status update
        deviceDao.updateStatus(loaded.id, Device.STATUS_OVERHAUL)
        val updatedStatusDevice = deviceDao.getDeviceByIdDirect(loaded.id)
        assertEquals(Device.STATUS_OVERHAUL, updatedStatusDevice?.status)

        // Test priority update
        deviceDao.updatePriority(loaded.id, 4)
        val updatedPriorityDevice = deviceDao.getDeviceByIdDirect(loaded.id)
        assertEquals(4, updatedPriorityDevice?.priorityStars)

        // Test caption update
        deviceDao.updateCaption(loaded.id, "کپشن جدید فروش", Device.STYLE_INDUSTRIAL)
        val updatedCaptionDevice = deviceDao.getDeviceByIdDirect(loaded.id)
        assertEquals("کپشن جدید فروش", updatedCaptionDevice?.customCaption)
        assertEquals(Device.STYLE_INDUSTRIAL, updatedCaptionDevice?.captionStyle)
    }
}
