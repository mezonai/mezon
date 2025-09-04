package com.mezon.mobile

import android.content.Intent;
import android.os.Bundle;
import android.content.res.Configuration
import android.content.pm.ActivityInfo
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import android.content.Context;
import android.util.DisplayMetrics;
import android.os.Process
import android.app.ActivityManager
import android.app.NotificationManager
import android.os.Build
import android.os.Handler
import android.os.Looper

class DeviceUtilsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "DeviceUtils"
    }

    fun checkIsTablet(context: Context): Boolean {
        val metrics = context.resources.displayMetrics
        val widthInches = metrics.widthPixels / metrics.xdpi
        val heightInches = metrics.heightPixels / metrics.ydpi
        val screenSize =
            Math.sqrt(
                (widthInches.toDouble() * widthInches.toDouble()) +
                    (heightInches.toDouble() * heightInches.toDouble())
            )
        return screenSize >= 7.0
    }

    @ReactMethod
    fun isTablet(promise: Promise) {
        try {
            val isTablet = checkIsTablet(reactApplicationContext)
            promise.resolve(isTablet)
        } catch (e: Exception) {
            promise.reject("ERROR", e)
        }
    }

    @ReactMethod
    fun killApp() {
        try {
            val notificationManager = reactApplicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.cancelAll()

            val activityManager = reactApplicationContext.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                val appTasks = activityManager.appTasks
                for (task in appTasks) {
                    task.finishAndRemoveTask()
                }
            }

            val currentActivity = currentActivity
            currentActivity?.let { activity ->
                activity.runOnUiThread {
                    activity.finishAffinity()

                    Handler(Looper.getMainLooper()).postDelayed({
                        android.os.Process.killProcess(android.os.Process.myPid())
                    }, 200)
                }
            } ?: run {
                android.os.Process.killProcess(android.os.Process.myPid())
            }

        } catch (e: Exception) {
            android.os.Process.killProcess(android.os.Process.myPid())
        }
    }
}
