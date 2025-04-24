import Foundation
import UIKit

@objc(KeepAwakeIOS)
class KeepAwakeIOS: NSObject {
  
  @objc
  func activate() {
    DispatchQueue.main.async {
      UIApplication.shared.isIdleTimerDisabled = true
    }
  }
  
  @objc
  func deactivate() {
    DispatchQueue.main.async {
      UIApplication.shared.isIdleTimerDisabled = false
    }
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
