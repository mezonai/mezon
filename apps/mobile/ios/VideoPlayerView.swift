import UIKit
import AVKit
import AVFoundation
import React
import CommonCrypto
import MobileVLCKit

class VideoPlayerView: UIView {
	private var playerViewController: AVPlayerViewController?
	private var avPlayer: AVPlayer?
	private var playerItem: AVPlayerItem?

	private var vlcMediaPlayer: VLCMediaPlayer?
	private var vlcVideoView: UIView?

	private var activityIndicator: UIActivityIndicatorView!
	private static let cacheDirectory = "VideoCache"
	private static let maxCacheSize: Int64 = 100 * 1024 * 1024 // 100MB in bytes
	private var isLoadingVideo = false
	private var loadingTimeoutTimer: Timer?
	private var isUsingVLC = false

	@objc var source: String = "" {
		didSet {
			setupPlayer()
		}
	}

	override init(frame: CGRect) {
		super.init(frame: frame)
		setupCache()
		setupActivityIndicator()
		setupPlayerViewController()
		setupVLCPlayer()
	}

	required init?(coder: NSCoder) {
		super.init(coder: coder)
		setupCache()
		setupActivityIndicator()
		setupPlayerViewController()
		setupVLCPlayer()
	}

	// MARK: - Activity Indicator Setup
	private func setupActivityIndicator() {
		if #available(iOS 13.0, *) {
			activityIndicator = UIActivityIndicatorView(style: .large)
		} else {
			activityIndicator = UIActivityIndicatorView(style: .whiteLarge)
		}

		activityIndicator.color = .white
		activityIndicator.hidesWhenStopped = true
		activityIndicator.translatesAutoresizingMaskIntoConstraints = false

		addSubview(activityIndicator)

