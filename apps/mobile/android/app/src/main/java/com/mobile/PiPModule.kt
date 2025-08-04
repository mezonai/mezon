package com.mezon.mobile
import android.app.Activity
import android.app.PictureInPictureParams
import android.os.Build
import android.util.Rational
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import android.util.Log

class PipModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "PipModule"

    @ReactMethod
    fun enablePipMode(promise: Promise? = null) {
        try {
            val activity = reactContext.currentActivity
            if (activity == null) {
                Log.e("PipModule", "No current activity available")
                promise?.reject("NO_ACTIVITY", "No current activity available")
                return
            }

            // Check if the activity is in a valid state for PiP
            if (!isActivityResumed(activity)) {
                Log.e("PipModule", "Activity is not in resumed state")
                promise?.reject("ACTIVITY_NOT_RESUMED", "Activity must be resumed to enter picture-in-picture")
                return
            }

            activity.runOnUiThread {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        // Check if PiP is supported
                        if (!activity.packageManager.hasSystemFeature("android.software.picture_in_picture")) {
                            Log.e("PipModule", "Picture-in-picture not supported on this device")
                            promise?.reject("PIP_NOT_SUPPORTED", "Picture-in-picture not supported on this device")
                            return@runOnUiThread
                        }

                        val params = PictureInPictureParams.Builder()
                            .setAspectRatio(Rational(3, 2))
                            .build()

                        val result = activity.enterPictureInPictureMode(params)
                        if (result) {
                            Log.d("PipModule", "Successfully entered PiP mode")
                            promise?.resolve(true)
                        } else {
                            Log.e("PipModule", "Failed to enter PiP mode")
                            promise?.reject("PIP_FAILED", "Failed to enter picture-in-picture mode")
                        }
                    } else {
                        Log.e("PipModule", "Picture-in-picture requires Android O (API 26) or higher")
                        promise?.reject("API_VERSION_TOO_LOW", "Picture-in-picture requires Android O (API 26) or higher")
                    }
                } catch (e: Exception) {
                    Log.e("PipModule", "Error entering PiP mode: ${e.message}", e)
                    promise?.reject("PIP_ERROR", "Error entering picture-in-picture mode: ${e.message}")
                }
            }
        } catch (e: Exception) {
            Log.e("PipModule", "Unexpected error in enablePipMode: ${e.message}", e)
            promise?.reject("UNEXPECTED_ERROR", "Unexpected error: ${e.message}")
        }
    }

    private fun isActivityResumed(activity: Activity): Boolean {
        return try {
            // Check if activity is not finishing and not destroyed
            !activity.isFinishing && !activity.isDestroyed
        } catch (e: Exception) {
            Log.e("PipModule", "Error checking activity state: ${e.message}")
            false
        }
    }

    @ReactMethod
    fun isPipSupported(promise: Promise) {
        try {
            val activity = reactContext.currentActivity
            if (activity == null) {
                promise.resolve(false)
                return
            }

            val isSupported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
                    activity.packageManager.hasSystemFeature("android.software.picture_in_picture")

            promise.resolve(isSupported)
        } catch (e: Exception) {
            Log.e("PipModule", "Error checking PiP support: ${e.message}")
            promise.resolve(false)
        }
    }
}
