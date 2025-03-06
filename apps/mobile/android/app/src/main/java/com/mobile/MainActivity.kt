package com.mobile.mezon
import android.os.Bundle;

import android.content.Intent;
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.network.OkHttpClientProvider;
import com.mezon.mobile.CustomClientFactory;
import com.zoontek.rnbootsplash.RNBootSplash;

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "Mobile"

 override fun onCreate(savedInstanceState: Bundle?) {
   RNBootSplash.init(this, R.style.BootTheme)
   super.onCreate(null);
 }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent);
    setIntent(intent);
  }

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
