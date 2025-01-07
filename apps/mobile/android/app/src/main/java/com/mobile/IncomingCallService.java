package com.mezon.mobile;
import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.Icon;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.util.Log;
import android.content.BroadcastReceiver;
import android.content.IntentFilter;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.app.Person;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.drawable.IconCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.squareup.picasso.Picasso;
import com.squareup.picasso.Target;

import java.io.File;
import java.net.MalformedURLException;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;

public class IncomingCallService extends Service {
  private static Runnable handleTimeout;
  public static Handler callhandle;
  private String uuid = "";
  private Integer timeoutNumber = 0;
  private boolean isRegistered = false;
  // you can perform a click only once time
  private Bundle bundleData;
  private static final String TAG = "FullscreenService";

  public int onStartCommand(Intent intent, int flags, int startId) {
    String action = intent.getAction();
    if (action != null) {
      switch (action) {
        case Constants.ACTION_SHOW_INCOMING_CALL:
          handleIncomingCall(intent);
          break;

        case Constants.HIDE_NOTIFICATION_INCOMING_CALL:
          stopSelf();
          break;

        case Constants.ACTION_START_ACTIVITY:
          // Handle starting activity here, if needed
          break;

        default:
          // Handle any other actions if needed
          break;
      }
    }
    return START_NOT_STICKY;
  }

  @Nullable
  @Override
  public IBinder onBind(Intent intent) {
    return null;
  }

  @Override
  public void onTaskRemoved(Intent rootIntent) {
    super.onTaskRemoved(rootIntent);
    stopSelf();
  }

