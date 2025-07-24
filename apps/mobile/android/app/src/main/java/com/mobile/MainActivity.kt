package com.mezon.mobile

import android.content.Intent;
import android.os.Bundle;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.network.OkHttpClientProvider;
import com.mezon.mobile.CustomClientFactory;
import com.zoontek.rnbootsplash.RNBootSplash;
import android.app.NotificationManager
import android.content.Context;
import android.util.DisplayMetrics;
import android.util.Log;

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "Mobile"

  fun isTablet(context: Context): Boolean {
    val metrics = context.resources.displayMetrics
    val widthInches = metrics.widthPixels / metrics.xdpi
    val heightInches = metrics.heightPixels / metrics.ydpi
    val screenSize =
        Math.sqrt(
            (widthInches.toDouble() * widthInches.toDouble()) +
                (heightInches.toDouble() * heightInches.toDouble())
    return screenSize >= 7.5
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    RNBootSplash.init(this, R.style.BootTheme)
    super.onCreate(null);

    if (isTablet(this)) {
      requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
    } else {
      requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_FULL_USER
    }
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent);
    setIntent(intent);
    if (intent?.action == "ANSWER_CALL_ACTION") {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancel(1001)
    }
  }

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
