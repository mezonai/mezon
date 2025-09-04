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
import android.view.WindowManager
import android.os.Build
import android.provider.Settings

class CallActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript.
   */
  override fun getMainComponentName(): String = "ComingCallApp"

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
     try {
        window.addFlags(
          WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
          WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
          WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
          WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
        )
      } catch (e: Exception) {
            Log.e("CallActivity", "window.addFlags: ${e.message}")
      }
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
