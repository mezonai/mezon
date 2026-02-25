package com.mezon.mobile
import android.app.Activity
import android.app.PictureInPictureParams
import android.content.Intent
import android.os.Build
import android.util.Rational
import com.facebook.react.bridge.*
import android.util.Log
import android.content.pm.PackageManager
import android.view.WindowManager
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import android.view.View

class PipModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "PipModule"
    private val TAG = "PipModule"

    @ReactMethod
     fun setupDefaultPipMode() {
         val activity: Activity? = reactContext.currentActivity
         if (activity == null) {
             Log.w(TAG, "E_NO_ACTIVITY No active Activity to enter PiP")
             return
         }

         if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
             Log.w(TAG, "enterPipMode aborted: API level too low (${Build.VERSION.SDK_INT})")
             return
         }

         activity.runOnUiThread {
             try {
                 val ratio = Rational(18, 12)
                  val builder = PictureInPictureParams.Builder()
                   .setAspectRatio(ratio)
                  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                      val autoEnter = true
                      builder.setAutoEnterEnabled(autoEnter)
                  }
                 val params = builder.build()
                 activity.setPictureInPictureParams(params)
             } catch (t: Throwable) {
                 Log.e(TAG, "E_ENTER_PIP: ${t.message}", t)
             }
         }
     }

     @ReactMethod
     fun enterPipMode() {
         val activity: Activity? = reactContext.currentActivity
         if (activity == null) {
             Log.w(TAG, "E_NO_ACTIVITY No active Activity to enter PiP")
             return
         }

         if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
             Log.w(TAG, "enterPipMode aborted: API level too low (${Build.VERSION.SDK_INT})")
             return
         }

         activity.runOnUiThread {
             try {
                  val ratio = Rational(18, 12)
                  val builder = PictureInPictureParams.Builder()
                   .setAspectRatio(ratio)
                  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                      val autoEnter = true
                      builder.setAutoEnterEnabled(autoEnter)
                  }
                 val params = builder.build()
                 activity.setPictureInPictureParams(params)

                 val entered = activity.enterPictureInPictureMode(params)
                 if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                     val windowInsetsController = WindowCompat.getInsetsController(activity.window, activity.window.decorView)
                     windowInsetsController.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                     windowInsetsController.hide(WindowInsetsCompat.Type.statusBars())
                 } else {
                     activity.window.decorView.systemUiVisibility = (
                         View.SYSTEM_UI_FLAG_FULLSCREEN or
                         View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
                         View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                     )
                 }
                 Log.d(TAG, "PiP mode enter result: $entered")
             } catch (t: Throwable) {
                 Log.e(TAG, "E_ENTER_PIP: ${t.message}", t)
             }
         }
     }

    @ReactMethod
    fun exitPipMode(promise: Promise) {
        Log.w(TAG, "exitPipMode called")
        val activity = reactContext.currentActivity

        if (activity == null) {
            promise.reject("E_NO_ACTIVITY", "No active Activity to exit PiP.")
            return
        }

        activity.runOnUiThread {
            try {
                val builder = PictureInPictureParams.Builder()
                    .setAutoEnterEnabled(false)
                activity.setPictureInPictureParams(builder.build())
                promise.resolve(true)
            } catch (t: Throwable) {
                promise.reject("E_EXIT_PIP", t.message, t)
            }
        }
    }

    @ReactMethod
    fun showStatusBar(promise: Promise) {
        val activity = reactContext.currentActivity
        if (activity == null) {
            promise.reject("ERROR", "Activity is null")
            return
        }
        activity.runOnUiThread {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    val windowInsetsController = WindowCompat.getInsetsController(activity.window, activity.window.decorView)
                    windowInsetsController.show(WindowInsetsCompat.Type.statusBars())
                } else {
                    activity.window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_VISIBLE
                }
                promise.resolve("Status bar shown successfully")
            } catch (e: Exception) {
                promise.reject("ERROR", "Failed to show status bar: ${e.message}")
            }
        }
    }
}
