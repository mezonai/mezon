package com.mezon.mobile;

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import android.util.Log
import com.google.firebase.messaging.RemoteMessage
import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService
import org.json.JSONObject
import android.graphics.Color
import androidx.core.graphics.drawable.IconCompat
import android.widget.RemoteViews
import android.app.Notification
import android.view.View
import org.json.JSONArray
import android.app.ActivityManager
import android.content.BroadcastReceiver
import android.content.IntentFilter

class CustomFirebaseMessagingService : ReactNativeFirebaseMessagingService() {

    companion object {
        private const val TAG = "CustomFCMService"
        private const val PREF_NAME = "NotificationPrefs"
        private const val CHANNEL_ID = "calling_channel"
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        val data = remoteMessage.data
        if (data.isNotEmpty()) {
            val offer = data["offer"]
            if (offer != null) {
                if (offer == "{\"offer\":\"CANCEL_CALL\"}") {
                    cancelCallNotification()
                } else {
                    saveNotificationData(data)
                }
            } else {
                saveMessagesNotificationData(data)
            }
        }
    }

    private fun saveNotificationData(data: Map<String, String>) {
        try {
            val sharedPreferences = applicationContext.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
            val editor = sharedPreferences.edit()
            editor.putString("notificationDataCalling", JSONObject(data).toString())
            editor.apply()
        } catch (e: Exception) {
            Log.e(TAG, "Error saving notification data: ${e.message}")
        }
    }

    private fun saveMessagesNotificationData(data: Map<String, String>) {
        try {
            val sharedPreferences = applicationContext.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
            val editor = sharedPreferences.edit()
            val existingData = sharedPreferences.getString("notificationDataPushed", "[]")
            val dataArray = JSONArray(existingData)
            dataArray.put(JSONObject(data))
            editor.putString("notificationDataPushed", dataArray.toString())
            editor.apply()
        } catch (e: Exception) {
            Log.e(TAG, "Error saving notification data: ${e.message}")
        }
    }

    private fun removeNotificationData() {
        try {
            val sharedPreferences = applicationContext.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
            val editor = sharedPreferences.edit()
            editor.remove("notificationDataCalling")
            editor.apply()
        } catch (e: Exception) {
            Log.e(TAG, "Error removing notification data: ${e.message}")
        }
    }

    private fun cancelCallNotification() {
        val isInCall = CallStateModule.getIsInCall()
        if (isInCall) {
            Log.d(TAG, "User is in call, skipping cancelCallNotification")
            return // Do nothing if user is currently in a call
        }
        removeNotificationData()
    }
}
