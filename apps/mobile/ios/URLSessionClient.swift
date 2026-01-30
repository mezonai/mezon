import Foundation

@objc(URLSessionClient)
class URLSessionClient: NSObject, URLSessionDataDelegate {

    private var session: URLSession!
    private var pendingRequests: [Int: RequestContext] = [:]
    private let lock = NSLock()

    private class RequestContext {
        var data = Data()
        var response: HTTPURLResponse?
        let resolve: RCTPromiseResolveBlock
        let reject: RCTPromiseRejectBlock
        let isBinary: Bool

        init(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock, isBinary: Bool = false) {
            self.resolve = resolve
            self.reject = reject
            self.isBinary = isBinary
        }
    }

    override init() {
        super.init()

        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        config.httpMaximumConnectionsPerHost = 6

        // Enable HTTP/3 (QUIC) on iOS 15+
        if #available(iOS 15.0, *) {
            if config.responds(to: Selector(("setAssumesHTTP3Capable:"))) {
                config.setValue(true, forKey: "assumesHTTP3Capable")
            }
        }

        self.session = URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }

    // MARK: - React Native Methods

    @objc
    func get(_ url: String,
             headers: NSDictionary?,
             resolve: @escaping RCTPromiseResolveBlock,
             reject: @escaping RCTPromiseRejectBlock) {
        performRequest(method: "GET", url: url, body: nil, headers: headers, resolve: resolve, reject: reject, isBinary: false)
    }

    @objc
    func post(_ url: String,
              body: String?,
              headers: NSDictionary?,
              resolve: @escaping RCTPromiseResolveBlock,
              reject: @escaping RCTPromiseRejectBlock) {
        performRequest(method: "POST", url: url, body: body, headers: headers, resolve: resolve, reject: reject, isBinary: false)
    }

    @objc
    func request(_ method: String,
                 url: String,
                 body: String?,
                 headers: NSDictionary?,
                 resolve: @escaping RCTPromiseResolveBlock,
                 reject: @escaping RCTPromiseRejectBlock) {
        performRequest(method: method.uppercased(), url: url, body: body, headers: headers, resolve: resolve, reject: reject, isBinary: false)
    }

    /// Binary request method - body and response are base64 encoded
    /// Used for protobuf API calls
    @objc
    func requestBinary(_ method: String,
                       url: String,
                       bodyBase64: String?,
                       headers: NSDictionary?,
                       resolve: @escaping RCTPromiseResolveBlock,
                       reject: @escaping RCTPromiseRejectBlock) {
        performRequest(method: method.uppercased(), url: url, body: bodyBase64, headers: headers, resolve: resolve, reject: reject, isBinary: true)
    }

    // MARK: - Private Methods

    private func performRequest(method: String,
                                url: String,
                                body: String?,
                                headers: NSDictionary?,
                                resolve: @escaping RCTPromiseResolveBlock,
                                reject: @escaping RCTPromiseRejectBlock,
                                isBinary: Bool = false) {

        guard let requestURL = URL(string: url) else {
            reject("URLSESSION_ERROR", "Invalid URL: \(url)", nil)
            return
        }

        var request = URLRequest(url: requestURL)
        request.httpMethod = method

        if let headersDict = headers as? [String: String] {
            for (key, value) in headersDict {
                request.setValue(value, forHTTPHeaderField: key)
            }
        }

        if let bodyString = body, ["POST", "PUT", "PATCH"].contains(method) {
            if isBinary {
                // Decode base64 body for binary requests
                if let bodyData = Data(base64Encoded: bodyString) {
                    request.httpBody = bodyData
                }
            } else {
                request.httpBody = bodyString.data(using: .utf8)
            }
            if request.value(forHTTPHeaderField: "Content-Type") == nil {
                request.setValue(isBinary ? "application/proto" : "application/json", forHTTPHeaderField: "Content-Type")
            }
        }

        let task = session.dataTask(with: request)
        let context = RequestContext(resolve: resolve, reject: reject, isBinary: isBinary)

        lock.lock()
        pendingRequests[task.taskIdentifier] = context
        lock.unlock()

        task.resume()
    }

    // MARK: - URLSessionDataDelegate

    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
        lock.lock()
        pendingRequests[dataTask.taskIdentifier]?.data.append(data)
        lock.unlock()
    }

    func urlSession(_ session: URLSession,
                    dataTask: URLSessionDataTask,
                    didReceive response: URLResponse,
                    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void) {
        lock.lock()
        pendingRequests[dataTask.taskIdentifier]?.response = response as? HTTPURLResponse
        lock.unlock()
        completionHandler(.allow)
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        lock.lock()
        guard let context = pendingRequests.removeValue(forKey: task.taskIdentifier) else {
            lock.unlock()
            return
        }
        lock.unlock()

        if let error = error {
            context.reject("URLSESSION_ERROR", error.localizedDescription, error)
            return
        }

        guard let httpResponse = context.response else {
            context.reject("URLSESSION_ERROR", "Invalid response", nil)
            return
        }

        let bodyString: String
        if context.isBinary {
            // Return base64 encoded response for binary requests
            bodyString = context.data.base64EncodedString()
        } else {
            bodyString = String(data: context.data, encoding: .utf8) ?? ""
        }

        let result: [String: Any] = [
            "statusCode": httpResponse.statusCode,
            "body": bodyString
        ]

        context.resolve(result)
    }
}
