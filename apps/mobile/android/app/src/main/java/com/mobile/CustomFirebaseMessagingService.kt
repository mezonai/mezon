package com.mezon.mobile;

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import androidx.core.app.NotificationCompat
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
import android.media.MediaPlayer
import android.os.PowerManager
import android.content.BroadcastReceiver
import android.content.IntentFilter

class CustomFirebaseMessagingService : ReactNativeFirebaseMessagingService() {

    companion object {
        private const val TAG = "CustomFCMService"
        private const val PREF_NAME = "NotificationPrefs"
        private const val CHANNEL_ID = "calling_channel"
        private const val NOTIFICATION_ID = 1001
        private const val CALL_TIMEOUT_MS: Long = 40000L
    }

    private var vibrator: Vibrator? = null
    private var callTimeoutHandler: android.os.Handler? = null
    private var callTimeoutRunnable: Runnable? = null
    private var mediaPlayer: MediaPlayer? = null
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        val isAppInForeground = isAppInForeground()
        if (isAppInForeground) {
            return
        }

        // Extract data from the notification
        val data = remoteMessage.data
        if (data.isNotEmpty()) {
            val offer = data["offer"]
            if (offer != null) {
                if (offer == "{\"offer\":\"CANCEL_CALL\"}") {
                    cancelCallNotification()
                } else {
                    saveNotificationData(data)
                    showCallNotification(data)
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

    private fun showCallNotification(data: Map<String, String>) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        // Acquire WakeLock to keep the screen active
        acquireWakeLock()

        // Create notification channel for Android O and above
        createCallNotificationChannel(notificationManager)

        // Get caller information from data
        val offerJson = JSONObject(data["offer"] ?: "{}")
        val callerName = offerJson.optString("callerName", "Unknown Caller")
        val callerAvatar = offerJson.optString("callerAvatar", "")

        // Create an intent for when user taps the notification (Answer)
        val answerIntent = Intent(this, CallActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            action = "ANSWER_CALL_ACTION"
            putExtra("action", "ANSWER_CALL")
            putExtra("notificationData", JSONObject(data).toString())
            putExtra("stopVibration", true)
        }
        val answerPendingIntent = PendingIntent.getActivity(
            this, 0, answerIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Create an intent for decline button
        val declineIntent = Intent(this, NotificationActionReceiver::class.java).apply {
            action = "DECLINE_CALL_ACTION"
            putExtra("cancelCall", true)
        }
        val declinePendingIntent = PendingIntent.getBroadcast(
            this, 1, declineIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val dismissIntent = Intent(this, NotificationActionReceiver::class.java).apply {
            action = "NOTIFICATION_DISMISSED"
        }
        val dismissPendingIntent = PendingIntent.getBroadcast(
            this, 2, dismissIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Get ringtone sound
        val soundUri = Uri.parse("android.resource://${packageName}/raw/ringing")

        // Create custom notification layout with colored buttons
        val notificationLayout = RemoteViews(packageName, R.layout.call_notification_layout)

        // Set caller information in the custom layout
        notificationLayout.setTextViewText(R.id.caller_name, callerName + " is calling")

        // Set up button click intents
        notificationLayout.setOnClickPendingIntent(R.id.answer_button, answerPendingIntent)
        notificationLayout.setOnClickPendingIntent(R.id.decline_button, declinePendingIntent)

        // Basic notification for devices that might not support custom view
        val notificationBuilder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(callerName)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setFullScreenIntent(answerPendingIntent, true)
            .setSound(soundUri)
            .setColorized(true)
            .setOngoing(true)
            .setAutoCancel(true)
            .setTimeoutAfter(50000)
            .setDeleteIntent(dismissPendingIntent)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setVibrate(longArrayOf(0, 500, 1000, 500))

        // Add custom layout to notification
        notificationBuilder.setStyle(NotificationCompat.DecoratedCustomViewStyle())
        notificationBuilder.setCustomContentView(notificationLayout)

        // For API level 24 and above, we can also set a custom big content view
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            notificationBuilder.setCustomBigContentView(notificationLayout)
        }

        // Start vibration
        startVibration()
        // Show the notification
        notificationManager.notify(NOTIFICATION_ID, notificationBuilder.build())

        // Start call timeout handler
        startCallTimeout()
    }

    private fun startCallTimeout() {
        // Cancel any existing timeout handler
        cancelCallTimeout()

        // Create new timeout handler
        callTimeoutHandler = android.os.Handler(android.os.Looper.getMainLooper())
        callTimeoutRunnable = Runnable {
            Log.d(TAG, "Call timeout reached - cancelling notification")
            cancelCallNotification()
        }

        // Schedule timeout after CALL_TIMEOUT_MS (60 seconds)
        callTimeoutHandler?.postDelayed(callTimeoutRunnable!!, CALL_TIMEOUT_MS)
        Log.d(TAG, "Call timeout scheduled for $CALL_TIMEOUT_MS ms")
    }

    internal fun cancelCallTimeout() {
        callTimeoutRunnable?.let { runnable ->
            callTimeoutHandler?.removeCallbacks(runnable)
        }
        callTimeoutHandler = null
        callTimeoutRunnable = null
    }

    private fun acquireWakeLock() {
        try {
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = powerManager.newWakeLock(
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "$packageName:WAKE_LOCK"
            )
            wakeLock?.acquire(30 * 1000L /* 30s timeout */)
            Log.d(TAG, "WakeLock acquired")
        } catch (e: Exception) {
            Log.e(TAG, "Error acquiring WakeLock: ${e.message}")
        }
    }

    private fun releaseWakeLock() {
        try {
            wakeLock?.let {
                if (it.isHeld) {
                    it.release()
                    Log.d(TAG, "WakeLock released")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error releasing WakeLock: ${e.message}")
        }
    }

    private fun cancelCallNotification() {
        val isInCall = CallStateModule.getIsInCall()
        if (isInCall) {
            Log.d(TAG, "User is in call, skipping cancelCallNotification")
            return // Do nothing if user is currently in a call
        }
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancel(NOTIFICATION_ID)
        stopVibration()
        removeNotificationData()
        cancelCallTimeout()
        releaseWakeLock()
    }

    private fun createCallNotificationChannel(notificationManager: NotificationManager) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Incoming Calls"
            val description = "Notifications for incoming calls"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                this.description = description
                enableLights(true)
                enableVibration(true)

                // Set ringtone sound
                val soundUri = Uri.parse("android.resource://${packageName}/raw/ringing")
                val audioAttributes = AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .build()
                setSound(soundUri, audioAttributes)
            }

            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun startVibration() {
        val serviceIntent = Intent(this, VibrationService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
    }

    internal fun stopVibration() {
        removeNotificationData()
        // Also stop the service (as a fallback)
        val serviceIntent = Intent(this, VibrationService::class.java)
        stopService(serviceIntent)
    }

    private fun isAppInForeground(): Boolean {
        val activityManager = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val appProcesses = activityManager.runningAppProcesses ?: return false
        val packageName = applicationContext.packageName

        for (appProcess in appProcesses) {
            if (appProcess.processName == packageName) {
                return appProcess.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
            }
        }
        return false
    }
}
