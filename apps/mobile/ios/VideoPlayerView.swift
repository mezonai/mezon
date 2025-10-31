import UIKit
import AVKit
import AVFoundation
import React
import MobileVLCKit

class VideoPlayerView: UIView, VLCMediaPlayerDelegate {
	private var playerViewController: AVPlayerViewController?
	private var avPlayer: AVPlayer?
	private var playerItem: AVPlayerItem?
	
	private var vlcMediaPlayer: VLCMediaPlayer?
	private var vlcVideoView: UIView?
	
	private var activityIndicator: UIActivityIndicatorView!
	private var isLoadingVideo = false
	private var loadingTimeoutTimer: Timer?
	private var isUsingVLC = false
	
	private var statusObserver: NSKeyValueObservation?
	private var bufferEmptyObserver: NSKeyValueObservation?
	private var bufferKeepUpObserver: NSKeyValueObservation?
	private var loadedTimeRangesObserver: NSKeyValueObservation?
	
	@objc var source: String = "" {
		didSet {
			setupPlayer()
		}
	}
	
	override init(frame: CGRect) {
		super.init(frame: frame)
		setupActivityIndicator()
		setupPlayerViewController()
		setupVLCPlayer()
	}
	
	required init?(coder: NSCoder) {
		super.init(coder: coder)
		setupActivityIndicator()
		setupPlayerViewController()
		setupVLCPlayer()
	}
	
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
	
	private func setupPlayer() {
		guard !source.isEmpty else { return }
		guard let url = URL(string: source) else { return }
		
		showLoading()
		cleanupPlayer()
		isUsingVLC = isWebM(url: source)
		playVideoProgressively(url: url)
	}
	
	private func playVideoProgressively(url: URL) {
		if isUsingVLC {
			playVideoWithVLC(url: url)
		} else {
			playVideoWithAVPlayerProgressive(url: url)
		}
	}
	
	private func playVideoWithVLC(url: URL) {
		DispatchQueue.main.async { [weak self] in
			guard let self = self else { return }
			
			self.playerViewController?.view.isHidden = true
			self.vlcVideoView?.isHidden = false
			
			let media = VLCMedia(url: url)
			self.vlcMediaPlayer?.media = media
			self.vlcMediaPlayer?.play()
			
			DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
				self.hideLoading()
			}
		}
	}
	
	private func playVideoWithAVPlayerProgressive(url: URL) {
		DispatchQueue.main.async { [weak self] in
			guard let self = self else { return }
			self.playerViewController?.view.isHidden = false
			self.vlcVideoView?.isHidden = true
		}
		
		let asset = AVURLAsset(url: url, options: [
			AVURLAssetPreferPreciseDurationAndTimingKey: false,
			"AVURLAssetAllowsCellularAccessKey": true
		])
		
		playerItem = AVPlayerItem(asset: asset)
		
		if let playerItem = playerItem {
			playerItem.preferredForwardBufferDuration = 3.0
			
			if #available(iOS 14.0, *) {
				playerItem.preferredMaximumResolution = CGSize(width: 1920, height: 1080)
			}
		}
		
		avPlayer = AVPlayer(playerItem: playerItem)
		
		if #available(iOS 10.0, *) {
			avPlayer?.automaticallyWaitsToMinimizeStalling = true
		}
		
		avPlayer?.actionAtItemEnd = .none
		playerViewController?.player = avPlayer
		setupProgressiveLoadingObservers()
	}
	
	private func setupProgressiveLoadingObservers() {
		guard let playerItem = playerItem else { return }
		
		statusObserver = playerItem.observe(\.status, options: [.new, .initial]) { [weak self] item, _ in
			DispatchQueue.main.async {
				self?.handlePlayerItemStatusChange(item.status)
			}
		}
		
		bufferEmptyObserver = playerItem.observe(\.isPlaybackBufferEmpty, options: [.new]) { [weak self] item, _ in
			DispatchQueue.main.async {
				if item.isPlaybackBufferEmpty {
					self?.showLoading()
				}
			}
		}
		
		bufferKeepUpObserver = playerItem.observe(\.isPlaybackLikelyToKeepUp, options: [.new]) { [weak self] item, _ in
			DispatchQueue.main.async {
				if item.isPlaybackLikelyToKeepUp {
					self?.hideLoading()
					if self?.avPlayer?.rate == 0 {
						self?.avPlayer?.play()
					}
				}
			}
		}
		
		loadedTimeRangesObserver = playerItem.observe(\.loadedTimeRanges, options: [.new]) { [weak self] item, _ in
			self?.handleLoadedTimeRangesChange(item)
		}
		
		NotificationCenter.default.addObserver(
			self,
			selector: #selector(playerStalled),
			name: .AVPlayerItemPlaybackStalled,
			object: playerItem
		)
		
		NotificationCenter.default.addObserver(
			self,
			selector: #selector(playerDidFinishPlaying),
			name: .AVPlayerItemDidPlayToEndTime,
			object: playerItem
		)
	}
	
	private func handlePlayerItemStatusChange(_ status: AVPlayerItem.Status) {
		switch status {
		case .readyToPlay:
			break
		case .failed:
			hideLoading()
			if let error = playerItem?.error {
				showError(message: "Playback failed: \(error.localizedDescription)")
			}
		case .unknown:
			break
		@unknown default:
			break
		}
	}
	
	private func handleLoadedTimeRangesChange(_ item: AVPlayerItem) {
		guard let timeRange = item.loadedTimeRanges.first?.timeRangeValue else { return }
		let loadedDuration = CMTimeGetSeconds(timeRange.duration)
		let totalDuration = CMTimeGetSeconds(item.duration)
	}
	
	@objc private func playerStalled() {
		showLoading()
	}
	
	@objc private func playerDidFinishPlaying() {
		hideLoading()
	}
	
	private func cleanupProgressiveLoadingObservers() {
		statusObserver?.invalidate()
		bufferEmptyObserver?.invalidate()
		bufferKeepUpObserver?.invalidate()
		loadedTimeRangesObserver?.invalidate()
		
		statusObserver = nil
		bufferEmptyObserver = nil
		bufferKeepUpObserver = nil
		loadedTimeRangesObserver = nil
		
		NotificationCenter.default.removeObserver(self)
	}
	
	private func cleanupPlayer() {
		cleanupProgressiveLoadingObservers()
		
		avPlayer?.pause()
		playerItem = nil
		avPlayer = nil
		
		vlcMediaPlayer?.stop()
		
		loadingTimeoutTimer?.invalidate()
		loadingTimeoutTimer = nil
	}
	
	deinit {
		cleanupPlayer()
	}
	
	override func layoutSubviews() {
		super.layoutSubviews()
		playerViewController?.view.frame = bounds
		vlcVideoView?.frame = bounds
	}
}
