package com.mezon.mobile

import android.graphics.Bitmap
import android.media.MediaMetadataRetriever
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileOutputStream
import java.security.MessageDigest
import java.security.NoSuchAlgorithmException

class VideoThumbnailModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val TAG = "VideoThumbnailModule"

    override fun getName(): String = "VideoThumbnail"

    private fun getVideoHash(videoPath: String): String {
        return try {
            val digest = MessageDigest.getInstance("MD5")
            val hashBytes = digest.digest(videoPath.toByteArray(Charsets.UTF_8))
            val hexString = StringBuilder()
            for (b in hashBytes) {
                val hex = Integer.toHexString(0xff and b.toInt())
                if (hex.length == 1) hexString.append('0')
                hexString.append(hex)
            }
            hexString.toString()
        } catch (e: NoSuchAlgorithmException) {
            Log.e(TAG, "Error creating hash", e)
            videoPath.hashCode().toString()
        }
    }

    @ReactMethod
    fun getThumbnail(videoPath: String, promise: Promise) {
        try {
            val cacheDir = reactApplicationContext.cacheDir
            val videoHash = getVideoHash(videoPath)
            val fileName = "thumb_${videoHash}.jpg"
            val thumbnailFile = File(cacheDir, fileName)

            if (thumbnailFile.exists()) {
                Log.d(TAG, "Using cached thumbnail for: $videoPath")
                promise.resolve("file://${thumbnailFile.absolutePath}")
                return
            }

            Log.d(TAG, "Generating new thumbnail for: $videoPath")
            val retriever = MediaMetadataRetriever()
            try {
                retriever.setDataSource(videoPath)
                val bitmap: Bitmap? = retriever.getFrameAtTime(100_000L)
                if (bitmap == null) {
                    promise.reject("ERROR", "Failed to extract thumbnail from video")
                    return
                }

                FileOutputStream(thumbnailFile).use { out ->
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out)
                }
                bitmap.recycle()

                promise.resolve("file://${thumbnailFile.absolutePath}")
            } finally {
                try {
                    retriever.release()
                } catch (ignored: Exception) {
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error generating thumbnail", e)
            promise.reject("ERROR", e)
        }
    }
}
