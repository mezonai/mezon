import Foundation
import AVFAudio
import PushKit
import CallKit
import React

@objc(VoIPManager)
class VoIPManager: RCTEventEmitter, PKPushRegistryDelegate, CXProviderDelegate {

    private var pushRegistry: PKPushRegistry?
    private var hasListeners = false
    private let notificationDataKey = "notificationDataCalling"
    private let activeCallUUIDKey = "activeCallUUID"

    private var callKitProvider: CXProvider?
    private var callKitCallController: CXCallController?

    override init() {
        super.init()
        setupCallKit()
        setupPushRegistry()
    }

    // MARK: - React Native Bridge Methods

    @objc
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    @objc
    override func supportedEvents() -> [String]! {
        return [
            "VoIPTokenReceived",
            "VoIPNotificationReceived",
            "VoIPCallEnded",
            "VoIPCallAnswered",
            "VoIPCallRejected"
        ]
    }

    override func startObserving() {
        hasListeners = true
    }

    override func stopObserving() {
        hasListeners = false
    }

    // MARK: - Exposed Methods to React Native

    @objc
    func registerForVoIPPushes(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            guard let pushRegistry = self.pushRegistry else {
                reject("NO_REGISTRY", "Push registry not initialized", nil)
                return
            }
            pushRegistry.desiredPushTypes = [.voIP]
            resolve("VoIP registration initiated")
        }
    }

    @objc
    func getVoIPToken(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let pushRegistry = self.pushRegistry else {
            reject("NO_REGISTRY", "Push registry not initialized", nil)
            return
        }

        guard let token = pushRegistry.pushToken(for: .voIP) else {
            reject("NO_TOKEN", "VoIP token not available", nil)
            return
        }

        let tokenString = token.map { String(format: "%02x", $0) }.joined()
        resolve(tokenString)
    }

    @objc
    func getStoredNotificationData(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        if let data = UserDefaults.standard.object(forKey: notificationDataKey) as? [String: Any] {
            resolve(data)
        } else {
            resolve(NSNull())
        }
    }

    @objc
    func clearStoredNotificationData(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        UserDefaults.standard.removeObject(forKey: notificationDataKey)
        UserDefaults.standard.synchronize()
        resolve("Notification data cleared")
    }

    @objc
    func getActiveCallUUID(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        if let uuid = UserDefaults.standard.string(forKey: activeCallUUIDKey) {
            resolve(uuid)
        } else {
            resolve(NSNull())
        }
    }

    private func storeNotificationData(_ data: [String: Any]) {
        UserDefaults.standard.set(data, forKey: notificationDataKey)
        UserDefaults.standard.synchronize()
    }

    private func clearStoredNotificationDataInternal() {
         UserDefaults.standard.removeObject(forKey: notificationDataKey)
         UserDefaults.standard.removeObject(forKey: activeCallUUIDKey)
         UserDefaults.standard.synchronize()
    }

     private func storeActiveCallUUID(_ uuid: String) {
         UserDefaults.standard.set(uuid, forKey: activeCallUUIDKey)
         UserDefaults.standard.synchronize()
     }

     private func getActiveCallUUID() -> String? {
         return UserDefaults.standard.string(forKey: activeCallUUIDKey)
     }

    // MARK: - Private Methods

    private func setupPushRegistry() {
        pushRegistry = PKPushRegistry(queue: DispatchQueue.main)
        pushRegistry?.delegate = self
        pushRegistry?.desiredPushTypes = [.voIP]
    }

    // MARK: - PKPushRegistryDelegate

    func pushRegistry(_ registry: PKPushRegistry, didUpdate pushCredentials: PKPushCredentials, for type: PKPushType) {
        if type == .voIP {
            let token = pushCredentials.token
            let tokenString = token.map { String(format: "%02x", $0) }.joined()

            if hasListeners {
                sendEvent(withName: "VoIPTokenReceived", body: ["token": tokenString])
            }
        }
    }

    func pushRegistry(_ registry: PKPushRegistry, didInvalidatePushTokenFor type: PKPushType) {
        // Token invalidated
    }

    func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType, completion: @escaping () -> Void) {
        if type == .voIP {
            handleVoIPNotification(payload: payload, completion: completion)
        }
    }

    // iOS 11+ method
    func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType) {
        if type == .voIP {
            handleVoIPNotification(payload: payload) { }
        }
    }

  @objc
  func endCurrentCallKeep(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
      if let activeUUIDString = getActiveCallUUID(), let uuid = UUID(uuidString: activeUUIDString) {
          let endCallAction = CXEndCallAction(call: uuid)
          let transaction = CXTransaction(action: endCallAction)

          callKitCallController?.request(transaction) { error in
              if let error = error {
                  reject("END_CALL_ERROR", error.localizedDescription, error)
              } else {
                  self.clearStoredNotificationDataInternal()
                  resolve("Call ended successfully")
              }
          }
      } else {
          reject("NO_ACTIVE_CALL", "No active call UUID found", nil)
      }
  }

    // MARK: - VoIP Notification Handling

    private func handleVoIPNotification(payload: PKPushPayload, completion: @escaping () -> Void) {
        let appState = UIApplication.shared.applicationState
        let payloadDict = payload.dictionaryPayload

         // Only proceed if the app is in the background or killed
        guard appState == .background else {
           completion()
           return
        }

        guard let offerValue = payloadDict["offer"] else {
            return
        }
        let callUUID = UUID().uuidString

        var callerName = "Unknown"
        var offer = ""
        var callerAvatar = ""
        var callerId = ""
        var channelId = ""

        if let offerString = offerValue as? String,
           let offerData = offerString.data(using: .utf8),
           let offerDict = try? JSONSerialization.jsonObject(with: offerData) as? [String: Any] {
            offer = offerDict["offer"] as? String ?? ""
            callerName = offerDict["callerName"] as? String ?? "Unknown"
            callerAvatar = offerDict["callerAvatar"] as? String ?? ""
            callerId = offerDict["callerId"] as? String ?? ""
            channelId = offerDict["channelId"] as? String ?? ""
        } else if let offerDict = offerValue as? [String: Any] {
            offer = offerDict["offer"] as? String ?? ""
            callerName = offerDict["callerName"] as? String ?? "Unknown"
            callerAvatar = offerDict["callerAvatar"] as? String ?? ""
            callerId = offerDict["callerId"] as? String ?? ""
            channelId = offerDict["channelId"] as? String ?? ""
        } else {
            completion()
            return
        }

        if offer == "CANCEL_CALL" {
            if let activeUUIDString = getActiveCallUUID(), let uuid = UUID(uuidString: activeUUIDString) {
                let endCallAction = CXEndCallAction(call: uuid)
                let transaction = CXTransaction(action: endCallAction)
                callKitCallController?.request(transaction) { _ in
                    self.clearStoredNotificationDataInternal()
                }
            } else {
                clearStoredNotificationDataInternal()
            }
            completion()
            return
        }

        // Prepare notification data to store
         let notificationData: [String: Any] = [
             "callerId": callerId,
             "callerName": callerName,
             "callerAvatar": callerAvatar,
             "channelId": channelId,
             "callUUID": callUUID,
             "offer": offer
         ]

        storeNotificationData(notificationData)
        storeActiveCallUUID(callUUID)

        // Report the incoming call to CallKit - THIS IS MANDATORY to avoid crash
        let update = CXCallUpdate()
        update.remoteHandle = CXHandle(type: .generic, value: callerId.isEmpty ? callerName : callerId)
        update.localizedCallerName = callerName
        update.hasVideo = true  // Set to true to require unlock, but won't show "Video" label since config.supportsVideo = false
        update.supportsHolding = true
        update.supportsDTMF = true
        update.supportsGrouping = false
        update.supportsUngrouping = false

        guard let uuid = UUID(uuidString: callUUID) else {
            completion()
            return
        }

        callKitProvider?.reportNewIncomingCall(with: uuid, update: update) { error in
            if error != nil {
                self.clearStoredNotificationDataInternal()
            }
            completion()
        }
    }

    // MARK: - CallKit Setup

    private func setupCallKit() {
        let config = CXProviderConfiguration(localizedName: "Mezon has an incoming call")
        config.supportsVideo = true
        config.maximumCallsPerCallGroup = 1
        config.supportedHandleTypes = [.generic]

        config.ringtoneSound = "ringing.mp3"

        callKitProvider = CXProvider(configuration: config)
        callKitProvider?.setDelegate(self, queue: nil)

        callKitCallController = CXCallController()
    }

    // MARK: - CXProviderDelegate Methods

    func providerDidReset(_ provider: CXProvider) {
        clearStoredNotificationDataInternal()
    }

    func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        if let data = UserDefaults.standard.object(forKey: notificationDataKey) as? [String: Any] {
            if hasListeners {
                sendEvent(withName: "VoIPCallAnswered", body: data)
            }
        }
        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        clearStoredNotificationDataInternal()

        if hasListeners {
            sendEvent(withName: "VoIPCallEnded", body: ["callUUID": action.callUUID.uuidString])
        }

        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXStartCallAction) {
        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXSetHeldCallAction) {
        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXSetMutedCallAction) {
        action.fulfill()
    }

    func provider(_ provider: CXProvider, timedOutPerforming action: CXAction) {
        clearStoredNotificationDataInternal()

        if hasListeners {
            sendEvent(withName: "VoIPCallEnded", body: ["callUUID": "timeout", "reason": "timeout"])
        }
    }

    func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
        // Audio session activated
    }

    func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) {
        // Audio session deactivated
    }

}
