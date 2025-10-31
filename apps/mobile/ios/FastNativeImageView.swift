import UIKit
import SDWebImage
import React
import Photos

@objc(FastNativeImageView)
class FastNativeImageView: UIView {

  private var imageView: UIImageView!
  private var activityIndicator: UIActivityIndicatorView!
  private var currentURL: URL?

  override init(frame: CGRect) {
	super.init(frame: frame)
	setupViews()
	configureSDWebImage()
  }

  required init?(coder: NSCoder) {
	super.init(coder: coder)
	setupViews()
	configureSDWebImage()
  }

  private func setupViews() {
	imageView = UIImageView(frame: bounds)
	imageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
	imageView.contentMode = .scaleAspectFill
	imageView.clipsToBounds = true
	imageView.layer.drawsAsynchronously = true
	addSubview(imageView)

	if #available(iOS 13.0, *) {
	  activityIndicator = UIActivityIndicatorView(style: .medium)
	} else {
	  activityIndicator = UIActivityIndicatorView(style: .gray)
	}
	activityIndicator.center = CGPoint(x: bounds.midX, y: bounds.midY)
	activityIndicator.autoresizingMask = [.flexibleLeftMargin, .flexibleRightMargin, .flexibleTopMargin, .flexibleBottomMargin]
	activityIndicator.hidesWhenStopped = true
	addSubview(activityIndicator)
  }

  private func configureSDWebImage() {
	let cache = SDImageCache.shared

	cache.config.maxMemoryCost = 200 * 1024 * 1024
	cache.config.maxMemoryCount = 100
	cache.config.shouldUseWeakMemoryCache = true

	cache.config.maxDiskAge = 60 * 60 * 24 * 7
	cache.config.maxDiskSize = 1000 * 1024 * 1024
	cache.config.diskCacheExpireType = .accessDate

	let downloader = SDWebImageDownloader.shared
	downloader.config.maxConcurrentDownloads = 6
	downloader.config.downloadTimeout = 15.0
	downloader.config.executionOrder = .lifoExecutionOrder
  }

  @objc var source: NSDictionary? {
	didSet {
	  if source != oldValue {
		loadImage()
	  }
	}
  }

  @objc var resizeMode: String = "cover" {
	didSet {
	  updateContentMode()
	}
  }

  @objc var onLoadStart: RCTDirectEventBlock?
  @objc var onLoad: RCTDirectEventBlock?
  @objc var onError: RCTDirectEventBlock?

  private func updateContentMode() {
	switch resizeMode {
	case "cover":
	  imageView.contentMode = .scaleAspectFill
	case "contain":
	  imageView.contentMode = .scaleAspectFit
	case "stretch":
	  imageView.contentMode = .scaleToFill
	case "center":
	  imageView.contentMode = .center
	default:
	  imageView.contentMode = .scaleAspectFill
	}
  }

  private func extractAssetIdentifier(from urlString: String) -> String? {
	if urlString.hasPrefix("ph://") {
	  let identifier = urlString.replacingOccurrences(of: "ph://", with: "")
	  if let slashIndex = identifier.firstIndex(of: "/") {
		return String(identifier[..<slashIndex])
	  }
	  return identifier
	}
	return nil
  }

  private func loadPhotoAsset(identifier: String) {
	onLoadStart?([:])
	activityIndicator.startAnimating()

	let fetchResult = PHAsset.fetchAssets(withLocalIdentifiers: [identifier], options: nil)

	guard let asset = fetchResult.firstObject else {
	  activityIndicator.stopAnimating()
	  onError?(["error": "Asset not found in Photos library"])
	  return
	}

	let options = PHImageRequestOptions()
	options.deliveryMode = .highQualityFormat
	options.isNetworkAccessAllowed = true
	options.isSynchronous = false

	let scale = UIScreen.main.scale
	let targetSize: CGSize
	if bounds.width > 0 && bounds.height > 0 {
	  targetSize = CGSize(
		width: ceil(bounds.width * scale),
		height: ceil(bounds.height * scale)
	  )
	} else {
	  targetSize = PHImageManagerMaximumSize
	}

	PHImageManager.default().requestImage(
	  for: asset,
	  targetSize: targetSize,
	  contentMode: .aspectFill,
	  options: options
	) { [weak self] (image, info) in
	  guard let self = self else { return }

	  DispatchQueue.main.async {
		self.activityIndicator.stopAnimating()

		if let error = info?[PHImageErrorKey] as? Error {
		  self.onError?(["error": error.localizedDescription])
		  return
		}

		if let image = image {
		  UIView.transition(
			with: self.imageView,
			duration: 0.2,
			options: .transitionCrossDissolve,
			animations: {
			  self.imageView.image = image
			},
			completion: nil
		  )

		  self.onLoad?([
			"width": image.size.width,
			"height": image.size.height
		  ])
		} else {
		  self.onError?(["error": "Failed to load image from Photos library"])
		}
	  }
	}
  }

  private func loadImage() {
	guard let source = source,
		  let uri = source["uri"] as? String,
		  !uri.isEmpty else {
	  onError?(["error": "Invalid URL"])
	  return
	}

	if let assetIdentifier = extractAssetIdentifier(from: uri) {
	  loadPhotoAsset(identifier: assetIdentifier)
	  return
	}

	guard let url = URL(string: uri) else {
	  onError?(["error": "Invalid URL"])
	  return
	}

	if currentURL == url && imageView.image != nil {
	  return
	}

	imageView.sd_cancelCurrentImageLoad()
	currentURL = url

	onLoadStart?([:])
	activityIndicator.startAnimating()

	var options: SDWebImageOptions = [
	  .retryFailed,
	  .scaleDownLargeImages,
	  .continueInBackground,
	  .handleCookies,
	  .progressiveLoad,
	  .avoidAutoSetImage
	]

	if let priority = source["priority"] as? String {
	  switch priority {
	  case "high":
		options.insert(.highPriority)
	  case "low":
		options.insert(.lowPriority)
	  default:
		break
	  }
	}

	var context: [SDWebImageContextOption: Any] = [:]

	let size = bounds.size
	if size.width > 0 && size.height > 0 {
	  let scale = UIScreen.main.scale
	  let pixelSize = CGSize(width: ceil(size.width * scale), height: ceil(size.height * scale))
	  context[.imageThumbnailPixelSize] = NSValue(cgSize: pixelSize)
	}

	context[.imageScaleFactor] = UIScreen.main.scale

	if let headers = source["headers"] as? [String: String] {
	  var modifiedRequest = URLRequest(url: url)
	  for (key, value) in headers {
		modifiedRequest.setValue(value, forHTTPHeaderField: key)
	  }
	  context[.downloadRequestModifier] = SDWebImageDownloaderRequestModifier(block: { _ in
		return modifiedRequest
	  })
	}

	imageView.sd_setImage(
	  with: url,
	  placeholderImage: nil,
	  options: options,
	  context: context,
	  progress: nil
	) { [weak self] (image, error, cacheType, imageURL) in
	  guard let self = self else { return }

	  self.activityIndicator.stopAnimating()

	  if let error = error {
		self.currentURL = nil
		self.onError?([
		  "error": error.localizedDescription
		])
	  } else if let image = image {
		let shouldAnimate = cacheType == .none

		if shouldAnimate {
		  UIView.transition(with: self.imageView,
						   duration: 0.2,
						   options: .transitionCrossDissolve,
						   animations: {
			self.imageView.image = image
		  }, completion: nil)
		} else {
		  self.imageView.image = image
		}

		self.onLoad?([
		  "width": image.size.width,
		  "height": image.size.height
		])
	  }
	}
  }

  override func layoutSubviews() {
	super.layoutSubviews()
	imageView.frame = bounds
	activityIndicator.center = CGPoint(x: bounds.midX, y: bounds.midY)
  }

  override func didMoveToWindow() {
	super.didMoveToWindow()

	if window == nil {
	  if let image = imageView.image {
		let imageSize = image.size.width * image.size.height * image.scale * image.scale
		let threshold: CGFloat = 2048 * 2048

		if imageSize > threshold {
		  imageView.image = nil
		}
	  }
	}
  }

  deinit {
	imageView.sd_cancelCurrentImageLoad()
	currentURL = nil
  }
}
