package com.mezon.mobile;

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioDeviceInfo
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.Build
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import java.io.IOException

class AudioModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private var mediaPlayer: MediaPlayer? = null
    private val audioManager: AudioManager = reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    private var audioFocusRequest: AudioFocusRequest? = null

    override fun getName(): String {
        return "AudioModule"
    }

    @ReactMethod
    fun playDialtone(promise: Promise) {
        try {
            // Release any existing MediaPlayer
            stopDialtone()

            // Get resource ID for dialtone.mp3
            val rawResourceId = reactApplicationContext.resources
                .getIdentifier("dialtone", "raw", reactApplicationContext.packageName)

            if (rawResourceId == 0) {
                promise.reject("resource_not_found", "Dialtone audio resource not found")
                return
            }

            // Create and configure MediaPlayer
            mediaPlayer = MediaPlayer().apply {
                val audioAttributes = AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()

                setAudioAttributes(audioAttributes)
                setDataSource(reactApplicationContext.resources.openRawResourceFd(rawResourceId))
                isLooping = true
                prepare()
            }

            // Request audio focus
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                audioFocusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
                    .setAudioAttributes(AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build())
                    .build()
                audioManager.requestAudioFocus(audioFocusRequest!!)
            } else {
                @Suppress("DEPRECATION")
                audioManager.requestAudioFocus(null, AudioManager.STREAM_VOICE_CALL,
                    AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
            }

            // Force audio to internal speaker
            audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
            audioManager.isSpeakerphoneOn = false

            // Play audio
            mediaPlayer?.start()
            promise.resolve(true)
        } catch (e: IOException) {
            promise.reject("playback_error", "Failed to play dialtone: ${e.message}")
        }
    }

    @ReactMethod
    fun stopDialtone(promise: Promise? = null) {
        mediaPlayer?.let {
            if (it.isPlaying) {
                it.stop()
            }
            it.release()
            mediaPlayer = null
        }

        // Release audio focus
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            audioFocusRequest?.let { audioManager.abandonAudioFocusRequest(it) }
        } else {
            @Suppress("DEPRECATION")
            audioManager.abandonAudioFocus(null)
        }

        // Reset audio mode
        audioManager.mode = AudioManager.MODE_NORMAL

        promise?.resolve(true)
    }
}
