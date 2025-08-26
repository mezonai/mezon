package com.mezon.mobile;

import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import me.leolin.shortcutbadger.ShortcutBadger

class BadgeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return "BadgeModule"
    }

    @ReactMethod
    fun setBadgeCount(count: Int, promise: Promise) {
        val context = reactApplicationContext
        try {
            val success = ShortcutBadger.applyCount(context, count)
            if (success) {
                promise.resolve(true)
            } else {
                promise.reject("ERROR", "Failed to set badge. Device may not support badges.")
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun removeBadge(promise: Promise) {
        val context = reactApplicationContext
        try {
            ShortcutBadger.removeCount(context)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}
