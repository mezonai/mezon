import UIKit
import React
import RNCallKeep

@objc(CallScreenViewController)
class CallScreenViewController: UIViewController {
    
    private var reactRootView: RCTRootView?
    private var callData: [String: Any]?
    private var callUUID: String?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        // Hide status bar for full screen call experience
        setNeedsStatusBarAppearanceUpdate()
    }
    
    override var prefersStatusBarHidden: Bool {
        return true
    }
    
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
        return .portrait
    }
    
    private func setupUI() {
        view.backgroundColor = UIColor.black
        
        // Create React Native root view
        let bridge = RCTBridge(delegate: self, launchOptions: nil)
        reactRootView = RCTRootView(bridge: bridge, moduleName: "CallScreen", initialProperties: callData)
        
        if let reactRootView = reactRootView {
            reactRootView.backgroundColor = UIColor.clear
            reactRootView.translatesAutoresizingMaskIntoConstraints = false
            view.addSubview(reactRootView)
            
            NSLayoutConstraint.activate([
                reactRootView.topAnchor.constraint(equalTo: view.topAnchor),
                reactRootView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
                reactRootView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
                reactRootView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
            ])
        }
    }
    
    @objc
    func configureWithCallData(_ data: [String: Any], uuid: String) {
        callData = data
        callUUID = uuid
    }
    
    @objc
    func endCall() {
        if let uuid = callUUID {
            RNCallKeep.endCall(withUUID: uuid, reason: 6)
        }
        dismiss(animated: true)
    }
    
    @objc
    func answerCall() {
        // Handle call answer logic
        if let uuid = callUUID {
            RNCallKeep.answerIncomingCall(withUUID: uuid)
        }
        
        // Send event to React Native
        NotificationCenter.default.post(
            name: NSNotification.Name("CallAnswered"),
            object: nil,
            userInfo: callData
        )
    }
    
    @objc
    func declineCall() {
        if let uuid = callUUID {
            RNCallKeep.endCall(withUUID: uuid, reason: 6)
        }
        dismiss(animated: true)
    }
}

// MARK: - RCTBridgeDelegate
extension CallScreenViewController: RCTBridgeDelegate {
    func sourceURL(for bridge: RCTBridge!) -> URL! {
        #if DEBUG
        return URL(string: "http://localhost:8081/index.bundle?platform=ios&dev=true&minify=false")
        #else
        return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
        #endif
    }
}
