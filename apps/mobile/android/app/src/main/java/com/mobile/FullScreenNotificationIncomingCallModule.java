package com.mezon.mobile;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import android.view.WindowManager;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.json.JSONException;
import org.json.JSONObject;

import org.json.JSONArray;
import com.facebook.react.bridge.ReadableArray;

@ReactModule(name = FullScreenNotificationIncomingCallModule.NAME)
public class FullScreenNotificationIncomingCallModule extends ReactContextBaseJavaModule {
  public static final String NAME = "FullScreenNotificationIncomingCall";
  private static final String TAG = "FullscreenModule";
  public static ReactApplicationContext reactContext;

  public FullScreenNotificationIncomingCallModule(ReactApplicationContext context) {
    super(context);
    reactContext = context;
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

    @ReactMethod
    public void triggerNotificationClick(String action, String eventName) {
        Intent intent = new Intent(action);
        intent.putExtra("eventName", eventName);
        getReactApplicationContext().sendBroadcast(intent);
    }

  @ReactMethod
  public void displayNotification(String uuid, @Nullable String avatar, @Nullable int timeout,
      ReadableMap foregroundOptions) throws JSONException {
    Log.d(TAG, "displayNotification ui");
    if (foregroundOptions == null) {
      Log.d(TAG, "foregroundOptions can't null");
      return;
    }
    Intent intent = new Intent(getReactApplicationContext(), IncomingCallService.class);
    intent.putExtra("uuid", uuid);
    intent.putExtra("name", foregroundOptions.getString("notificationTitle"));
    intent.putExtra("avatar", avatar);
    intent.putExtra("info", foregroundOptions.getString("notificationBody"));
    intent.putExtra("channelId", foregroundOptions.getString("channelId"));
    intent.putExtra("channelName", foregroundOptions.getString("channelName"));
    intent.putExtra("timeout", timeout);
    intent.putExtra("icon", foregroundOptions.getString("notificationIcon"));
    intent.putExtra("answerText", foregroundOptions.getString("answerText"));
    intent.putExtra("declineText", foregroundOptions.getString("declineText"));
    intent.putExtra("notificationColor", foregroundOptions.getString("notificationColor"));
    intent.putExtra("notificationSound", foregroundOptions.getString("notificationSound"));
    intent.putExtra("mainComponent", foregroundOptions.getString("mainComponent"));

//     Boolean isVideo;
//     if(foregroundOptions.hasKey("isVideo")){
//       isVideo=foregroundOptions.getBoolean("isVideo");
//       intent.putExtra("isVideo",isVideo);
//     }

    if (foregroundOptions.hasKey("payload")) {
//       JSONObject payload = convertMapToJson(foregroundOptions.getMap("payload"));
      intent.putExtra("payload", foregroundOptions.getString("payload"));
    }
    intent.setAction(Constants.ACTION_SHOW_INCOMING_CALL);
    getReactApplicationContext().startService(intent);
  }

  @ReactMethod
  public void hideNotification() {
    if (IncomingCallActivity.active) {
      IncomingCallActivity.getInstance().destroyActivity(false);
    }
    Intent intent = new Intent(getReactApplicationContext(), IncomingCallService.class);
    intent.setAction(Constants.HIDE_NOTIFICATION_INCOMING_CALL);
    getReactApplicationContext().stopService(intent);
  }

  public static void sendEventToJs(String eventName, @Nullable WritableMap params) {
    reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, params);
  }

  private Context getAppContext() {
    return reactContext.getApplicationContext();
  }

  public Activity getCurrentReactActivity() {
    return this.reactContext.getCurrentActivity();
  }

  @ReactMethod
  public void backToApp() {
    Context context = getAppContext();
    if (context == null) {
      return;
    }
    String packageName = context.getApplicationContext().getPackageName();
    Intent focusIntent = context.getPackageManager().getLaunchIntentForPackage(packageName).cloneFilter();
    Activity activity = getCurrentReactActivity();
    boolean isOpened = activity != null;
    if (!isOpened) {
      focusIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK +
          WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED +
          WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD +
          WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
      getReactApplicationContext().startActivity(focusIntent);
    } else {
      focusIntent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
      activity.startActivity(focusIntent);
    }
  }

  @ReactMethod
  public void addListener(String eventName) {
    // Keep: Required for RN built in Event Emitter Calls.
  }

  @ReactMethod
  public void removeListeners(Integer count) {
    // Keep: Required for RN built in Event Emitter Calls.
  }

  private static JSONObject convertMapToJson(ReadableMap readableMap) throws JSONException {
    JSONObject object = new JSONObject();
    ReadableMapKeySetIterator iterator = readableMap.keySetIterator();
    while (iterator.hasNextKey()) {
      String key = iterator.nextKey();
      switch (readableMap.getType(key)) {
        case Null:
          object.put(key, JSONObject.NULL);
          break;
        case Boolean:
          object.put(key, readableMap.getBoolean(key));
          break;
        case Number:
          object.put(key, readableMap.getDouble(key));
          break;
        case String:
          object.put(key, readableMap.getString(key));
          break;
        case Map:
          object.put(key, convertMapToJson(readableMap.getMap(key)));
          break;
        case Array:
          object.put(key, convertArrayToJson(readableMap.getArray(key)));
          break;
      }
    }
    return object;
  }

  private static JSONArray convertArrayToJson(ReadableArray readableArray) throws JSONException {
    JSONArray array = new JSONArray();
    for (int i = 0; i < readableArray.size(); i++) {
      switch (readableArray.getType(i)) {
        case Null:
          break;
        case Boolean:
          array.put(readableArray.getBoolean(i));
          break;
        case Number:
          array.put(readableArray.getDouble(i));
          break;
        case String:
          array.put(readableArray.getString(i));
          break;
        case Map:
          array.put(convertMapToJson(readableArray.getMap(i)));
          break;
        case Array:
          array.put(convertArrayToJson(readableArray.getArray(i)));
          break;
      }
    }
    return array;
  }

}
