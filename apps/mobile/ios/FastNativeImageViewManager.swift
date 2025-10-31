import Foundation
import React
import SDWebImage

@objc(FastNativeImageViewManager)
class FastNativeImageViewManager: RCTViewManager {
  
  override func view() -> UIView! {
	return FastNativeImageView()
  }
  
  override static func requiresMainQueueSetup() -> Bool {
	return true
  }
  
  @objc
  func getCacheSize(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
	DispatchQueue.global(qos: .utility).async {
	  SDImageCache.shared.calculateSize { (fileCount, totalSize) in
		let cacheSizeInMB = Double(totalSize) / (1024.0 * 1024.0)
		
		DispatchQueue.main.async {
		  resolve([
			"sizeInBytes": totalSize,
			"sizeInMB": cacheSizeInMB,
			"fileCount": fileCount
		  ])
		}
	  }
	}
  }
  
  @objc
  func clearCache(_ sizeToRemoveInMB: NSNumber,
				  resolve: @escaping RCTPromiseResolveBlock,
				  reject: @escaping RCTPromiseRejectBlock) {
	
	let sizeToRemoveInBytes = UInt64(sizeToRemoveInMB.doubleValue * 1024.0 * 1024.0)
	
	DispatchQueue.global(qos: .utility).async {
	  let cache = SDImageCache.shared
	  
	  guard let cachePath = cache.diskCachePath as String?,
			let fileManager = FileManager.default as FileManager?,
			let files = try? fileManager.contentsOfDirectory(atPath: cachePath) else {
		DispatchQueue.main.async {
		  reject("ERROR", "Failed to access cache directory", nil)
		}
		return
	  }
	  
	  var filesToRemove: [(path: String, date: Date, size: UInt64)] = []
	  var removedSize: UInt64 = 0
	  
	  // Collect file info with access dates
	  for file in files {
		let filePath = (cachePath as NSString).appendingPathComponent(file)
		
		guard let attributes = try? fileManager.attributesOfItem(atPath: filePath),
			  let accessDate = attributes[.modificationDate] as? Date,
			  let fileSize = attributes[.size] as? UInt64 else {
		  continue
		}
		
		filesToRemove.append((path: filePath, date: accessDate, size: fileSize))
	  }
	  
	  // Sort by access date (oldest first)
	  filesToRemove.sort { $0.date < $1.date }
	  
	  var removedFileCount = 0
	  
	  // Remove oldest files until we've removed enough
	  for fileInfo in filesToRemove {
		guard removedSize < sizeToRemoveInBytes else { break }
		
		do {
		  try fileManager.removeItem(atPath: fileInfo.path)
		  removedSize += fileInfo.size
		  removedFileCount += 1
		} catch {
		  print("Failed to remove cache file: \(error.localizedDescription)")
		}
	  }
	  
	  // Clear memory cache
	  DispatchQueue.main.async {
		SDImageCache.shared.clearMemory()
		
		let removedSizeInMB = Double(removedSize) / (1024.0 * 1024.0)
		
		resolve([
		  "removedSizeInBytes": removedSize,
		  "removedSizeInMB": removedSizeInMB,
		  "removedFileCount": removedFileCount
		])
	  }
	}
  }
  
  @objc
  func clearAllCache(_ resolve: @escaping RCTPromiseResolveBlock,
					 reject: @escaping RCTPromiseRejectBlock) {
	
	DispatchQueue.global(qos: .utility).async {
	  SDImageCache.shared.clearDisk {
		DispatchQueue.main.async {
		  SDImageCache.shared.clearMemory()
		  resolve(["success": true])
		}
	  }
	}
  }
}
