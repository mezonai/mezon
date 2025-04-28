import Foundation
import AVFoundation
import CoreBluetooth
import React

@objc(BluetoothModule)
class BluetoothModule: RCTEventEmitter, CBCentralManagerDelegate {
    
    private var centralManager: CBCentralManager?
    private var hasListeners = false
    
    override init() {
        super.init()
        centralManager = CBCentralManager(delegate: self, queue: nil)
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    override func supportedEvents() -> [String] {
        return ["bluetoothHeadsetConnectionChanged"]
    }
    
    override func startObserving() {
        hasListeners = true
    }
    
    override func stopObserving() {
        hasListeners = false
    }
    
    @objc func isBluetoothHeadsetConnected(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        // Check if there's a connected Bluetooth audio device
        let currentRoute = AVAudioSession.sharedInstance().currentRoute
        
        for output in currentRoute.outputs {
            // Check if the output is a Bluetooth device
            if output.portType == AVAudioSession.Port.bluetoothA2DP ||
               output.portType == AVAudioSession.Port.bluetoothHFP ||
               output.portType == AVAudioSession.Port.bluetoothLE {
                resolve(true)
                return
            }
        }
        
        resolve(false)
    }
    
    @objc func startBluetoothListener() {
        // Start observing audio route changes
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(audioRouteChanged),
            name: AVAudioSession.routeChangeNotification,
            object: nil
        )
        
        // Initial setup
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("Failed to set up audio session: \(error)")
        }
    }
    
    @objc func stopBluetoothListener() {
        NotificationCenter.default.removeObserver(
            self,
            name: AVAudioSession.routeChangeNotification,
            object: nil
        )
    }
    
    @objc private func audioRouteChanged(notification: Notification) {
        guard let userInfo = notification.userInfo,
              let reasonValue = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue) else {
            return
        }
        
        // Only care about device added/removed events
        if reason == .newDeviceAvailable || reason == .oldDeviceUnavailable {
            checkForBluetoothHeadset()
        }
    }
    
    private func checkForBluetoothHeadset() {
        let currentRoute = AVAudioSession.sharedInstance().currentRoute
        var hasBluetoothOutput = false
        
        for output in currentRoute.outputs {
            if output.portType == AVAudioSession.Port.bluetoothA2DP ||
               output.portType == AVAudioSession.Port.bluetoothHFP ||
               output.portType == AVAudioSession.Port.bluetoothLE {
                hasBluetoothOutput = true
                break
            }
        }
        
        if hasListeners {
            sendEvent(withName: "bluetoothHeadsetConnectionChanged", body: ["connected": hasBluetoothOutput])
        }
    }
    
    // CBCentralManagerDelegate
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        // You can handle Bluetooth state changes here if needed
    }
}
