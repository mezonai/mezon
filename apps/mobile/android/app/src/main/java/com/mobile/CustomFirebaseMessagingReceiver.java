package com.mezon.mobile;

import com.google.firebase.messaging.RemoteMessage;
import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService;
import android.util.Log;
import android.content.Context;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Handler;
import android.os.Vibrator;
import android.os.VibrationEffect;
import java.util.Map;
import java.util.HashMap;
import android.os.PowerManager;
import android.os.PowerManager.WakeLock;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONObject;
import org.json.JSONException;
import java.util.ArrayList;
import androidx.core.app.NotificationManagerCompat;
import com.mezon.mobile.FullScreenNotificationIncomingCallModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReadableMap;
import java.util.Map;
import android.os.Looper;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactApplication;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.ReactInstanceEventListener;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import javax.annotation.Nullable;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;
import android.app.ActivityManager;

public class CustomFirebaseMessagingReceiver extends ReactNativeFirebaseMessagingService {
    private static final String TAG = "CustomFirebaseMessagingReceiver";
    private String callId = "6cb67209-4ef9-48c0-a8dc-2cec6cd6261d";

     private void sendEvent(ReactContext reactContext, Map<String, String> data) {
        if (reactContext != null) {
           SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(reactContext);
           SharedPreferences.Editor editor = sharedPreferences.edit();
           editor.putString("notificationDataCalling", new JSONObject(data).toString());
           editor.apply();
        } else {
            Log.e(TAG, "ReactContext is null, cannot send event");
        }
     }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Context context = getApplicationContext();
        Map<String, String> data = remoteMessage.getData();
        Log.d(TAG, "-------START onMessageReceived ------");
        ActivityManager activityManager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
        List<ActivityManager.RunningAppProcessInfo> appProcesses = activityManager.getRunningAppProcesses();
         boolean isAppInBackground = true;
            if (appProcesses != null) {
                String packageName = context.getPackageName();
                for (ActivityManager.RunningAppProcessInfo appProcess : appProcesses) {
                    if (appProcess.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND && appProcess.processName.equals(packageName)) {
                        isAppInBackground = false;
                        break;
                    }
                }
            }
        if (data.containsKey("offer") && isAppInBackground) {
        try {
              Boolean isCancel = "CANCEL_CALL".equals(new JSONObject(data.get("offer")).getString("offer"));
              ReactInstanceManager reactInstanceManager = ((ReactApplication) getApplication()).getReactNativeHost().getReactInstanceManager();
              ReactContext reactContext = reactInstanceManager.getCurrentReactContext();
              Uri soundUri = Uri.parse("android.resource://" + context.getPackageName() + "/" + R.raw.ringing);
              MediaPlayer mediaPlayer = MediaPlayer.create(context, soundUri);
              Vibrator vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);

                if (!isCancel) {
                  mediaPlayer.setLooping(true);
                  mediaPlayer.start();

                  if (vibrator != null && vibrator.hasVibrator()) {
                      VibrationEffect vibrationEffect = VibrationEffect.createOneShot(30000, VibrationEffect.DEFAULT_AMPLITUDE);
                      vibrator.vibrate(vibrationEffect);
                  }

                  WritableMap params = Arguments.createMap();
                  params.putString("offer", data.get("offer"));

                  new Handler(Looper.getMainLooper()).postDelayed(() -> {
                      mediaPlayer.stop();
                      mediaPlayer.release();
                      if (vibrator != null) {
                          vibrator.cancel();
                      }
                  }, NotificationManagerCompat.from(context).areNotificationsEnabled() ? 5000 : 10000);

                    PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
                    WakeLock wakeLock = powerManager.newWakeLock(
                        PowerManager.FULL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE,
                        "MyApp::MyWakelockTag"
                    );
                    wakeLock.acquire(10000);
                }

                try {
                    if (reactContext != null) {
                        sendEvent(reactContext, data);
                        handleIncomingCall(reactContext, data, isCancel);
                    } else {
                        reactInstanceManager.addReactInstanceEventListener(new ReactInstanceEventListener() {
                            @Override
                            public void onReactContextInitialized(ReactContext context) {
                                sendEvent(context, data);
                                handleIncomingCall(context, data, isCancel);
                                reactInstanceManager.removeReactInstanceEventListener(this);
                            }
                        });

                        if (!reactInstanceManager.hasStartedCreatingInitialContext()) {
                            reactInstanceManager.createReactContextInBackground();
                        }
                    }
                } catch (Exception e) {
                    Log.d(TAG, "log onMessageReceived => error: " + e);
                }
            } catch (JSONException e) {
                Log.e(TAG, "JSONException: " + e.getMessage());
            }
        }

        super.onMessageReceived(remoteMessage);
    }

    private void handleIncomingCall(ReactContext reactContext, Map<String, String> data, Boolean isCancel) {
        if (isCancel) {
            FullScreenNotificationIncomingCallModule module = new FullScreenNotificationIncomingCallModule((ReactApplicationContext) reactContext);
            module.hideNotification();
        } else {
            WritableMap map = Arguments.createMap();
            map.putString("notificationTitle", "Incoming Call");

            try {
                JSONObject offer = new JSONObject(data.get("offer"));
                map.putString("notificationBody", offer.getString("callerName") + " is calling you");
                map.putString("channelId", "com.mezon.mobile");
                map.putString("channelName", "Incoming Call");
                map.putString("mainComponent", "ComingCallApp");
                map.putString("notificationIcon", "ic_notification");
                map.putString("answerText", "Answer");
                map.putString("declineText", "Decline");
                map.putInt("displayCallReachabilityTimeout", 30000);
                map.putString("notificationColor", "colorAccent");
                map.putString("notificationSound", "ringing");
                map.putString("payload", new JSONObject()
                    .put("offer", offer.getString("offer"))
                    .put("callerId", offer.getString("callerId"))
                    .put("callerAvatar", offer.getString("callerAvatar"))
                    .put("callerName", offer.getString("callerName"))
                    .toString());

                ReadableMap readableMap = map;
                try {
                    FullScreenNotificationIncomingCallModule module = new FullScreenNotificationIncomingCallModule((ReactApplicationContext) reactContext);
                    module.displayNotification(callId, offer.getString("callerAvatar"), 30000, readableMap);
                } catch (JSONException e) {
                    Log.e(TAG, "JSONException: " + e.getMessage());
                }
            } catch (JSONException e) {
                Log.e(TAG, "JSONException: " + e.getMessage());
            }
        }
    }
}
