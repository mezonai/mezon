import Foundation
import AVFoundation

@objc(AudioModule)
class AudioModule: NSObject {
  private var audioPlayer: AVAudioPlayer?
  private var audioSession: AVAudioSession = AVAudioSession.sharedInstance()
  private var previousCategory: AVAudioSession.Category?
  private var previousMode: AVAudioSession.Mode?
  private var previousOptions: AVAudioSession.CategoryOptions?

  @objc
  func playDialtone(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    do {
      // Stop any existing audio
      stopDialtoneInternal()
      
      // Save current audio session settings
      previousCategory = audioSession.category
      previousMode = audioSession.mode
      previousOptions = audioSession.categoryOptions
      
      // Configure audio session for voice playback through speaker
      try audioSession.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .mixWithOthers])
      try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
      
      // Force audio to speaker
      try audioSession.overrideOutputAudioPort(.speaker)
      
      // Get URL for dialtone.mp3 in the main bundle
      guard let url = Bundle.main.url(forResource: "dialtone", withExtension: "mp3") else {
        reject("resource_not_found", "Dialtone audio resource not found", nil)
        return
      }
      
      // Create and configure audio player
      audioPlayer = try AVAudioPlayer(contentsOf: url)
      audioPlayer?.numberOfLoops = -1 // Loop indefinitely
      audioPlayer?.volume = 1.0
      audioPlayer?.prepareToPlay()
      audioPlayer?.play()
      
      resolve(true)
    } catch {
      reject("audio_error", "Failed to play dialtone: \(error.localizedDescription)", error)
    }
  }
  
  @objc
  func stopDialtone(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    do {
      stopDialtoneInternal()
      
      // Restore previous audio session settings if they exist
      if let category = previousCategory, let mode = previousMode, let options = previousOptions {
        try audioSession.setCategory(category, mode: mode, options: options)
      }
      
      try audioSession.setActive(false, options: .notifyOthersOnDeactivation)
      resolve(true)
    } catch {
      reject("audio_error", "Failed to stop dialtone: \(error.localizedDescription)", error)
    }
  }
  
  private func stopDialtoneInternal() {
    if audioPlayer?.isPlaying == true {
      audioPlayer?.stop()
    }
    audioPlayer = nil
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