		NSLayoutConstraint.activate([
			activityIndicator.centerXAnchor.constraint(equalTo: centerXAnchor),
			activityIndicator.centerYAnchor.constraint(equalTo: centerYAnchor)
		])
	}

	private func showLoading() {
		DispatchQueue.main.async { [weak self] in
			guard let self = self else { return }
			self.isLoadingVideo = true
			self.activityIndicator.startAnimating()
			self.bringSubviewToFront(self.activityIndicator)

			self.loadingTimeoutTimer?.invalidate()
			self.loadingTimeoutTimer = Timer.scheduledTimer(withTimeInterval: 30.0, repeats: false) { [weak self] _ in
				self?.handleLoadingTimeout()
			}
		}
	}

	private func hideLoading() {
		DispatchQueue.main.async { [weak self] in
			guard let self = self else { return }
			self.isLoadingVideo = false
			self.activityIndicator.stopAnimating()
			self.loadingTimeoutTimer?.invalidate()
			self.loadingTimeoutTimer = nil
		}
	}

	private func handleLoadingTimeout() {
		hideLoading()
	}

	private func showError(message: String) {
		hideLoading()
		cleanupPlayer()
	}

	private func setupCache() {
		let cacheURL = getCacheDirectory()
		if !FileManager.default.fileExists(atPath: cacheURL.path) {
			try? FileManager.default.createDirectory(at: cacheURL, withIntermediateDirectories: true, attributes: nil)
		}
	}

	private func getCacheDirectory() -> URL {
		let documentsPath = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
		return documentsPath.appendingPathComponent(VideoPlayerView.cacheDirectory)
	}

	private func getCacheKey(for url: String) -> String {
		return url.md5
	}

	private func getCachedVideoURL(for originalURL: String) -> URL? {
		let cacheKey = getCacheKey(for: originalURL)

		let extensions = ["mov", "mp4", "webm"]
		for ext in extensions {
			let cacheURL = getCacheDirectory().appendingPathComponent("\(cacheKey).\(ext)")
			if FileManager.default.fileExists(atPath: cacheURL.path) {
				updateFileAccessTime(url: cacheURL)
				return cacheURL
			}
		}
		return nil
	}

	private func updateFileAccessTime(url: URL) {
		let now = Date()
		do {
			try FileManager.default.setAttributes([.modificationDate: now], ofItemAtPath: url.path)
		} catch {
			print("VideoPlayerView: Failed to update access time - \(error)")
		}
	}

	private func manageCacheSize() {
		let cacheSize = getCacheSize()

		if cacheSize >= VideoPlayerView.maxCacheSize {
			print("VideoPlayerView: Cache size (\(cacheSize) bytes) exceeds limit (\(VideoPlayerView.maxCacheSize) bytes). Cleaning up...")
			removeOldestCacheFiles(targetSize: VideoPlayerView.maxCacheSize / 2)
		}
	}

	private func removeOldestCacheFiles(targetSize: Int64) {
		let cacheURL = getCacheDirectory()

		do {
			let fileURLs = try FileManager.default.contentsOfDirectory(at: cacheURL, includingPropertiesForKeys: [.contentModificationDateKey, .fileSizeKey], options: [])

			var filesWithDates: [(url: URL, date: Date, size: Int64)] = []

			for fileURL in fileURLs {
				let resourceValues = try fileURL.resourceValues(forKeys: [.contentModificationDateKey, .fileSizeKey])
				if let modificationDate = resourceValues.contentModificationDate,
				   let fileSize = resourceValues.fileSize {
					filesWithDates.append((url: fileURL, date: modificationDate, size: Int64(fileSize)))
				}
			}

			filesWithDates.sort { $0.date < $1.date }

			var currentSize = getCacheSize()
			var deletedCount = 0

			for fileInfo in filesWithDates {
				if currentSize <= targetSize {
					break
				}

				do {
					try FileManager.default.removeItem(at: fileInfo.url)
					currentSize -= fileInfo.size
					deletedCount += 1
					print("VideoPlayerView: Removed cached file: \(fileInfo.url.lastPathComponent)")
				} catch {
					print("VideoPlayerView: Failed to remove cached file \(fileInfo.url.lastPathComponent) - \(error)")
				}
			}

			print("VideoPlayerView: Cache cleanup completed. Removed \(deletedCount) files. New cache size: \(currentSize) bytes")

		} catch {
			print("VideoPlayerView: Failed to enumerate cache directory - \(error)")
		}
	}

	private func getCacheSize() -> Int64 {
		let cacheURL = getCacheDirectory()
		var size: Int64 = 0

		do {
			let fileURLs = try FileManager.default.contentsOfDirectory(at: cacheURL, includingPropertiesForKeys: [.fileSizeKey], options: [])

			for fileURL in fileURLs {
				let resourceValues = try fileURL.resourceValues(forKeys: [.fileSizeKey])
				size += Int64(resourceValues.fileSize ?? 0)
			}
		} catch {
			print("VideoPlayerView: Error calculating cache size - \(error)")
		}

		return size
	}

	// MARK: - VLC Player Setup
	private func setupVLCPlayer() {
		vlcMediaPlayer = VLCMediaPlayer()
		vlcMediaPlayer?.delegate = self

		vlcVideoView = UIView(frame: bounds)
		vlcVideoView?.backgroundColor = .black
		vlcVideoView?.autoresizingMask = [.flexibleWidth, .flexibleHeight]
		vlcVideoView?.isHidden = true

		if let vlcView = vlcVideoView {
			addSubview(vlcView)
			vlcMediaPlayer?.drawable = vlcView
		}
	}

	private func setupPlayerViewController() {
		playerViewController = AVPlayerViewController()
		playerViewController?.showsPlaybackControls = true
		playerViewController?.allowsPictureInPicturePlayback = true

		if let playerVC = playerViewController {
			addSubview(playerVC.view)
			playerVC.view.frame = bounds
			playerVC.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
			playerVC.view.backgroundColor = UIColor.black
		}
	}

	private func isWebM(url: String) -> Bool {
		return url.lowercased().hasSuffix(".webm") ||
			   url.lowercased().contains(".webm?") ||
			   url.lowercased().contains("format=webm") ||
			   url.lowercased().contains("type=webm")
	}

	private func getFileExtension(from url: String) -> String {
		let lowercased = url.lowercased()
		if lowercased.hasSuffix(".webm") || lowercased.contains(".webm?") {
			return "webm"
		} else if lowercased.hasSuffix(".mp4") || lowercased.contains(".mp4?") {
			return "mp4"
		} else if lowercased.hasSuffix(".mov") || lowercased.contains(".mov?") {
			return "mov"
		}
		return "mp4" // default
	}

	private func setupPlayer() {
		guard !source.isEmpty else {
			print("VideoPlayerView: Empty source")
			return
		}

		guard let url = URL(string: source) else {
			print("VideoPlayerView: Invalid URL - \(source)")
			return
		}

		print("VideoPlayerView: Setting up player with URL - \(url)")

		showLoading()
		cleanupPlayer()
		manageCacheSize()

		isUsingVLC = isWebM(url: source)

		if let cachedURL = getCachedVideoURL(for: source) {
			print("VideoPlayerView: Using cached video")
			playVideo(url: cachedURL)
			return
		}

		if url.scheme == "https" || url.scheme == "http" {
			downloadCacheAndPlay(url: url)
		} else {
			playVideo(url: url)
		}
	}

	private func downloadCacheAndPlay(url: URL) {
		print("VideoPlayerView: Downloading and caching video from URL")

		let configuration = URLSessionConfiguration.default
		configuration.requestCachePolicy = .returnCacheDataElseLoad
		configuration.urlCache = URLCache.shared
		configuration.timeoutIntervalForRequest = 30
		configuration.timeoutIntervalForResource = 300

		let session = URLSession(configuration: configuration)

		let task = session.downloadTask(with: url) { [weak self] (tempURL, response, error) in
			guard let self = self else { return }

			DispatchQueue.main.async {
				if let error = error {
					print("VideoPlayerView: Download error - \(error.localizedDescription)")
					self.playVideo(url: url)
					return
				}

				guard let tempURL = tempURL else {
					print("VideoPlayerView: No temp URL received")
					self.playVideo(url: url)
					return
				}

				let cacheKey = self.getCacheKey(for: url.absoluteString)
				let fileExtension = self.getFileExtension(from: url.absoluteString)
				let cacheURL = self.getCacheDirectory().appendingPathComponent("\(cacheKey).\(fileExtension)")

				do {
					if FileManager.default.fileExists(atPath: cacheURL.path) {
						try FileManager.default.removeItem(at: cacheURL)
					}

					try FileManager.default.moveItem(at: tempURL, to: cacheURL)
					print("VideoPlayerView: Video cached successfully to \(cacheURL)")

					self.updateFileAccessTime(url: cacheURL)
					self.manageCacheSize()
					self.playVideo(url: cacheURL)

				} catch {
					print("VideoPlayerView: Cache error - \(error.localizedDescription)")
					self.playVideo(url: url)
				}
			}
		}

		task.resume()
	}

	private func playVideo(url: URL) {
		print("VideoPlayerView: Playing video from \(url) - Using VLC: \(isUsingVLC)")

		if isUsingVLC {
			playVideoWithVLC(url: url)
		} else {
			playVideoWithAVPlayer(url: url)
		}
	}

	// MARK: - VLC Playback
	private func playVideoWithVLC(url: URL) {
		print("VideoPlayerView: Playing with VLC - \(url)")

		DispatchQueue.main.async { [weak self] in
			guard let self = self else { return }

			// Hide AVPlayer, show VLC
			self.playerViewController?.view.isHidden = true
			self.vlcVideoView?.isHidden = false

			let media = VLCMedia(url: url)
			self.vlcMediaPlayer?.media = media
			self.vlcMediaPlayer?.play()

			// VLC doesn't have built-in loading callbacks, so hide loading after a delay
			DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
				self.hideLoading()
			}
		}
	}

	// MARK: - AVPlayer Playback
	private func playVideoWithAVPlayer(url: URL) {
		print("VideoPlayerView: Playing with AVPlayer - \(url)")

		DispatchQueue.main.async { [weak self] in
			guard let self = self else { return }

			// Show AVPlayer, hide VLC
			self.playerViewController?.view.isHidden = false
			self.vlcVideoView?.isHidden = true
		}

		let asset = AVURLAsset(url: url, options: [
			AVURLAssetPreferPreciseDurationAndTimingKey: false
		])

		let requiredKeys = ["playable", "duration"]
		asset.loadValuesAsynchronously(forKeys: requiredKeys) { [weak self] in
			guard let self = self else { return }

			DispatchQueue.main.async {
				var error: NSError?
				let status = asset.statusOfValue(forKey: "playable", error: &error)

				switch status {
				case .loaded:
					if asset.isPlayable {
						self.createPlayerItem(with: asset)
					} else {
						print("VideoPlayerView: Asset is not playable")
						self.showError(message: "Video format is not supported")
					}
				case .failed:
					print("VideoPlayerView: Asset loading failed - \(error?.localizedDescription ?? "Unknown error")")
					self.showError(message: "Failed to load video: \(error?.localizedDescription ?? "Unknown error")")
				case .cancelled:
					print("VideoPlayerView: Asset loading cancelled")
					self.hideLoading()
				default:
					print("VideoPlayerView: Asset loading status: \(status.rawValue)")
					self.hideLoading()
				}
			}
		}
	}

	private func createPlayerItem(with asset: AVAsset) {
		playerItem = AVPlayerItem(asset: asset)

		if let playerItem = playerItem {
			playerItem.preferredForwardBufferDuration = 5.0

			playerItem.addObserver(self, forKeyPath: "status", options: [.new, .initial], context: nil)
			playerItem.addObserver(self, forKeyPath: "playbackLikelyToKeepUp", options: [.new], context: nil)
			playerItem.addObserver(self, forKeyPath: "playbackBufferEmpty", options: [.new], context: nil)
		}

		avPlayer = AVPlayer(playerItem: playerItem)
		avPlayer?.automaticallyWaitsToMinimizeStalling = true
		avPlayer?.actionAtItemEnd = .none

		playerViewController?.player = avPlayer

		print("VideoPlayerView: AVPlayer created and ready")
	}

	private func cleanupPlayer() {
		// Cleanup AVPlayer
		avPlayer?.pause()

		if let previousItem = playerItem {
			previousItem.removeObserver(self, forKeyPath: "status")
			previousItem.removeObserver(self, forKeyPath: "playbackLikelyToKeepUp")
			previousItem.removeObserver(self, forKeyPath: "playbackBufferEmpty")
		}

		playerItem = nil
		avPlayer = nil

		// Cleanup VLC
		vlcMediaPlayer?.stop()

		// Cleanup timeout timer
		loadingTimeoutTimer?.invalidate()
		loadingTimeoutTimer = nil
	}

	override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey : Any]?, context: UnsafeMutableRawPointer?) {
		guard let keyPath = keyPath else { return }

		switch keyPath {
		case "status":
			if let playerItem = playerItem {
				switch playerItem.status {
				case .readyToPlay:
					print("VideoPlayerView: AVPlayer ready to play")
					hideLoading()
					avPlayer?.play()
				case .failed:
					let errorMessage = playerItem.error?.localizedDescription ?? "Unknown playback error"
					print("VideoPlayerView: AVPlayer failed with error - \(errorMessage)")
					showError(message: "Playback failed: \(errorMessage)")
				case .unknown:
					print("VideoPlayerView: AVPlayer status unknown")
				@unknown default:
					print("VideoPlayerView: AVPlayer status unknown default")
					hideLoading()
				}
			}
		case "playbackLikelyToKeepUp":
			if let playerItem = playerItem, playerItem.isPlaybackLikelyToKeepUp {
				print("VideoPlayerView: Playback likely to keep up")
				hideLoading()
				if avPlayer?.rate == 0 {
					avPlayer?.play()
				}
			}
		case "playbackBufferEmpty":
			if let playerItem = playerItem, playerItem.isPlaybackBufferEmpty {
				print("VideoPlayerView: Playback buffer empty - rebuffering")
				if avPlayer?.rate != 0 || isLoadingVideo {
					showLoading()
				}
			}
		default:
			break
		}
	}

	deinit {
		cleanupPlayer()
	}

	override func layoutSubviews() {
		super.layoutSubviews()
		playerViewController?.view.frame = bounds
		vlcVideoView?.frame = bounds
	}

	// MARK: - Cache Management

	static func clearCache() {
		let cacheURL = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
			.appendingPathComponent(cacheDirectory)

		do {
			try FileManager.default.removeItem(at: cacheURL)
			print("VideoPlayerView: Cache cleared successfully")
		} catch {
			print("VideoPlayerView: Failed to clear cache - \(error.localizedDescription)")
		}
	}

	static func getCacheSizeFormatted() -> String {
		let size = getCacheSize()
		let formatter = ByteCountFormatter()
		formatter.allowedUnits = [.useMB, .useKB, .useBytes]
		formatter.countStyle = .file
		return formatter.string(fromByteCount: size)
	}

	private static func getCacheSize() -> Int64 {
		let cacheURL = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
			.appendingPathComponent(cacheDirectory)

		var size: Int64 = 0

		do {
			let fileURLs = try FileManager.default.contentsOfDirectory(at: cacheURL, includingPropertiesForKeys: [.fileSizeKey], options: [])

			for fileURL in fileURLs {
				let resourceValues = try fileURL.resourceValues(forKeys: [.fileSizeKey])
				size += Int64(resourceValues.fileSize ?? 0)
			}
		} catch {
			print("VideoPlayerView: Error calculating cache size - \(error)")
		}

		return size
	}
}

// MARK: - String Extension for MD5
extension String {
	var md5: String {
		let data = Data(self.utf8)
		let hash = data.withUnsafeBytes { (bytes: UnsafeRawBufferPointer) -> [UInt8] in
			var hash = [UInt8](repeating: 0, count: Int(CC_MD5_DIGEST_LENGTH))
			CC_MD5(bytes.baseAddress, CC_LONG(data.count), &hash)
			return hash
		}
		return hash.map { String(format: "%02x", $0) }.joined()
	}
}
