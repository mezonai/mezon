package com.mezon.mobile;

import android.graphics.Bitmap;
import android.media.MediaMetadataRetriever;
import android.os.Environment;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactMethod;

import java.io.File;
import java.io.FileOutputStream;

public class VideoThumbnailModule extends ReactContextBaseJavaModule {
    public VideoThumbnailModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "VideoThumbnail";
    }

    @ReactMethod
    public void getThumbnail(String videoPath, Promise promise) {
        try {
            MediaMetadataRetriever retriever = new MediaMetadataRetriever();
            retriever.setDataSource(videoPath);
            Bitmap bitmap = retriever.getFrameAtTime(100000);

            File cacheDir = getReactApplicationContext().getCacheDir();
            String fileName = "thumb_" + System.currentTimeMillis() + ".png";
            File file = new File(cacheDir, fileName);

            FileOutputStream out = new FileOutputStream(file);
            bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out);
            out.close();

            promise.resolve("file://"+ file.getAbsolutePath());
        } catch (Exception e) {
            e.printStackTrace();
            promise.reject("ERROR", e);
        }
    }
}
