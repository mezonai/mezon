import UIKit
import React
import React_RCTAppDelegate
import Firebase
import PushKit
import AVFoundation
import AVKit
import ReactAppDependencyProvider
import SDWebImage
import SDWebImageWebPCoder
import UserNotifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {
  var window: UIWindow?
  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?
  var orientationLock: UIInterfaceOrientationMask = .all

  func application(
      _ application: UIApplication,
      didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {

      SDImageCodersManager.shared.addCoder(SDImageWebPCoder.shared)
      // Initialize React Native
      FirebaseApp.configure()
	  UNUserNotificationCenter.current().delegate = self
      // Configure audio session with proper error handling
      DispatchQueue.global(qos: .background).async {
        do {
			try AVAudioSession.sharedInstance().setCategory(.playback, options: [.mixWithOthers])
        } catch {
            print("Failed to set audio session category: \(error)")
        }
      }

      setDefaultOrientationForDevice()

      let delegate = ReactNativeDelegate()
      let factory = RCTReactNativeFactory(delegate: delegate)
      delegate.dependencyProvider = RCTAppDependencyProvider()

      reactNativeDelegate = delegate
      reactNativeFactory = factory

      window = UIWindow(frame: UIScreen.main.bounds)
      factory.startReactNative(
        withModuleName: "Mobile",
        in: window,
        launchOptions: launchOptions
      )

    return true
  }

  func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
    return RCTLinkingManager.application(app, open: url, options: options)
  }

  func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {

    let handledByLinking = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)

    return handledByLinking
  }

  func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable: Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
	  print("📱 FCM: App in BACKGROUND - Notification received")

	  let appState = application.applicationState

	  switch appState {
	  case .background:
		  print("📱 FCM: App in BACKGROUND - Notification received")
		  incrementBadge()
	  case .inactive:
		  print("📱 FCM: App INACTIVE/KILLED - Notification received")
		  incrementBadge()
	  case .active:
		  print("📱 FCM: App in FOREGROUND - Notification received (ignored)")
		  // Do nothing for foreground notifications
	  @unknown default:
		  print("📱 FCM: UNKNOWN state - Notification received")
		  incrementBadge()
	  }

	  completionHandler(.newData)
  }

  private func incrementBadge() {
	  print("incrementBadge")

	  DispatchQueue.main.async {
		  let currentBadge = UIApplication.shared.applicationIconBadgeNumber

		  let newBadge = currentBadge + 1
		  UIApplication.shared.applicationIconBadgeNumber = newBadge
		  print("FCM: Badge incremented \(currentBadge) → \(newBadge)")
	  }
  }

  // Add support for orientation handling
  func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
      // Check if any modal is currently presented
      var currentController: UIViewController? = window?.rootViewController
      while let presentedController = currentController?.presentedViewController {
          currentController = presentedController
      }

      // If we have a modal presented, allow all orientations to prevent crashes
      if currentController != window?.rootViewController {
          return .allButUpsideDown
      }

      // No modal presented - apply device-specific rules
      if UIDevice.current.userInterfaceIdiom == .pad {
          return .landscape  // iPad landscape only
      } else {
          return .allButUpsideDown  // iPhone all orientations
      }
  }

  // Set default orientation based on device type
  private func setDefaultOrientationForDevice() {
    if UIDevice.current.userInterfaceIdiom == .pad {
      // For iPad (tablet), set and lock to landscape orientation
      if #available(iOS 16.0, *) {
        // iOS 16+ approach
        let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene
        windowScene?.requestGeometryUpdate(.iOS(interfaceOrientations: .landscapeRight))
      } else {
        // Older iOS approach
        UIDevice.current.setValue(UIInterfaceOrientation.landscapeRight.rawValue, forKey: "orientation")
      }

      // Lock to landscape for iPads (but the special cases will be handled in supportedInterfaceOrientationsFor)
      self.orientationLock = .landscape
    } else {
      // For iPhone or other devices, allow all orientations
      self.orientationLock = .all
    }
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    return self.bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
