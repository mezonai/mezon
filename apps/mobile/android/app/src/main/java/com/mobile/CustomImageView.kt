package com.mezon.mobile

import android.content.Context
import android.graphics.drawable.Drawable
import android.view.View
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.RelativeLayout
import com.bumptech.glide.Glide
import com.bumptech.glide.load.DataSource
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.load.engine.GlideException
import com.bumptech.glide.request.RequestListener
import com.bumptech.glide.request.RequestOptions
import com.bumptech.glide.request.target.Target
import com.bumptech.glide.load.resource.drawable.DrawableTransitionOptions
import androidx.core.content.ContextCompat

class CustomImageView(context: Context) : RelativeLayout(context) {
    private var currentUrl: String? = null
    private var currentResizeMode: String? = null
    private val imageView = ImageView(context)
    private val loadingIcon = ProgressBar(context, null, android.R.attr.progressBarStyleSmall)

    init {
        val layoutParams = LayoutParams(
            LayoutParams.MATCH_PARENT,
            LayoutParams.MATCH_PARENT
        )

        imageView.alpha = 0f
        addView(imageView, layoutParams)

        val loadingParams = LayoutParams(
            LayoutParams.WRAP_CONTENT,
            LayoutParams.WRAP_CONTENT
        )
        loadingParams.addRule(CENTER_IN_PARENT)
        addView(loadingIcon, loadingParams)

        loadingIcon.visibility = View.GONE
    }

    fun setImageUrl(url: String) {
        currentUrl = url
        updateImage()
    }

    fun setResizeMode(resizeMode: String?) {
        currentResizeMode = resizeMode
        updateImage()
    }

    private fun updateImage() {
        if (currentUrl == null) return

        loadingIcon.visibility = View.VISIBLE
        imageView.alpha = 0f

        val requestOptions = when (currentResizeMode) {
            "cover" -> RequestOptions().centerCrop()
            "contain" -> RequestOptions().fitCenter()
            "center" -> RequestOptions().centerInside()
            else -> RequestOptions().fitCenter()
        }.diskCacheStrategy(DiskCacheStrategy.ALL)

        Glide.with(context)
            .load(currentUrl)
            .apply(requestOptions)
            .transition(DrawableTransitionOptions.withCrossFade(500))
            .listener(object : RequestListener<Drawable> {
                override fun onLoadFailed(
					e: GlideException?,
					model: Any?,
					target: Target<Drawable>,
					isFirstResource: Boolean
				): Boolean {
                    loadingIcon.visibility = View.GONE
                    return false
                }

                override fun onResourceReady(
					resource: Drawable,
					model: Any,
					target: Target<Drawable>?,
					dataSource: DataSource,
					isFirstResource: Boolean
				): Boolean {
                    loadingIcon.visibility = View.GONE
                    imageView.alpha = 1f
                    return false
                }
            })
            .into(imageView)
    }
}
