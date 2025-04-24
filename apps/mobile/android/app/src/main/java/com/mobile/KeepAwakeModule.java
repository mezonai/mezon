package com.mezon.mobile;

import android.app.Activity;
import android.os.Handler;
import android.os.Looper;
import android.view.WindowManager;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class KeepAwakeModule extends ReactContextBaseJavaModule {

    public KeepAwakeModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "KeepAwake";
    }

    @ReactMethod
    public void activate() {
        final Activity activity = getCurrentActivity();
        if (activity != null) {
            new Handler(Looper.getMainLooper()).post(new Runnable() {
                @Override
                public void run() {
                    try {
                        activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                    } catch (Exception e) {
                        throw new KeepAwakeExceptions.ActivateKeepAwakeException();
                    }
                }
            });
        } else {
            throw new KeepAwakeExceptions.MissingModuleException("Activity");
        }
    }

    @ReactMethod
    public void deactivate() {
        final Activity activity = getCurrentActivity();
        if (activity != null) {
            new Handler(Looper.getMainLooper()).post(new Runnable() {
                @Override
                public void run() {
                    try {
                        activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                    } catch (Exception e) {
                        throw new KeepAwakeExceptions.DeactivateKeepAwakeException();
                    }
                }
            });
        } else {
            throw new KeepAwakeExceptions.MissingModuleException("Activity");
        }
    }
}
