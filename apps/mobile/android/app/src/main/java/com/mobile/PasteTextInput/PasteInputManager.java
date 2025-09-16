package com.mezon.mobile;

import androidx.annotation.NonNull;
import com.facebook.react.views.textinput.ReactTextInputManager;
import com.facebook.react.uimanager.ThemedReactContext;
import java.util.HashMap;
import java.util.Map;

public class PasteInputManager extends ReactTextInputManager {
    public static final String REACT_CLASS = "PasteInput";

    @NonNull
    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @NonNull
    @Override
    public PasteEditText createViewInstance(@NonNull ThemedReactContext reactContext) {
        return new PasteEditText(reactContext);
    }

    @Override
    public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
        Map<String, Object> existing = super.getExportedCustomDirectEventTypeConstants();
        Map<String, Object> constants = existing != null ? new HashMap<>(existing) : new HashMap<>();

        Map<String, String> onPasteImage = new HashMap<>();
        onPasteImage.put("registrationName", "onPasteImage");
        constants.put("topPasteImage", onPasteImage);

        return constants;
    }
}
