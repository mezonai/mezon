package com.mezon.mobile;

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothHeadset
import android.bluetooth.BluetoothProfile
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.BroadcastReceiver
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener

class BluetoothModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), PermissionListener {
    private val mReactContext: ReactApplicationContext = reactContext
    private var headsetConnected: Boolean = false
    private val bluetoothAdapter: BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter()
    private var receiver: BroadcastReceiver? = null
    private var pendingPromise: Promise? = null

    private val BLUETOOTH_PERMISSIONS_REQUEST_CODE = 1

    override fun getName(): String {
        return "BluetoothModule"
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        mReactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    private fun hasBluetoothPermissions(): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return ContextCompat.checkSelfPermission(
                reactApplicationContext,
                Manifest.permission.BLUETOOTH_CONNECT
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            // For Android 11 and below
            return true // Old permissions are granted at install time
        }
    }

    private fun requestBluetoothPermissions(promise: Promise?) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            pendingPromise = promise

            val activity = currentActivity as? PermissionAwareActivity
                ?: run {
                    promise?.reject("ACTIVITY_NOT_FOUND", "Activity is not available")
                    return
                }

            activity.requestPermissions(
                arrayOf(
                    Manifest.permission.BLUETOOTH_CONNECT,
                    Manifest.permission.BLUETOOTH_SCAN
                ),
                BLUETOOTH_PERMISSIONS_REQUEST_CODE,
                this
            )
        } else {
            // For older Android versions, permissions are granted at install time
            promise?.resolve(true)
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String>,
        grantResults: IntArray
    ): Boolean {
        if (requestCode == BLUETOOTH_PERMISSIONS_REQUEST_CODE) {
            val allGranted = grantResults.all { it == PackageManager.PERMISSION_GRANTED }

            if (allGranted) {
                pendingPromise?.resolve(true)
            } else {
                pendingPromise?.reject("PERMISSION_DENIED", "Bluetooth permissions were denied")
            }

            pendingPromise = null
            return true
        }
        return false
    }

    @ReactMethod
    fun isBluetoothHeadsetConnected(promise: Promise) {
        if (bluetoothAdapter == null) {
            promise.reject("BLUETOOTH_ERROR", "Bluetooth not supported on this device")
            return
        }

        if (!bluetoothAdapter.isEnabled) {
            promise.resolve(false)
            return
        }

        // Check permissions first
        if (!hasBluetoothPermissions()) {
            requestBluetoothPermissions(promise)
            return
        }

        // Check if we already have the state
        if (headsetConnected) {
            promise.resolve(true)
            return
        }

        // Otherwise check via the profile proxy
        try {
            bluetoothAdapter.getProfileProxy(mReactContext, object : BluetoothProfile.ServiceListener {
                override fun onServiceConnected(profile: Int, proxy: BluetoothProfile) {
                    if (profile == BluetoothProfile.HEADSET) {
                        val headsetProxy = proxy as BluetoothHeadset
                        val devices = headsetProxy.connectedDevices
                        bluetoothAdapter.closeProfileProxy(BluetoothProfile.HEADSET, proxy)
                        promise.resolve(!devices.isNullOrEmpty())
                    }
                }

                override fun onServiceDisconnected(profile: Int) {
                    promise.resolve(false)
                }
            }, BluetoothProfile.HEADSET)
        } catch (e: SecurityException) {
            // If we somehow got here despite permission checks
            promise.reject("PERMISSION_DENIED", "Bluetooth permission is required: ${e.message}")
        } catch (e: Exception) {
            promise.reject("ERROR", "Error checking Bluetooth headset: ${e.message}")
        }
    }

    @ReactMethod
    fun startBluetoothListener() {
        // Check permissions first
        if (!hasBluetoothPermissions()) {
            requestBluetoothPermissions(null)
            return
        }

        if (receiver != null) {
            return // Already registered
        }

        try {
            val filter = IntentFilter()
            filter.addAction(BluetoothHeadset.ACTION_CONNECTION_STATE_CHANGED)

            receiver = object : BroadcastReceiver() {
                override fun onReceive(context: Context, intent: Intent) {
                    val action = intent.action
                    if (BluetoothHeadset.ACTION_CONNECTION_STATE_CHANGED == action) {
                        val state = intent.getIntExtra(BluetoothHeadset.EXTRA_STATE, BluetoothHeadset.STATE_DISCONNECTED)

                        val isConnected = state == BluetoothHeadset.STATE_CONNECTED
                        headsetConnected = isConnected

                        val params = Arguments.createMap()
                        params.putBoolean("connected", isConnected)
                        sendEvent("bluetoothHeadsetConnectionChanged", params)
                    }
                }
            }

            mReactContext.registerReceiver(receiver, filter)
        } catch (e: SecurityException) {
            // Handle security exception
        }
    }

    @ReactMethod
    fun stopBluetoothListener() {
        if (receiver != null) {
            try {
                mReactContext.unregisterReceiver(receiver)
            } catch (e: Exception) {
                // Handle any errors
            }
            receiver = null
        }
    }

    @ReactMethod
    fun requestPermissions(promise: Promise) {
        if (hasBluetoothPermissions()) {
            promise.resolve(true)
            return
        }

        requestBluetoothPermissions(promise)
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for React Native event emitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for React Native event emitter
    }
}
