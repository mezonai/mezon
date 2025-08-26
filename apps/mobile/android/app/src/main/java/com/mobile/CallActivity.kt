package com.mezon.mobile

import android.content.Intent
import android.os.Bundle
import android.content.Context
import android.app.NotificationManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.util.Log

class CallActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript.
   */
  override fun getMainComponentName(): String = "ComingCallApp"

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    // Cancel the notification when this activity starts
    val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    notificationManager.cancel(1001)

    // Stop the VibrationService
    // val serviceIntent = Intent(this, VibrationService::class.java)
    // stopService(serviceIntent)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
  }

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    try {
      super.onWindowFocusChanged(hasFocus)
    } catch (e: Exception) {
      Log.e("CallActivity", "Error in onWindowFocusChanged: ${e.message}", e)
    }
  }

  /**
   * Returns the instance of the [ReactActivityDelegate].
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
