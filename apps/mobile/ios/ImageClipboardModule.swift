import Foundation
import UIKit

@objc(ImageClipboardModule)
class ImageClipboardModule: NSObject {
  
  @objc
  func setImage(_ base64String: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      if let imageData = Data(base64Encoded: base64String, options: .ignoreUnknownCharacters),
         let image = UIImage(data: imageData) {
        UIPasteboard.general.image = image
        resolve(true)
      } else {
        reject("ERROR", "Failed to decode base64 image", nil)
      }
    }
  }
  
  @objc
  func copyImageFromPath(_ path: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      let filePath = path.hasPrefix("file://") ? String(path.dropFirst(7)) : path
      if let image = UIImage(contentsOfFile: filePath) {
        UIPasteboard.general.image = image
        resolve(true)
      } else {
        reject("ERROR", "Failed to load image from path", nil)
      }
    }
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
