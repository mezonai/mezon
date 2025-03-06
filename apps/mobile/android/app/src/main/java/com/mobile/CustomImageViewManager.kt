package com.mezon.mobile

import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.bridge.ReadableMap

class CustomImageViewManager : SimpleViewManager<CustomImageView>() {
    override fun getName(): String {
        return "CustomImageView"
    }

    override fun createViewInstance(reactContext: ThemedReactContext): CustomImageView {
        return CustomImageView(reactContext)
    }

    @ReactProp(name = "url")
    fun setUrl(view: CustomImageView, url: String) {
        view.setImageUrl(url)
    }

    @ReactProp(name = "resizeMode")
    fun setResizeMode(view: CustomImageView, resizeMode: String?) {
        view.setResizeMode(resizeMode)
    }

    @ReactProp(name = "style")
    fun setStyle(view: CustomImageView, style: ReadableMap) {
        // Handle style properties if needed
    }
}