  private void handleIncomingCall(Intent intent) {
    NotificationReceiverHandler.updateCanClick(true);
    registerBroadcastPressEvent();

    Bundle bundle = intent.getExtras();
    if (bundle != null) {
      uuid = bundle.getString("uuid");
      if (bundle.containsKey("timeout")) {
        timeoutNumber = bundle.getInt("timeout");
      }
    }

    handleNotificationWithAvatar(bundle, intent);

    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
      sendBroadcast(new Intent(Intent.ACTION_CLOSE_SYSTEM_DIALOGS));
    }
  }

  private void handleNotificationWithAvatar(Bundle bundle, Intent intent) {
    String avatarUrl = bundle.getString("avatar", null);

    if (avatarUrl != null) {
      loadAvatarAndStartForeground(avatarUrl, intent);
    } else {
      startForegroundWithNotification(intent, null);
    }
  }

  private void loadAvatarAndStartForeground(String avatarUrl, Intent intent) {
    Picasso.get().load(avatarUrl).transform(new CircleTransform()).into(new Target() {
      @Override
      public void onBitmapLoaded(Bitmap bitmap, Picasso.LoadedFrom from) {
        startForegroundWithNotification(intent, CircleTransform.transformWithRecycle(bitmap,false));
      }

      @Override
      public void onBitmapFailed(Exception e, Drawable errorDrawable) {
        startForegroundWithNotification(intent, null);
      }

      @Override
      public void onPrepareLoad(Drawable placeHolderDrawable) {
        // No-op
      }
    });
  }

  private void startForegroundWithNotification(Intent intent, Bitmap avatarBitmap) {
    Notification notification;
    try {
      notification = buildNotification(getApplicationContext(), intent, avatarBitmap);
    } catch (MalformedURLException e) {
      throw new RuntimeException("Failed to build notification", e);
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(1, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL);
    } else {
      startForeground(1, notification);
    }
  }

  private PendingIntent onButtonNotificationClick(int id, String action, String eventName) {
    if (action == Constants.ACTION_PRESS_DECLINE_CALL) {
      Intent buttonIntent = new Intent();
      buttonIntent.setAction(action);
      return PendingIntent.getBroadcast(this, id, buttonIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
    Intent emptyScreenIntent = new Intent(this, NotificationReceiverActivity.class);
    emptyScreenIntent.setAction(action);
    emptyScreenIntent.putExtras(bundleData);
    emptyScreenIntent.putExtra("eventName", eventName);
//     ReactApplication reactApplication = (ReactApplication) getApplicationContext();
//     ReactInstanceManager reactInstanceManager = reactApplication.getReactNativeHost().getReactInstanceManager();
//     ReactApplicationContext reactApplicationContext = (ReactApplicationContext) reactInstanceManager.getCurrentReactContext();
//     FullScreenNotificationIncomingCallModule module = new FullScreenNotificationIncomingCallModule(reactApplicationContext);
//     module.backToApp();
    return PendingIntent.getActivity(this, 0, emptyScreenIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
  }

  private Notification buildNotification(Context context, Intent intent, Bitmap avatarBitmap) throws MalformedURLException {
    Bundle bundle = intent.getExtras();
    if (bundle == null) {
      throw new IllegalArgumentException("Intent extras cannot be null");
    }
    bundleData = bundle;

    PendingIntent emptyPendingIntent = createEmptyPendingIntent(context, bundle);
    // Get the custom sound URI
    Uri soundUri = getCustomSoundUri(context, bundle);

    // Create the notification channel if necessary
    String channelId = bundle.getString("channelId");
    createNotificationChannel(context, channelId, bundle.getString("channelName"), soundUri);

    NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(context, channelId);
    buildNotificationBase(notificationBuilder, bundle, emptyPendingIntent, soundUri);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      boolean isVideo=bundle.getBoolean("isVideo");
      Person caller = buildCaller(bundle, avatarBitmap);
      notificationBuilder.setStyle(NotificationCompat.CallStyle.forIncomingCall(caller,
          onButtonNotificationClick(0, Constants.ACTION_PRESS_DECLINE_CALL, Constants.RNNotificationEndCallAction),
          onButtonNotificationClick(1, Constants.ACTION_PRESS_ANSWER_CALL, Constants.RNNotificationAnswerAction)
        ).setIsVideo(isVideo))
        .addPerson(caller);
    } else {
      addActionButtons(context, notificationBuilder, bundle);
    }

    applyOptionalSettings(context, notificationBuilder, bundle);

    Notification notification = notificationBuilder.build();
    notification.flags |= Notification.FLAG_INSISTENT;
    return notification;
  }

  private void buildNotificationBase(NotificationCompat.Builder notificationBuilder, Bundle bundle, PendingIntent emptyPendingIntent, Uri soundUri) {
    NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
    notificationManager.cancelAll();
    notificationBuilder.setContentTitle(bundle.getString("name"))
      .setContentText(bundle.getString("info"))
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setCategory(NotificationCompat.CATEGORY_CALL)
      .setContentIntent(emptyPendingIntent)
      .setAutoCancel(true)
      .setOngoing(true)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setVibrate(new long[] { 0, 500, 1000, 500 })
      .setSound(soundUri)
      .setFullScreenIntent(emptyPendingIntent, true);
  }

  private void applyOptionalSettings(Context context, NotificationCompat.Builder notificationBuilder, Bundle bundle) {
    String notificationColor = bundle.getString("notificationColor");
    if (notificationColor != null) {
      notificationBuilder.setColor(getColorForResourceName(context, notificationColor));
    }

    String iconName = bundle.getString("icon");
    if (iconName != null) {
      notificationBuilder.setSmallIcon(getResourceIdForResourceName(context, iconName));
    }

    notificationBuilder.setVibrate(new long[] { 0, 500, 1000, 500 });

    if (timeoutNumber > 0) {
      setTimeOutEndCall(uuid);
    }
  }

  private PendingIntent createEmptyPendingIntent(Context context, Bundle bundle) {
    Intent intent = new Intent(context, NotificationReceiverActivity.class);
    intent.putExtras(bundle);
    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    intent.setAction(Constants.onPressNotification);

    return PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
  }

  private void createNotificationChannel(Context context, String channelId, String channelName, Uri soundUri) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
      notificationManager.cancelAll();
      NotificationChannel notificationChannel = new NotificationChannel(channelId, channelName, NotificationManager.IMPORTANCE_HIGH);
      notificationChannel.enableVibration(true);
      notificationChannel.setVibrationPattern(new long[] { 0, 500, 1000, 500 });
      notificationChannel.setSound(soundUri,
        new AudioAttributes.Builder()
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .setUsage(AudioAttributes.USAGE_NOTIFICATION)
          .build());
      notificationChannel.setImportance(NotificationManager.IMPORTANCE_HIGH);
      notificationChannel.enableLights(true);
      notificationChannel.setLightColor(Color.WHITE);
      notificationChannel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
      notificationManager.createNotificationChannel(notificationChannel);
    }
  }

  private Uri getCustomSoundUri(Context context, Bundle bundle) {
    String customSound = bundle.getString("notificationSound");
    Uri soundUri = RingtoneManager.getActualDefaultRingtoneUri(context, RingtoneManager.TYPE_RINGTONE);

    if (customSound != null) {
      soundUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + File.pathSeparator + File.separator + File.separator + context.getPackageName() + "/raw/" + customSound);
    }

    return soundUri;
  }

  private void addActionButtons(Context context, NotificationCompat.Builder notificationBuilder, Bundle bundle) {
    NotificationCompat.Action declineAction = new NotificationCompat.Action.Builder(IconCompat.createWithBitmap(BitmapFactory.decodeResource(context.getResources(), R.drawable.ic_decline)),
      bundle.getString("declineText"),
      onButtonNotificationClick(0, Constants.ACTION_PRESS_DECLINE_CALL, Constants.RNNotificationEndCallAction)).build();

    NotificationCompat.Action answerAction = new NotificationCompat.Action.Builder(IconCompat.createWithBitmap(BitmapFactory.decodeResource(context.getResources(), R.drawable.ic_answer)),
      bundle.getString("answerText"),
      onButtonNotificationClick(0, Constants.ACTION_PRESS_ANSWER_CALL, Constants.RNNotificationAnswerAction)).build();

    notificationBuilder.addAction(declineAction).addAction(answerAction);
  }

  @SuppressLint("RestrictedApi")
  private Person buildCaller(Bundle bundle, Bitmap avatarBitmap) {
    Person.Builder incomingCaller = new Person.Builder()
      .setName(bundle.getString("name"))
      .setImportant(true);

    if (avatarBitmap != null) {
      incomingCaller.setIcon(IconCompat.createFromIcon(Icon.createWithBitmap(avatarBitmap)));
    }
    return incomingCaller.build();
  }

  @Override
  public void onCreate() {
      super.onCreate();
      IntentFilter filter = new IntentFilter();
      filter.addAction(Constants.ACTION_PRESS_ANSWER_CALL);
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        registerReceiver(notificationReceiver, filter, Context.RECEIVER_EXPORTED);
      } else {
        registerReceiver(notificationReceiver, filter);
      }
  }

  @Override
  public void onDestroy() {
    super.onDestroy();
    unregisterReceiver(notificationReceiver);
    Log.d(TAG, "onDestroy service");
    cancelTimer();
    stopForeground(true);
    unregisterBroadcastPressEvent();
  }

  public void registerBroadcastPressEvent() {
    if (isRegistered) return;
    IntentFilter filter = new IntentFilter();
    filter.addAction(Constants.ACTION_PRESS_DECLINE_CALL);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      getApplicationContext().registerReceiver(mReceiver, filter, Context.RECEIVER_EXPORTED);
    } else {
      getApplicationContext().registerReceiver(mReceiver, filter);
    }
    isRegistered = true;
  }

  public void unregisterBroadcastPressEvent() {
    if (!isRegistered) return;
    getApplicationContext().unregisterReceiver(mReceiver);
    isRegistered = false;
  }

  public void setTimeOutEndCall(String uuid) {
    callhandle = new Handler();
    handleTimeout = new Runnable() {
      public void run() {
        if (IncomingCallActivity.active) {
          IncomingCallActivity.getInstance().destroyActivity(false);
        }
        WritableMap params = Arguments.createMap();
        if (bundleData.containsKey("payload")) {
          params.putString("payload", bundleData.getString("payload"));
        }
        params.putString("callUUID", uuid);
        params.putString("endAction", Constants.ACTION_HIDE_CALL);
        FullScreenNotificationIncomingCallModule.sendEventToJs(Constants.RNNotificationEndCallAction, params);
        cancelTimer();
        stopForeground(true);
      }
    };
    callhandle.postDelayed(handleTimeout, timeoutNumber);
  }

  public void cancelTimer() {
    if (handleTimeout != null) {
      callhandle.removeCallbacks(handleTimeout);
    }
  }

  private int getResourceIdForResourceName(Context context, String resourceName) {
    int resourceId = context.getResources().getIdentifier(resourceName, "drawable", context.getPackageName());
    if (resourceId == 0) {
      resourceId = context.getResources().getIdentifier(resourceName, "mipmap", context.getPackageName());
    }
    return resourceId;
  }

  private int getColorForResourceName(Context context, String colorPath) {
    // java
    Resources res = context.getResources();
    String packageName = context.getPackageName();

    int colorId = res.getIdentifier(colorPath, "color", packageName);
    int desiredColor = ContextCompat.getColor(context, colorId);

    return desiredColor;
  }

  private final BroadcastReceiver notificationReceiver = new BroadcastReceiver() {
      @Override
      public void onReceive(Context context, Intent intent) {
          String action = intent.getAction();
          String eventName = intent.getStringExtra("eventName");
          if (Constants.ACTION_PRESS_ANSWER_CALL.equals(action)) {
             NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
             notificationManager.cancelAll();
             stopForeground(true);
          }
      }
  };

  private BroadcastReceiver mReceiver = new BroadcastReceiver() {
    @Override
    public void onReceive(Context context, Intent intent) {
      String action = intent.getAction();
      if (action != null) {
        if (action.equals(Constants.ACTION_PRESS_DECLINE_CALL)) {
          boolean canClick = NotificationReceiverHandler.getStatusClick();
          if (!canClick) return;
          NotificationReceiverHandler.disableClick();
          cancelTimer();
          if (IncomingCallActivity.active) {
            IncomingCallActivity.getInstance().destroyActivity(false);
          }
          WritableMap params = Arguments.createMap();
          if (bundleData.containsKey("payload")) {
            params.putString("payload", bundleData.getString("payload"));
          }
          params.putString("callUUID", uuid);
          params.putString("endAction", Constants.ACTION_REJECTED_CALL);
          FullScreenNotificationIncomingCallModule.sendEventToJs(Constants.RNNotificationEndCallAction, params);
          stopForeground(true);
        }
      }
    }
  };


}



