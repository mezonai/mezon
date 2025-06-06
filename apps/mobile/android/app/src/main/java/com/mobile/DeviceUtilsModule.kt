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
}
