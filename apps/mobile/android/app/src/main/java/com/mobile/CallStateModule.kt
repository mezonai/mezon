package com.mezon.mobile

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import android.util.Log

class CallStateModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "CallStateModule"

        // Static variable to hold the call state
        @Volatile
        private var isInCall: Boolean = false

        // Getter method for other classes to access the state
        fun getIsInCall(): Boolean {
            return isInCall
        }

        // Setter method for other classes to modify the state
        fun setIsInCallFromNative(inCall: Boolean) {
            isInCall = inCall
            Log.d(TAG, "isInCall state updated from native: $isInCall")
        }
    }

    override fun getName(): String {
        return "CallStateModule"
    }

    @ReactMethod
    fun setIsInCall(inCall: Boolean) {
        isInCall = inCall
        Log.d(TAG, "isInCall state updated from React Native: $isInCall")
    }

    @ReactMethod
    fun getIsInCall(callback: com.facebook.react.bridge.Callback) {
        callback.invoke(isInCall)
    }
}
