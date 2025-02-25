package com.mezon.mobile;

import com.google.firebase.messaging.RemoteMessage;
import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingReceiver;
import android.util.Log;
import android.content.Context;
import android.content.Intent;
import java.util.HashMap;
import android.preference.PreferenceManager;
import android.content.SharedPreferences;
import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONException;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactInstanceManager.ReactInstanceEventListener;
import java.util.Map;

public class CustomFirebaseMessagingReceiver extends ReactNativeFirebaseMessagingReceiver {
    private static final String TAG = "CustomFirebaseMessagingReceiver";
    static HashMap<String, RemoteMessage> notifications = new HashMap<>();

    private void sendEvent(ReactContext reactContext, Map<String, String> data) {
        if (reactContext != null && data != null) {
            SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(reactContext);
            SharedPreferences.Editor editor = sharedPreferences.edit();
            Log.d(TAG, "-------START sendEvent 111111 ------");

            // Retrieve existing data
            String existingData = sharedPreferences.getString("notificationDataPushed", "[]");
            JSONArray dataArray;
            try {
                dataArray = new JSONArray(existingData);
            } catch (JSONException e) {
                dataArray = new JSONArray();
            }

            // Add new data
            dataArray.put(new JSONObject(data));

            // Save updated data
            editor.putString("notificationDataPushed", dataArray.toString());
            editor.apply();
        } else {
            Log.e(TAG, "ReactContext is null, cannot send event");
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        RemoteMessage remoteMessage = new RemoteMessage(intent.getExtras());
        ReactInstanceManager reactInstanceManager = ((ReactApplication) context.getApplicationContext()).getReactNativeHost().getReactInstanceManager();
        ReactContext reactContext = reactInstanceManager.getCurrentReactContext();

        if (reactContext != null) {
            sendEvent(reactContext, remoteMessage.getData());
        } else {
            reactInstanceManager.addReactInstanceEventListener(new ReactInstanceEventListener() {
                @Override
                public void onReactContextInitialized(ReactContext context) {
                    sendEvent(context, remoteMessage.getData());
                }
            });
        }
    }
}
