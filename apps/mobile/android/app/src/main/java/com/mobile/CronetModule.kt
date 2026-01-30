package com.mezon.mobile

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableNativeMap
import org.chromium.net.CronetEngine
import org.chromium.net.CronetException
import org.chromium.net.UrlRequest
import org.chromium.net.UrlResponseInfo
import java.nio.ByteBuffer
import java.util.concurrent.Executor
import java.util.concurrent.Executors
import android.util.Base64

class CronetModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val BUFFER_SIZE = 32 * 1024
    }

    private val cronetEngine: CronetEngine by lazy {
        CronetEngine.Builder(reactApplicationContext)
            .enableHttp2(true)
            .enableQuic(true)
            .enableBrotli(true)
            .build()
    }

    private val executor: Executor = Executors.newFixedThreadPool(4)

    override fun getName(): String = "CronetClient"

    @ReactMethod
    fun get(url: String, headers: ReadableMap?, promise: Promise) {
        executeRequest("GET", url, null, headers, promise)
    }

    @ReactMethod
    fun post(url: String, body: String?, headers: ReadableMap?, promise: Promise) {
        executeRequest("POST", url, body, headers, promise)
    }

    @ReactMethod
    fun request(method: String, url: String, body: String?, headers: ReadableMap?, promise: Promise) {
        executeRequest(method.uppercase(), url, body, headers, promise)
    }

    /**
     * Binary request method - body and response are base64 encoded
     * Used for protobuf API calls
     */
    @ReactMethod
    fun requestBinary(method: String, url: String, bodyBase64: String?, headers: ReadableMap?, promise: Promise) {
        try {
            val requestBuilder = cronetEngine.newUrlRequestBuilder(
                url,
                CronetBinaryCallback(promise),
                executor
            )

            requestBuilder.setHttpMethod(method.uppercase())

            headers?.let { headersMap ->
                val iterator = headersMap.keySetIterator()
                while (iterator.hasNextKey()) {
                    val key = iterator.nextKey()
                    headersMap.getString(key)?.let { value ->
                        requestBuilder.addHeader(key, value)
                    }
                }
            }

            if (bodyBase64 != null && method.uppercase() in listOf("POST", "PUT", "PATCH")) {
                val bodyBytes = Base64.decode(bodyBase64, Base64.DEFAULT)
                val contentType = headers?.getString("Content-Type") ?: "application/proto"
                requestBuilder.setUploadDataProvider(
                    ByteArrayUploadDataProvider(bodyBytes),
                    executor
                )
                requestBuilder.addHeader("Content-Type", contentType)
            }

            requestBuilder.build().start()
        } catch (e: Exception) {
            promise.reject("CRONET_ERROR", e.message, e)
        }
    }

    private fun executeRequest(
        method: String,
        url: String,
        body: String?,
        headers: ReadableMap?,
        promise: Promise
    ) {
        try {
            val requestBuilder = cronetEngine.newUrlRequestBuilder(
                url,
                CronetCallback(promise),
                executor
            )

            requestBuilder.setHttpMethod(method)

            headers?.let { headersMap ->
                val iterator = headersMap.keySetIterator()
                while (iterator.hasNextKey()) {
                    val key = iterator.nextKey()
                    headersMap.getString(key)?.let { value ->
                        requestBuilder.addHeader(key, value)
                    }
                }
            }

            if (body != null && method in listOf("POST", "PUT", "PATCH")) {
                val contentType = headers?.getString("Content-Type") ?: "application/json"
                requestBuilder.setUploadDataProvider(
                    ByteArrayUploadDataProvider(body.toByteArray(Charsets.UTF_8)),
                    executor
                )
                requestBuilder.addHeader("Content-Type", contentType)
            }

            requestBuilder.build().start()
        } catch (e: Exception) {
            promise.reject("CRONET_ERROR", e.message, e)
        }
    }

    private inner class CronetCallback(private val promise: Promise) : UrlRequest.Callback() {
        private val responseBody = StringBuilder()
        private var statusCode: Int = 0

        override fun onRedirectReceived(request: UrlRequest, info: UrlResponseInfo, newLocationUrl: String) {
            request.followRedirect()
        }

        override fun onResponseStarted(request: UrlRequest, info: UrlResponseInfo) {
            statusCode = info.httpStatusCode
            request.read(ByteBuffer.allocateDirect(BUFFER_SIZE))
        }

        override fun onReadCompleted(request: UrlRequest, info: UrlResponseInfo, byteBuffer: ByteBuffer) {
            byteBuffer.flip()
            val bytes = ByteArray(byteBuffer.remaining())
            byteBuffer.get(bytes)
            responseBody.append(String(bytes, Charsets.UTF_8))
            byteBuffer.clear()
            request.read(byteBuffer)
        }

        override fun onSucceeded(request: UrlRequest, info: UrlResponseInfo) {
            val result = WritableNativeMap().apply {
                putInt("statusCode", statusCode)
                putString("body", responseBody.toString())
            }
            promise.resolve(result)
        }

        override fun onFailed(request: UrlRequest, info: UrlResponseInfo?, error: CronetException) {
            promise.reject("CRONET_ERROR", error.message, error)
        }

        override fun onCanceled(request: UrlRequest, info: UrlResponseInfo?) {
            promise.reject("CRONET_CANCELED", "Request was canceled")
        }
    }

    /**
     * Binary callback - returns response as base64 encoded string
     */
    private inner class CronetBinaryCallback(private val promise: Promise) : UrlRequest.Callback() {
        private val responseBytes = mutableListOf<Byte>()
        private var statusCode: Int = 0

        override fun onRedirectReceived(request: UrlRequest, info: UrlResponseInfo, newLocationUrl: String) {
            request.followRedirect()
        }

        override fun onResponseStarted(request: UrlRequest, info: UrlResponseInfo) {
            statusCode = info.httpStatusCode
            request.read(ByteBuffer.allocateDirect(BUFFER_SIZE))
        }

        override fun onReadCompleted(request: UrlRequest, info: UrlResponseInfo, byteBuffer: ByteBuffer) {
            byteBuffer.flip()
            val bytes = ByteArray(byteBuffer.remaining())
            byteBuffer.get(bytes)
            responseBytes.addAll(bytes.toList())
            byteBuffer.clear()
            request.read(byteBuffer)
        }

        override fun onSucceeded(request: UrlRequest, info: UrlResponseInfo) {
            val bodyBase64 = Base64.encodeToString(responseBytes.toByteArray(), Base64.NO_WRAP)
            val result = WritableNativeMap().apply {
                putInt("statusCode", statusCode)
                putString("body", bodyBase64)
            }
            promise.resolve(result)
        }

        override fun onFailed(request: UrlRequest, info: UrlResponseInfo?, error: CronetException) {
            promise.reject("CRONET_ERROR", error.message, error)
        }

        override fun onCanceled(request: UrlRequest, info: UrlResponseInfo?) {
            promise.reject("CRONET_CANCELED", "Request was canceled")
        }
    }

    private class ByteArrayUploadDataProvider(private val data: ByteArray) : org.chromium.net.UploadDataProvider() {
        private var position = 0

        override fun getLength(): Long = data.size.toLong()

        override fun read(uploadDataSink: org.chromium.net.UploadDataSink, byteBuffer: ByteBuffer) {
            val toWrite = minOf(data.size - position, byteBuffer.remaining())
            byteBuffer.put(data, position, toWrite)
            position += toWrite
            uploadDataSink.onReadSucceeded(false)
        }

        override fun rewind(uploadDataSink: org.chromium.net.UploadDataSink) {
            position = 0
            uploadDataSink.onRewindSucceeded()
        }
    }
}
