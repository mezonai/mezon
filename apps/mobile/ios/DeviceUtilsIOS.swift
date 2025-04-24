import UIKit

@objc(DeviceUtilsIOS)
class DeviceUtilsIOS: NSObject {
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  func isTablet(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
    resolve(UIDevice.current.userInterfaceIdiom == .pad)
  }
  
  @objc
  func constantsToExport() -> [String: Any]! {
    return [
      "isTablet": UIDevice.current.userInterfaceIdiom == .pad
    ]
  }
}
