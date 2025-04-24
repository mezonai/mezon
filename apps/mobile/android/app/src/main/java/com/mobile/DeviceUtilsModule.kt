package com.mezon.mobile

import android.content.res.Configuration
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class DeviceUtilsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "DeviceUtils"
    }

    @ReactMethod
    fun isTablet(promise: Promise) {
        try {
            val isTablet = (reactApplicationContext.resources.configuration.screenLayout
                    and Configuration.SCREENLAYOUT_SIZE_MASK) >= Configuration.SCREENLAYOUT_SIZE_LARGE
            promise.resolve(isTablet)
        } catch (e: Exception) {
            promise.reject("ERROR", e)
        }
    }
}
