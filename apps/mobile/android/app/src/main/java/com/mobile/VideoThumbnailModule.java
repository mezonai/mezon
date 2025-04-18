package com.mezon.mobile;

import android.graphics.Bitmap;
import android.media.MediaMetadataRetriever;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactMethod;

import java.io.File;
import java.io.FileOutputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class VideoThumbnailModule extends ReactContextBaseJavaModule {
    private static final String TAG = "VideoThumbnailModule";

    public VideoThumbnailModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "VideoThumbnail";
    }

    private String getVideoHash(String videoPath) {
        try {
            MessageDigest digest = MessageDigest.getInstance("MD5");
            byte[] hashBytes = digest.digest(videoPath.getBytes());

            StringBuilder hexString = new StringBuilder();
            for (byte hashByte : hashBytes) {
                String hex = Integer.toHexString(0xff & hashByte);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            Log.e(TAG, "Error creating hash", e);
            return String.valueOf(videoPath.hashCode());
        }
    }

    @ReactMethod
    public void getThumbnail(String videoPath, Promise promise) {
        try {
            File cacheDir = getReactApplicationContext().getCacheDir();
            String videoHash = getVideoHash(videoPath);
            String fileName = "thumb_" + videoHash + ".jpg";
            File thumbnailFile = new File(cacheDir, fileName);

            // Check if thumbnail already exists
            if (thumbnailFile.exists()) {
                Log.d(TAG, "Using cached thumbnail for: " + videoPath);
                promise.resolve("file://" + thumbnailFile.getAbsolutePath());
                return;
            }

            // Generate new thumbnail
            Log.d(TAG, "Generating new thumbnail for: " + videoPath);
            MediaMetadataRetriever retriever = new MediaMetadataRetriever();
            retriever.setDataSource(videoPath);
            Bitmap bitmap = retriever.getFrameAtTime(100000);
            retriever.release();

            if (bitmap == null) {
                promise.reject("ERROR", "Failed to extract thumbnail from video");
                return;
            }

            FileOutputStream out = new FileOutputStream(thumbnailFile);
            bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out);
            out.close();
            bitmap.recycle();

            promise.resolve("file://" + thumbnailFile.getAbsolutePath());
        } catch (Exception e) {
            Log.e(TAG, "Error generating thumbnail", e);
            promise.reject("ERROR", e);
        }
    }
}
