import UIKit
import React
import React_RCTAppDelegate
import Firebase
import PushKit
import AVFoundation
import AVKit
import RNBootSplash
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?
  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?
  
  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
  
    FirebaseApp.configure()

    
    // Configure audio session for playback
    try? AVAudioSession.sharedInstance().setCategory(.playback)
    
    // Setup React Native with our custom delegate
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    
    // Fix or modify the dependency provider usage based on your actual implementation
     delegate.dependencyProvider = RCTAppDependencyProvider()
    
    reactNativeDelegate = delegate
    reactNativeFactory = factory
    
    // Initialize window and start React Native
    window = UIWindow(frame: UIScreen.main.bounds)
    
    // Add custom props from Firebase messaging if needed
    // If RNFBMessagingModule is also not found, you'll need to import it or handle this differently
    // let initialProps = RNFBMessagingModule.addCustomProps(toUserProps: nil, withLaunchOptions: launchOptions)
    
    factory.startReactNative(
      withModuleName: "Mobile", // Changed to match your original module name
      in: window,
      // initialProperties: initialProps, // Comment this if RNFBMessagingModule is not available
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
  
  // Remove the override since this method doesn't exist in the superclass
  // If you need to customize the root view, check what methods are actually available
  // in RCTDefaultReactNativeFactoryDelegate or consider adding this as a new method
  func customizeRootView(_ rootView: UIView) {
    // Initialize boot splash if you have it
    RNBootSplash.initWithStoryboard("SplashScreen", rootView: rootView)
  }
}
