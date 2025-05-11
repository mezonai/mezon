package com.mezon.mobile;

import android.content.Context;
import android.content.res.Resources;
import android.os.Build;
import android.provider.Settings;
import android.view.WindowManager;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class NavigationBarModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public NavigationBarModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "NavigationBarModule";
    }

    @ReactMethod
    public void getNavigationBarStyle(Promise promise) {
        try {
            // This checks for navigation bar mode
            // 0 = 3-button navigation (back, home, recents)
            // 1 = 2-button navigation (back and recents combined)
            // 2 = Gesture navigation (no buttons)

            int navigationMode;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // For Android 10 and above
                navigationMode = Settings.Secure.getInt(
                    reactContext.getContentResolver(),
                    "navigation_mode",
                    0
                );
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                // For Android 9
                navigationMode = Settings.Secure.getInt(
                    reactContext.getContentResolver(),
                    "navigation_bar_gesture_mode",
                    0
                );
            } else {
                // For older versions, assume 3-button navigation
                navigationMode = 0;
            }

            boolean hasThreeButtonNavigation = (navigationMode == 0);
            promise.resolve(hasThreeButtonNavigation);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void setNavigationBarTransparent(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                getCurrentActivity().getWindow().setNavigationBarColor(android.graphics.Color.TRANSPARENT);
                getCurrentActivity().getWindow().getDecorView().setSystemUiVisibility(
                    getCurrentActivity().getWindow().getDecorView().getSystemUiVisibility() |
                    android.view.View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
                    android.view.View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                );
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "Navigation bar transparency is not supported on this Android version.");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
}
