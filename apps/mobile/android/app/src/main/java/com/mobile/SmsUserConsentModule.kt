package com.mezon.mobile

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.gms.auth.api.phone.SmsRetriever
import com.google.android.gms.auth.api.phone.SmsRetrieverClient
import com.google.android.gms.common.api.CommonStatusCodes
import com.google.android.gms.common.api.Status

class SmsUserConsentModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val smsRetrieverClient: SmsRetrieverClient = SmsRetriever.getClient(reactContext)
    private var smsReceiver: BroadcastReceiver? = null
    private val TAG = "SmsUserConsentModule"

    companion object {
        private const val SMS_CONSENT_REQUEST = 2
    }

    override fun getName(): String = "SmsUserConsent"

    @ReactMethod
    fun startSmsUserConsent(phoneNumber: String?, promise: Promise) {
        try {
            if (smsReceiver != null) cleanupReceiver()

            val normalized = phoneNumber?.takeIf { it.isNotBlank() }
            val task = smsRetrieverClient.startSmsUserConsent(normalized)

            task.addOnSuccessListener {
                try {
                    registerSmsReceiver()
                    promise.resolve(true)
                } catch (e: Exception) {
                    Log.e(TAG, "Error registering SMS receiver: ${e.message}", e)
                    promise.reject("SMS_REGISTER_ERROR", "Failed to register SMS receiver: ${e.message}", e)
                }
            }.addOnFailureListener { exception ->
                Log.e(TAG, "Error starting SMS user consent: ${exception.message}", exception)
                promise.reject("SMS_ERROR", exception.message, exception)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Unexpected error in startSmsUserConsent: ${e.message}", e)
            promise.reject("SMS_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopSmsUserConsent() {
        try {
            cleanupReceiver()
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping SMS user consent: ${e.message}", e)
        }
    }

    @ReactMethod
    fun extractOtpFromMessage(message: String, otpLength: Int, promise: Promise) {
        try {
            if (otpLength <= 0) {
                promise.reject("INVALID_OTP_LENGTH", "OTP length must be greater than 0")
                return
            }

            val otp = "\\d{$otpLength}".toRegex().find(message)?.value
            if (otp != null) {
                promise.resolve(otp)
            } else {
                promise.reject("OTP_NOT_FOUND", "OTP not found in message")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error extracting OTP: ${e.message}", e)
            promise.reject("OTP_ERROR", e.message, e)
        }
    }

    private fun registerSmsReceiver() {
        try {
            smsReceiver = object : BroadcastReceiver() {
                override fun onReceive(context: Context, intent: Intent) {
                    try {
                        if (SmsRetriever.SMS_RETRIEVED_ACTION == intent.action) {
                            val extras = intent.extras
                            if (extras == null) {
                                sendError("SMS_ERROR", "Intent extras are null")
                                return
                            }

                            val smsRetrieverStatus = extras.get(SmsRetriever.EXTRA_STATUS) as? Status
                            if (smsRetrieverStatus == null) {
                                sendError("SMS_ERROR", "SMS retriever status is null")
                                return
                            }

                            when (smsRetrieverStatus.statusCode) {
                                CommonStatusCodes.SUCCESS -> {
                                    try {
                                        val consentIntent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                                            extras.getParcelable(SmsRetriever.EXTRA_CONSENT_INTENT, Intent::class.java)
                                        } else {
                                            @Suppress("DEPRECATION")
                                            extras.getParcelable(SmsRetriever.EXTRA_CONSENT_INTENT)
                                        }

                                        if (consentIntent != null) {
                                            reactApplicationContext.currentActivity?.startActivityForResult(consentIntent, SMS_CONSENT_REQUEST)
                                                ?: sendError("SMS_CONSENT_ERROR", "Current activity is null")
                                        } else {
                                            sendError("SMS_CONSENT_ERROR", "Consent intent is null")
                                        }
                                    } catch (e: Exception) {
                                        Log.e(TAG, "Error starting consent activity: ${e.message}", e)
                                        sendError("SMS_CONSENT_ERROR", e.message ?: "Consent start error")
                                    }
                                }
                                CommonStatusCodes.TIMEOUT -> {
                                    Log.w(TAG, "SMS timeout")
                                    sendError("SMS_TIMEOUT", "SMS timeout")
                                    cleanupReceiver()
                                }
                                else -> {
                                    Log.e(TAG, "SMS error: ${smsRetrieverStatus.statusCode}")
                                    sendError("SMS_ERROR", "SMS error: ${smsRetrieverStatus.statusCode}")
                                    cleanupReceiver()
                                }
                            }
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error in onReceive: ${e.message}", e)
                        sendError("SMS_RECEIVE_ERROR", e.message ?: "Error receiving SMS")
                        cleanupReceiver()
                    }
                }
            }

            val intentFilter = IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION)

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                reactApplicationContext.registerReceiver(
                    smsReceiver,
                    intentFilter,
                    Context.RECEIVER_EXPORTED
                )
            } else {
                reactApplicationContext.registerReceiver(smsReceiver, intentFilter)
            }

            Log.d(TAG, "SMS receiver registered successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Error registering SMS receiver: ${e.message}", e)
            smsReceiver = null
            throw e
        }
    }

    private val activityEventListener = object : BaseActivityEventListener() {
        override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, intent: Intent?) {
            try {
                if (requestCode == SMS_CONSENT_REQUEST) {
                    if (resultCode == Activity.RESULT_OK && intent != null) {
                        val message = intent.getStringExtra(SmsRetriever.EXTRA_SMS_MESSAGE)
                        if (message != null) {
                            try {
                                val params = Arguments.createMap()
                                params.putString("message", message)
                                sendEvent("onSmsReceived", params)
                                Log.d(TAG, "SMS message received successfully")
                            } catch (e: Exception) {
                                Log.e(TAG, "Error creating SMS params: ${e.message}", e)
                                sendError("SMS_PARAMS_ERROR", "Error processing SMS message")
                            }
                        } else {
                            Log.w(TAG, "SMS message is null")
                            sendError("SMS_MESSAGE_NULL", "SMS message is null")
                        }
                    } else {
                        Log.w(TAG, "User denied SMS consent or result is not OK")
                        sendError("SMS_CONSENT_DENIED", "User denied SMS consent")
                    }
                    cleanupReceiver()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error in onActivityResult: ${e.message}", e)
                sendError("SMS_ACTIVITY_ERROR", e.message ?: "Error processing activity result")
                cleanupReceiver()
            }
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        if (!reactApplicationContext.hasActiveCatalystInstance()) {
            Log.w(TAG, "Cannot send event '$eventName': no active Catalyst instance")
            return
        }

        try {
            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        } catch (e: Exception) {
            Log.e(TAG, "Error sending event '$eventName': ${e.message}", e)
        }
    }

    private fun sendError(code: String, message: String) {
        try {
            val params = Arguments.createMap().apply {
                putString("code", code)
                putString("message", message)
            }
            sendEvent("onSmsError", params)
        } catch (e: Exception) {
            Log.e(TAG, "Error sending error event: ${e.message}", e)
        }
    }

    private fun cleanupReceiver() {
        smsReceiver?.let {
            try {
                reactApplicationContext.unregisterReceiver(it)
                Log.d(TAG, "SMS receiver unregistered successfully")
            } catch (e: IllegalArgumentException) {
                Log.w(TAG, "Receiver was not registered: ${e.message}")
            } catch (e: Exception) {
                Log.e(TAG, "Error unregistering SMS receiver: ${e.message}", e)
            }
            smsReceiver = null
        }
    }

    override fun initialize() {
        try {
            super.initialize()
            reactApplicationContext.addActivityEventListener(activityEventListener)
            Log.d(TAG, "SmsUserConsentModule initialized")
        } catch (e: Exception) {
            Log.e(TAG, "Error initializing module: ${e.message}", e)
        }
    }

    override fun onCatalystInstanceDestroy() {
        try {
            super.onCatalystInstanceDestroy()
            reactApplicationContext.removeActivityEventListener(activityEventListener)
            cleanupReceiver()
            Log.d(TAG, "SmsUserConsentModule destroyed")
        } catch (e: Exception) {
            Log.e(TAG, "Error destroying module: ${e.message}", e)
        }
    }
}
