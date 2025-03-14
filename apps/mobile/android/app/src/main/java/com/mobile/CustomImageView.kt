package com.mezon.mobile

import android.content.Context
import android.widget.ImageView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.request.RequestOptions
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.bumptech.glide.load.resource.drawable.DrawableTransitionOptions

class CustomImageView(context: Context) : ImageView(context) {
    private var currentUrl: String? = null
    private var currentResizeMode: String? = null

    fun setImageUrl(url: String) {
        currentUrl = url
        updateImage()
    }

    fun setResizeMode(resizeMode: String?) {
        currentResizeMode = resizeMode
        updateImage()
    }

    private fun updateImage() {
        val requestOptions = when (currentResizeMode) {
            "cover" -> RequestOptions().centerCrop()
            "contain" -> RequestOptions().fitCenter()
            "center" -> RequestOptions().centerInside()
            else -> RequestOptions().fitCenter()
        }.diskCacheStrategy(DiskCacheStrategy.ALL)

        Glide.with(context)
            .load(currentUrl)
            .apply(requestOptions)
            .transition(DrawableTransitionOptions.withCrossFade())
            .into(this)
    }
}
