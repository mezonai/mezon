package com.mezon.mobile;

import android.content.Context;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.os.Build;
import android.util.Log;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import androidx.annotation.Nullable;

public class CustomAudioModule extends ReactContextBaseJavaModule {
    private final AudioManager audioManager;

    public CustomAudioModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.audioManager = (AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE);
    }

    @Override
    public String getName() {
        return "CustomAudioModule";
    }

    @ReactMethod
    public void setSpeaker(boolean isOn, @Nullable Callback callback) {
        try {
            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            audioManager.setSpeakerphoneOn(isOn);
            if (callback != null) {
                callback.invoke("Speakerphone is set to " + isOn);
            }
        } catch (Exception e) {
            e.printStackTrace();
            if (callback != null) {
                callback.invoke("Error: " + e.getMessage());
            }
        }
    }
}
