import UserNotifications
import UIKit

class NotificationService: UNNotificationServiceExtension {
	
	var contentHandler: ((UNNotificationContent) -> Void)?
	var bestAttemptContent: UNMutableNotificationContent?
	
	override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
		self.contentHandler = contentHandler
		bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
		
		guard let bestAttemptContent = bestAttemptContent else {
			contentHandler(request.content)
			return
		}
		
		// Verify app group access
		verifyAppGroupAccess()
		
		// Increment badge count first
		incrementBadgeCount(for: bestAttemptContent)
		
		// Try to find image URL
		if let imageURLString = findImageURL(in: bestAttemptContent.userInfo),
		   let imageURL = URL(string: imageURLString) {
			
			downloadImage(from: imageURL) { [weak self] (attachment) in
				if let attachment = attachment {
					bestAttemptContent.attachments = [attachment]
				}
				contentHandler(bestAttemptContent)
			}
		} else {
			// No image URL found, deliver notification as is
			contentHandler(bestAttemptContent)
		}
	}
	
	override func serviceExtensionTimeWillExpire() {
		if let contentHandler = contentHandler, let bestAttemptContent = bestAttemptContent {
			contentHandler(bestAttemptContent)
		}
	}
	
	// MARK: - Helper Methods
	
	private func verifyAppGroupAccess() {
		let groupIdentifier = "group.mezon.mobile"
		
		if let sharedDefaults = UserDefaults(suiteName: groupIdentifier) {
			// Test write access
			let testKey = "extensionAccessTest"
			let testValue = Date().timeIntervalSince1970
			sharedDefaults.set(testValue, forKey: testKey)
			sharedDefaults.synchronize()
		}
	}
	
	private func findImageURL(in userInfo: [AnyHashable: Any]) -> String? {
		// Check various possible locations for image URL
		let possibleKeys: [(path: String, extract: () -> String?)] = [
			("image", { userInfo["image"] as? String }),
			("imageUrl", { userInfo["imageUrl"] as? String }),
			("image_url", { userInfo["image_url"] as? String }),
			("fcm_options.image", {
				guard let fcmOptions = userInfo["fcm_options"] as? [String: Any] else { return nil }
				return fcmOptions["image"] as? String
			}),
			("aps.image", {
				guard let apsDict = userInfo["aps"] as? [String: Any] else { return nil }
				return apsDict["image"] as? String
			}),
			("data.image", {
				guard let dataDict = userInfo["data"] as? [String: Any] else { return nil }
				return dataDict["image"] as? String
			}),
			("gcm.notification.image", {
				guard let gcmDict = userInfo["gcm.notification"] as? [String: Any] else { return nil }
				return gcmDict["image"] as? String
			})
		]
		
		for (path, extract) in possibleKeys {
			if let imageURL = extract() {
				return imageURL
			}
		}
		
		return nil
	}
	
	private func downloadImage(from url: URL, completion: @escaping (UNNotificationAttachment?) -> Void) {
		// Add timeout configuration for iOS 15-16 compatibility
		let config = URLSessionConfiguration.default
		config.timeoutIntervalForRequest = 25 // Give enough time before extension expires
		config.timeoutIntervalForResource = 25
		let session = URLSession(configuration: config)
		
		let task = session.downloadTask(with: url) { (location, response, error) in
			guard let location = location else {
				completion(nil)
				return
			}
			
			// Get file extension from URL or response
			var fileExtension = url.pathExtension
			if fileExtension.isEmpty {
				if let mimeType = response?.mimeType {
					fileExtension = self.getExtension(for: mimeType)
				} else {
					fileExtension = "jpg"
				}
			}
			
			// Create temporary file URL with better path handling
			let tempDirectory = FileManager.default.temporaryDirectory
			let fileName = UUID().uuidString + "." + fileExtension
			let tempFileURL = tempDirectory.appendingPathComponent(fileName)
			
			do {
				// Remove file if it exists (shouldn't happen with UUID, but just in case)
				if FileManager.default.fileExists(atPath: tempFileURL.path) {
					try FileManager.default.removeItem(at: tempFileURL)
				}
				
				// Move downloaded file to temp location
				try FileManager.default.moveItem(at: location, to: tempFileURL)
				
				// Verify file exists and has content
				let fileAttributes = try FileManager.default.attributesOfItem(atPath: tempFileURL.path)
				let fileSize = fileAttributes[.size] as? Int ?? 0
				
				if fileSize == 0 {
					completion(nil)
					return
				}
				
				// Create notification attachment
				let attachment = try UNNotificationAttachment(
					identifier: "image",
					url: tempFileURL,
					options: [
						UNNotificationAttachmentOptionsTypeHintKey: self.getTypeHint(for: fileExtension)
					]
				)
				
				completion(attachment)
			} catch {
				completion(nil)
			}
		}
		
		task.resume()
	}
	
	private func getExtension(for mimeType: String) -> String {
		switch mimeType {
		case "image/jpeg", "image/jpg":
			return "jpg"
		case "image/png":
			return "png"
		case "image/gif":
			return "gif"
		case "image/webp":
			return "webp"
		default:
			return "jpg"
		}
	}
	
	private func getTypeHint(for fileExtension: String) -> String {
		let typeHint: String
		switch fileExtension.lowercased() {
		case "jpg", "jpeg":
			typeHint = "public.jpeg"
		case "png":
			typeHint = "public.png"
		case "gif":
			typeHint = "com.compuserve.gif"
		case "webp":
			typeHint = "public.webp"
		default:
			typeHint = "public.jpeg"
		}
		
		return typeHint
	}
	
	private func incrementBadgeCount(for content: UNMutableNotificationContent) {
		let groupIdentifier = "group.mezon.mobile"
		
		guard let sharedDefaults = UserDefaults(suiteName: groupIdentifier) else {
			content.badge = NSNumber(value: 1)
			return
		}
		
		let currentBadgeCount = sharedDefaults.integer(forKey: "badgeCount")
		let newBadgeCount = currentBadgeCount + 1
		
		sharedDefaults.set(newBadgeCount, forKey: "badgeCount")
		
		// iOS 15-16: synchronize() is deprecated but can help with reliability
		if #available(iOS 16.0, *) {
			// On iOS 16+, synchronize is not needed
		} else {
			sharedDefaults.synchronize()
		}
		
		content.badge = NSNumber(value: newBadgeCount)
	}
}
