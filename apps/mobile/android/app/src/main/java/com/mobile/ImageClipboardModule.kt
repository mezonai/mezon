package com.mezon.mobile

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.util.Base64
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileOutputStream
import java.util.HashSet

class ImageClipboardModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "ImageClipboardModule"
    }

    @ReactMethod
    fun setImage(base64String: String, promise: Promise) {
        try {
            val decodedBytes = Base64.decode(base64String, Base64.DEFAULT)

            // Save to cache
            val cacheDir = reactApplicationContext.cacheDir
            val imagesDir = File(cacheDir, "clipboard_images")
            if (!imagesDir.exists()) imagesDir.mkdirs()
            val imageFile = File(imagesDir, "clipboard_${System.currentTimeMillis()}.png")
            FileOutputStream(imageFile).use { it.write(decodedBytes) }

            // Get content URI via FileProvider (make sure provider is declared in manifest)
            val contentUri = FileProvider.getUriForFile(
                reactApplicationContext,
                "${reactApplicationContext.packageName}.fileprovider",
                imageFile
            )

            // Put URI into clipboard
            val clip = ClipData.newUri(reactApplicationContext.contentResolver, "Image", contentUri)
            val clipboard = reactApplicationContext.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager

            // grant temporary read permission for the uri
            val pm = reactApplicationContext.packageManager
            val probeIntents = listOf(
                Intent(Intent.ACTION_SEND).apply { type = "image/*" },
                Intent(Intent.ACTION_SEND).apply { type = "image/png" },
                Intent(Intent.ACTION_VIEW).apply { setDataAndType(contentUri, "image/*") }
            )

            val grantedPackages = HashSet<String>()
            for (probe in probeIntents) {
                val resolveInfos = pm.queryIntentActivities(probe, PackageManager.MATCH_DEFAULT_ONLY)
                for (ri in resolveInfos) {
                    val pkg = ri.activityInfo.packageName
                    if (grantedPackages.add(pkg)) {
                        try {
                            reactApplicationContext.grantUriPermission(
                                pkg,
                                contentUri,
                                Intent.FLAG_GRANT_READ_URI_PERMISSION
                            )
                        } catch (_: Exception) { /* ignore per-package grant failures */ }
                    }
                }
            }

            // Place clip on clipboard
            clipboard.setPrimaryClip(clip)

            promise.resolve("Success")
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getImage(promise: Promise) {
        try {
            val clipboard = reactApplicationContext.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager

            if (clipboard.hasPrimaryClip()) {
                val clipData = clipboard.primaryClip
                if (clipData != null && clipData.itemCount > 0) {
                    val item = clipData.getItemAt(0)
                    val uri = item.uri
                    promise.resolve(uri?.toString())
                } else {
                    promise.resolve(null)
                }
            } else {
                promise.resolve(null)
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}