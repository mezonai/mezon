package com.mezon.mobile;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.net.Uri;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.views.textinput.ReactEditText;
import com.facebook.react.uimanager.events.RCTEventEmitter;

public class PasteEditText extends ReactEditText {
    private static final String TAG = "PasteEditText";

    public PasteEditText(Context context) {
        super(context);
    }

	@Override
	public boolean onTextContextMenuItem(int id) {
		if (id == android.R.id.paste || id == android.R.id.pasteAsPlainText) {
			if (tryHandleImagePaste()) {
				return true;
			}
		}
		return super.onTextContextMenuItem(id);
	}

    private boolean tryHandleImagePaste() {
        try {
            ClipboardManager clipboard = (ClipboardManager) getContext().getSystemService(Context.CLIPBOARD_SERVICE);
            if (clipboard == null || !clipboard.hasPrimaryClip()) return false;

            ClipData clip = clipboard.getPrimaryClip();
            if (clip == null) return false;

            for (int i = 0; i < clip.getItemCount(); i++) {
                ClipData.Item item = clip.getItemAt(i);
                Uri uri = item.getUri();
                if (uri != null) {
                     WritableMap event = Arguments.createMap();
                     event.putString("uri", uri.toString());

                     ReactContext reactContext = (ReactContext) getContext();
                     reactContext.getJSModule(RCTEventEmitter.class)
                             .receiveEvent(getId(), "topPasteImage", event);

                     return true;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Paste image failed", e);
        }
        return false;
    }
}
