import Foundation
import React

@objc(CustomImageViewIOSManager)
class CustomImageViewIOSManager: RCTViewManager {
  override func view() -> UIView! {
    return CustomImageViewIOS()
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
